from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class CloudProvider(str, Enum):
    aws = "aws"
    gcp = "gcp"
    azure = "azure"


class SecurityLevel(str, Enum):
    standard = "standard"
    strict = "strict"


# --------------- Request models ---------------


class GenerateRequest(BaseModel):
    description: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Plain-English description of the infrastructure to generate.",
    )
    cloud_provider: CloudProvider = Field(
        default=CloudProvider.aws,
        description="Target cloud provider.",
    )
    requirements: list[str] | None = Field(
        default=None,
        description="Optional extra requirements (e.g. 'must use private subnets').",
    )
    security_level: SecurityLevel = Field(
        default=SecurityLevel.standard,
        description="Security posture for the generated code.",
    )


class ValidateRequest(BaseModel):
    files: list[GeneratedFile] = Field(
        ...,
        description="Terraform files to validate.",
    )


# --------------- Response models ---------------


class GeneratedFile(BaseModel):
    filename: str = Field(..., description="Relative file path, e.g. modules/vpc/main.tf")
    content: str = Field(..., description="Full file content.")
    description: str = Field(..., description="What this file does.")


# Re-declare ValidateRequest after GeneratedFile is defined
ValidateRequest.model_rebuild()


class GenerateResponse(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    files: list[GeneratedFile]
    summary: str
    security_notes: list[str]
    estimated_monthly_cost: str | None = None
    provider: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ValidationResult(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class GenerationHistory(BaseModel):
    id: str
    description: str
    provider: str
    file_count: int
    created_at: datetime
    summary: str


class TemplateInfo(BaseModel):
    name: str
    description: str
    provider: str
    example_prompt: str
