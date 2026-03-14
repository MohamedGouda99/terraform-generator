output "backend_url" {
  description = "URL of the backend Cloud Run service"
  value       = module.cloud_run_backend.service_url
}

output "frontend_url" {
  description = "URL of the frontend Cloud Run service"
  value       = module.cloud_run_frontend.service_url
}

output "backend_service_account" {
  description = "Email of the backend service account"
  value       = module.iam.backend_service_account_email
}

output "frontend_service_account" {
  description = "Email of the frontend service account"
  value       = module.iam.frontend_service_account_email
}

output "openai_secret_id" {
  description = "Secret Manager secret ID for the OpenAI API key"
  value       = module.secret_manager.openai_api_key_secret_id
}
