output "service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.service.uri
}

output "service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_v2_service.service.name
}

output "service_id" {
  description = "Unique identifier of the Cloud Run service"
  value       = google_cloud_run_v2_service.service.id
}

output "latest_revision" {
  description = "Latest ready revision of the service"
  value       = google_cloud_run_v2_service.service.latest_ready_revision
}
