variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for resource deployment"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Application name used as a prefix for all resources"
  type        = string
  default     = "tf-generator"
}

variable "openai_api_key" {
  description = "OpenAI API key stored in Secret Manager"
  type        = string
  sensitive   = true
}

variable "openai_model" {
  description = "OpenAI model to use for code generation"
  type        = string
  default     = "gpt-4o"
}

variable "backend_image" {
  description = "Docker image URI for the backend Cloud Run service"
  type        = string
}

variable "frontend_image" {
  description = "Docker image URI for the frontend Cloud Run service"
  type        = string
}

variable "cors_origins" {
  description = "Comma-separated list of allowed CORS origins"
  type        = string
  default     = "*"
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "info"

  validation {
    condition     = contains(["debug", "info", "warning", "error", "critical"], var.log_level)
    error_message = "log_level must be one of: debug, info, warning, error, critical"
  }
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}
