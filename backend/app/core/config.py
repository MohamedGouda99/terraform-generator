from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "Terraform Code Generator"
    debug: bool = False

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    terraform_binary_path: str = "terraform"

    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    max_generation_tokens: int = 4096

    log_level: str = "INFO"


settings = Settings()
