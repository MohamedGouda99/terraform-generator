output "openai_api_key_secret_id" {
  description = "Secret Manager secret ID for the OpenAI API key"
  value       = google_secret_manager_secret.openai_api_key.secret_id
}

output "openai_api_key_secret_name" {
  description = "Full resource name of the OpenAI API key secret"
  value       = google_secret_manager_secret.openai_api_key.name
}
