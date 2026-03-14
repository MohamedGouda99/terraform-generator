variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "openai_api_key" {
  description = "OpenAI API key value"
  type        = string
  sensitive   = true
}

variable "service_account" {
  description = "Service account email that needs access to the secret"
  type        = string
}
