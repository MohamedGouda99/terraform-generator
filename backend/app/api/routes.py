from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.models.schemas import (
    GenerateRequest,
    GenerateResponse,
    GenerationHistory,
    TemplateInfo,
    ValidateRequest,
    ValidationResult,
)
from app.services.generator import generator
from app.services.history import history_store
from app.services.packager import create_zip
from app.services.validator import validator

router = APIRouter()

# ---------------------------------------------------------------------------
# Templates — curated prompts shown in the UI
# ---------------------------------------------------------------------------

TEMPLATES: list[TemplateInfo] = [
    TemplateInfo(
        name="AWS VPC + EKS Cluster",
        description="Production VPC with public/private subnets across 3 AZs, NAT gateway, and a managed EKS cluster with a default node group.",
        provider="aws",
        example_prompt="Create a production AWS VPC with public and private subnets in 3 availability zones, a NAT gateway, and an EKS cluster with a managed node group of t3.medium instances.",
    ),
    TemplateInfo(
        name="AWS Static Website (S3 + CloudFront)",
        description="S3 bucket for static assets behind a CloudFront distribution with HTTPS, OAC, and custom domain support.",
        provider="aws",
        example_prompt="Set up an S3 bucket for a static website with CloudFront distribution, HTTPS via ACM certificate, and origin access control.",
    ),
    TemplateInfo(
        name="AWS RDS PostgreSQL + VPC",
        description="Multi-AZ RDS PostgreSQL instance in private subnets with automated backups, encryption, and a bastion host for access.",
        provider="aws",
        example_prompt="Create a VPC with an RDS PostgreSQL 15 Multi-AZ instance in private subnets, encrypted storage, automated backups, and a bastion host in the public subnet for database access.",
    ),
    TemplateInfo(
        name="GCP Cloud Run Service",
        description="Cloud Run service with a custom container image, VPC connector for private resource access, and Cloud Load Balancing.",
        provider="gcp",
        example_prompt="Deploy a Cloud Run service running a custom Docker image with a VPC connector to reach private Cloud SQL, behind a global HTTPS load balancer with a managed SSL certificate.",
    ),
    TemplateInfo(
        name="GCP GKE Autopilot Cluster",
        description="GKE Autopilot cluster with Workload Identity, private nodes, and Cloud NAT for egress.",
        provider="gcp",
        example_prompt="Create a GKE Autopilot private cluster with Workload Identity enabled, master authorized networks, and Cloud NAT for outbound internet access.",
    ),
    TemplateInfo(
        name="Azure AKS Cluster",
        description="AKS cluster with Azure CNI, managed identity, private API server, and Azure Monitor integration.",
        provider="azure",
        example_prompt="Provision an AKS cluster with Azure CNI networking, system-assigned managed identity, a private API server, default node pool of Standard_D2s_v3, and Azure Monitor for containers.",
    ),
    TemplateInfo(
        name="Azure App Service + SQL Database",
        description="App Service Plan with a Linux web app and Azure SQL Database behind a private endpoint.",
        provider="azure",
        example_prompt="Create an Azure App Service (Linux, Python 3.11) with an Azure SQL Database using a private endpoint, Key Vault for connection string storage, and Application Insights.",
    ),
    TemplateInfo(
        name="AWS Lambda API (API Gateway + Lambda + DynamoDB)",
        description="Serverless REST API with API Gateway, Lambda functions, and DynamoDB table.",
        provider="aws",
        example_prompt="Build a serverless REST API with API Gateway HTTP API, a Lambda function (Python 3.12 runtime), and a DynamoDB table with on-demand capacity and point-in-time recovery.",
    ),
]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/generate", response_model=GenerateResponse)
async def generate_terraform(request: GenerateRequest) -> GenerateResponse:
    """Generate Terraform code from a plain-English description."""
    try:
        result = await generator.generate(request)
        history_store.save(result)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}")


@router.post("/validate", response_model=ValidationResult)
async def validate_terraform(request: ValidateRequest) -> ValidationResult:
    """Validate Terraform files by running terraform init + validate."""
    return await validator.validate(request.files)


@router.get("/generate/{generation_id}/download")
async def download_terraform(generation_id: str) -> Response:
    """Download a previously generated Terraform project as a zip file."""
    result = history_store.get(generation_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Generation not found.")

    zip_bytes = create_zip(
        files=result.files,
        provider=result.provider,
        summary=result.summary,
    )
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="terraform-{generation_id}.zip"'
        },
    )


@router.get("/history", response_model=list[GenerationHistory])
async def list_history(limit: int = 20) -> list[GenerationHistory]:
    """List recent generation history."""
    return history_store.list_recent(limit=min(limit, 100))


@router.get("/history/{generation_id}", response_model=GenerateResponse)
async def get_generation(generation_id: str) -> GenerateResponse:
    """Retrieve a specific past generation including all files."""
    result = history_store.get(generation_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Generation not found.")
    return result


@router.get("/templates", response_model=list[TemplateInfo])
async def list_templates() -> list[TemplateInfo]:
    """Return curated template descriptions for UI hints."""
    return TEMPLATES


@router.get("/health")
async def health_check() -> dict:
    return {"status": "healthy"}
