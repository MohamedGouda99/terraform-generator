from __future__ import annotations

import json
import re

import structlog
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.core.config import settings
from app.models.schemas import (
    CloudProvider,
    GeneratedFile,
    GenerateRequest,
    GenerateResponse,
    SecurityLevel,
)

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are an expert Terraform engineer who generates production-ready,
security-hardened Terraform code. You follow HashiCorp best practices and
the target cloud provider's Well-Architected Framework.

RULES YOU MUST FOLLOW:
1. Never hardcode secrets, passwords, or API keys. Use variables with
   `sensitive = true` or reference a secrets manager.
2. Enable encryption at rest and in transit for every applicable resource
   (S3 server-side encryption, RDS storage encryption, GCS uniform bucket
   level access, Azure Storage encryption, etc.).
3. Use private subnets for compute and databases. Only load balancers and
   bastion hosts go in public subnets.
4. Apply least-privilege IAM policies. Never use wildcard (*) actions in
   production IAM.
5. Tag every resource with: Project, Environment, ManagedBy=terraform.
6. Use Terraform modules for logical groupings (networking, compute,
   database, etc.).
7. Every variable must have a `description` and a sensible `type`.
   Every output must have a `description`.
8. Pin provider versions with pessimistic constraint (~>).
9. Include `terraform.tfvars.example` with placeholder values and comments.
10. The code MUST pass `terraform validate` when variable values are
    supplied.

OUTPUT FORMAT — you MUST respond with valid JSON and nothing else:
{
  "files": [
    {
      "filename": "provider.tf",
      "content": "...full file content...",
      "description": "Provider configuration and required versions."
    },
    ...more files...
  ],
  "summary": "One-paragraph summary of what was generated.",
  "security_notes": ["Note 1", "Note 2"],
  "estimated_monthly_cost": "$XX–$YY/month" or null if unknown
}

IMPORTANT:
- The `content` field must contain the COMPLETE file — no placeholders,
  no TODO comments, no truncation.
- Use realistic default values in variables (e.g., instance types,
  CIDR blocks).
- Generate AT LEAST: provider.tf, variables.tf, main.tf, outputs.tf,
  terraform.tfvars.example.
- For complex setups generate module directories like
  modules/vpc/main.tf, modules/vpc/variables.tf, etc.
"""

# ---------------------------------------------------------------------------
# Provider-specific context injected into the user prompt
# ---------------------------------------------------------------------------

PROVIDER_CONTEXT: dict[CloudProvider, str] = {
    CloudProvider.aws: """\
AWS-SPECIFIC GUIDANCE:
- Use aws provider with default_tags block.
- VPC: create public + private subnets across at least 2 AZs, NAT gateway
  for private subnet egress, flow logs enabled.
- S3: enable versioning, server-side encryption (AES-256 or KMS),
  block all public access by default.
- RDS: use db_subnet_group in private subnets, storage_encrypted = true,
  multi-az for production, automated backups.
- EKS: use managed node groups in private subnets, enable envelope
  encryption for secrets, IRSA for pod IAM.
- Security groups: minimum required ports only, reference other SGs
  instead of CIDR where possible.
- Use AWS Secrets Manager or SSM Parameter Store for sensitive values.
- IAM: create dedicated roles and policies, never attach
  AdministratorAccess.""",

    CloudProvider.gcp: """\
GCP-SPECIFIC GUIDANCE:
- Use google and google-beta providers.
- VPC: custom mode, private Google access enabled, Cloud NAT for
  egress from private instances, VPC flow logs on.
- GCS: uniform bucket-level access, versioning enabled, encryption
  with Google-managed or CMEK.
- Cloud SQL: private IP only (no public IP), automated backups,
  binary logging, SSL required.
- GKE: private cluster (private nodes + master authorized networks),
  Workload Identity, shielded nodes, release channel.
- Cloud Run: ingress = internal-and-cloud-load-balancing for private
  services, min-instances for latency-sensitive workloads.
- IAM: use custom roles or predefined roles, service accounts with
  minimal permissions, never roles/owner.
- Use Secret Manager for sensitive values.""",

    CloudProvider.azure: """\
AZURE-SPECIFIC GUIDANCE:
- Use azurerm provider with features {} block.
- Virtual Network: create subnets, NSGs per subnet, enable flow logs.
- Storage Account: default to StorageV2, enable blob encryption,
  disable public blob access, enable soft delete.
