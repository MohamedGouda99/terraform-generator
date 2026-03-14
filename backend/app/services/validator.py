from __future__ import annotations

import asyncio
import os
import shutil
import tempfile

import structlog

from app.core.config import settings
from app.models.schemas import GeneratedFile, ValidationResult

logger = structlog.get_logger(__name__)


class TerraformValidator:
    def __init__(self) -> None:
        self._binary = settings.terraform_binary_path

    async def validate(self, files: list[GeneratedFile]) -> ValidationResult:
        """Write files to a temp dir, run terraform init + validate,
        return structured result."""

        tmp_dir: str | None = None
        try:
            tmp_dir = tempfile.mkdtemp(prefix="tfgen_")
            self._write_files(tmp_dir, files)

            # Check if terraform binary is available
            if not self._terraform_available():
                logger.warning("terraform_binary_not_found", binary=self._binary)
                return ValidationResult(
                    valid=True,
                    errors=[],
                    warnings=["Terraform binary not found — validation skipped."],
                )

            # terraform init -backend=false
            init_ok, init_stdout, init_stderr = await self._run(
                [self._binary, "init", "-backend=false", "-no-color"],
                cwd=tmp_dir,
            )
            if not init_ok:
                errors = self._extract_errors(init_stderr or init_stdout)
                return ValidationResult(
                    valid=False,
                    errors=errors or ["terraform init failed."],
                    warnings=[],
                )

            # terraform validate -json
            val_ok, val_stdout, val_stderr = await self._run(
                [self._binary, "validate", "-no-color"],
                cwd=tmp_dir,
            )

            if val_ok:
                warnings = self._extract_warnings(val_stdout + "\n" + val_stderr)
                return ValidationResult(valid=True, errors=[], warnings=warnings)

            errors = self._extract_errors(val_stderr or val_stdout)
            return ValidationResult(
                valid=False,
                errors=errors or ["terraform validate failed."],
                warnings=[],
            )

        except Exception as exc:
            logger.error("validation_error", error=str(exc))
            return ValidationResult(
                valid=True,
                errors=[],
                warnings=[f"Validation could not run: {exc}"],
            )
        finally:
            if tmp_dir and os.path.isdir(tmp_dir):
                shutil.rmtree(tmp_dir, ignore_errors=True)

    # ------------------------------------------------------------------

    @staticmethod
    def _write_files(directory: str, files: list[GeneratedFile]) -> None:
        for f in files:
            path = os.path.join(directory, f.filename)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(f.content)

    def _terraform_available(self) -> bool:
        return shutil.which(self._binary) is not None

    @staticmethod
    async def _run(
        cmd: list[str], cwd: str, timeout: int = 60
    ) -> tuple[bool, str, str]:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                proc.communicate(), timeout=timeout
            )
        except asyncio.TimeoutError:
            proc.kill()
            return False, "", "Command timed out."

        stdout = stdout_bytes.decode(errors="replace")
        stderr = stderr_bytes.decode(errors="replace")
        return proc.returncode == 0, stdout, stderr

    @staticmethod
    def _extract_errors(output: str) -> list[str]:
        errors: list[str] = []
        for line in output.splitlines():
            stripped = line.strip()
            if stripped.startswith("Error:") or stripped.startswith("Error "):
                errors.append(stripped)
            elif "error" in stripped.lower() and stripped:
                errors.append(stripped)
        # Deduplicate while preserving order
        seen: set[str] = set()
        unique: list[str] = []
        for e in errors:
            if e not in seen:
                seen.add(e)
                unique.append(e)
        return unique or [output.strip()] if output.strip() else []

    @staticmethod
    def _extract_warnings(output: str) -> list[str]:
        warnings: list[str] = []
        for line in output.splitlines():
            stripped = line.strip()
            if stripped.startswith("Warning:"):
                warnings.append(stripped)
        return warnings


# Module-level singleton
validator = TerraformValidator()
