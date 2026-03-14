terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "tf-generator-tfstate"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# ──────────────────────────────────────────────
# Enable required GCP APIs
# ──────────────────────────────────────────────
module "apis" {
  source     = "./modules/apis"
  project_id = var.project_id
}

# ──────────────────────────────────────────────
# IAM - Service accounts and bindings
# ──────────────────────────────────────────────
module "iam" {
  source     = "./modules/iam"
  project_id = var.project_id

  depends_on = [module.apis]
}

# ──────────────────────────────────────────────
# Secret Manager - Store API keys securely
# ──────────────────────────────────────────────
module "secret_manager" {
  source          = "./modules/secret-manager"
  project_id      = var.project_id
  openai_api_key  = var.openai_api_key
  service_account = module.iam.backend_service_account_email

  depends_on = [module.apis]
}

# ──────────────────────────────────────────────
# Cloud Run - Backend service
# ──────────────────────────────────────────────
module "cloud_run_backend" {
  source              = "./modules/cloud-run"
  project_id          = var.project_id
  region              = var.region
  service_name        = "${var.app_name}-backend"
  image               = var.backend_image
  port                = 8000
  service_account     = module.iam.backend_service_account_email
  min_instance_count  = var.min_instances
  max_instance_count  = var.max_instances
  cpu                 = "1000m"
  memory              = "512Mi"
  allow_unauthenticated = true

  env_vars = {
    OPENAI_MODEL          = var.openai_model
    TERRAFORM_BINARY_PATH = "/usr/local/bin/terraform"
    CORS_ORIGINS          = var.cors_origins
    LOG_LEVEL             = var.log_level
  }

  secret_env_vars = {
    OPENAI_API_KEY = {
      secret_id = module.secret_manager.openai_api_key_secret_id
      version   = "latest"
    }
  }

  depends_on = [module.apis, module.iam, module.secret_manager]
}

# ──────────────────────────────────────────────
# Cloud Run - Frontend service
# ──────────────────────────────────────────────
module "cloud_run_frontend" {
  source              = "./modules/cloud-run"
  project_id          = var.project_id
  region              = var.region
  service_name        = "${var.app_name}-frontend"
  image               = var.frontend_image
  port                = 3000
  service_account     = module.iam.frontend_service_account_email
  min_instance_count  = var.min_instances
  max_instance_count  = var.max_instances
  cpu                 = "1000m"
  memory              = "256Mi"
  allow_unauthenticated = true

  env_vars = {
    VITE_API_URL = module.cloud_run_backend.service_url
  }

  secret_env_vars = {}

  depends_on = [module.apis, module.iam, module.cloud_run_backend]
}