- Azure SQL / Postgres Flexible Server: private endpoint or VNet
  integration, TDE enabled, geo-redundant backups.
- AKS: private cluster, managed identity, Azure CNI networking,
  RBAC enabled, Azure Policy add-on.
- Key Vault: enable soft delete and purge protection, use RBAC
  authorization, private endpoint.
- IAM: use built-in roles at narrowest scope, never assign Owner at
  subscription level.
- Use Key Vault references for sensitive config.""",
}

# ---------------------------------------------------------------------------
# Security-level addendums
# ---------------------------------------------------------------------------

SECURITY_ADDENDUM: dict[SecurityLevel, str] = {
    SecurityLevel.standard: (
        "Apply standard security best practices as described above."
    ),
    SecurityLevel.strict: """\
STRICT SECURITY MODE — apply ALL of the following in addition to standard
best practices:
- Enable WAF / Cloud Armor / Azure Front Door WAF in front of any
  public-facing endpoint.
- Enable VPC / VNet flow logs and send to a dedicated logging bucket.
- All storage must use customer-managed encryption keys (KMS / CMEK /
  Key Vault).
- Enable Guard­Duty / Security Command Center / Defender for Cloud.
- Enforce MFA-delete on S3 buckets (AWS) or object versioning with
  retention policies (GCP/Azure).
- Restrict SSH/RDP access to a bastion host only; no direct public
  access to compute instances.
- Enable audit logging for all data-plane operations where available.
- Add lifecycle policies to expire old object versions after 90 days.
""",
}

# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class TerraformGenerator:
    def __init__(self) -> None:
        self._llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=0.2,
            max_tokens=settings.max_generation_tokens,
        )

    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        logger.info(
            "generation_started",
            provider=request.cloud_provider.value,
            security=request.security_level.value,
        )

        user_prompt = self._build_user_prompt(request)

        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ]

        response = await self._llm.ainvoke(messages)
        raw = response.content

        parsed = self._parse_response(raw)

        result = GenerateResponse(
            files=parsed["files"],
            summary=parsed["summary"],
            security_notes=parsed["security_notes"],
            estimated_monthly_cost=parsed.get("estimated_monthly_cost"),
            provider=request.cloud_provider.value,
        )

        logger.info(
            "generation_completed",
            id=result.id,
            file_count=len(result.files),
        )
        return result

    # ------------------------------------------------------------------
    # Prompt construction
    # ------------------------------------------------------------------

    @staticmethod
    def _build_user_prompt(request: GenerateRequest) -> str:
        parts: list[str] = []

        parts.append(f"CLOUD PROVIDER: {request.cloud_provider.value.upper()}\n")
        parts.append(PROVIDER_CONTEXT[request.cloud_provider])
        parts.append("")
        parts.append(SECURITY_ADDENDUM[request.security_level])
        parts.append("")
        parts.append(f"USER REQUEST:\n{request.description}")

        if request.requirements:
            parts.append("\nADDITIONAL REQUIREMENTS:")
            for req in request.requirements:
                parts.append(f"- {req}")

        parts.append(
            "\nRespond ONLY with the JSON object described in the system prompt."
        )
        return "\n".join(parts)

    # ------------------------------------------------------------------
    # Response parsing
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_response(raw: str) -> dict:
        """Extract the JSON object from the LLM response, tolerating
        markdown fences and leading/trailing text."""

        # Strip markdown code fences if present
        cleaned = raw.strip()
        fence_match = re.search(r"```(?:json)?\s*\n?(.*?)```", cleaned, re.DOTALL)
        if fence_match:
            cleaned = fence_match.group(1).strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            # Last resort: find first { ... last }
            first = cleaned.find("{")
            last = cleaned.rfind("}")
            if first != -1 and last != -1:
                data = json.loads(cleaned[first : last + 1])
            else:
                raise ValueError("LLM response did not contain valid JSON.")

        # Validate expected keys
        files_raw = data.get("files", [])
        files = [
            GeneratedFile(
                filename=f["filename"],
                content=f["content"],
                description=f.get("description", ""),
            )
            for f in files_raw
        ]
        if not files:
            raise ValueError("LLM returned zero files.")

        return {
            "files": files,
            "summary": data.get("summary", "Terraform code generated successfully."),
            "security_notes": data.get("security_notes", []),
            "estimated_monthly_cost": data.get("estimated_monthly_cost"),
        }


# Module-level singleton
generator = TerraformGenerator()
