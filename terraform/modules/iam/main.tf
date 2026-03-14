resource "google_service_account" "backend" {
  project      = var.project_id
  account_id   = "tf-generator-backend"
  display_name = "Terraform Generator Backend"
  description  = "Service account for the backend Cloud Run service"
}

resource "google_service_account" "frontend" {
  project      = var.project_id
  account_id   = "tf-generator-frontend"
  display_name = "Terraform Generator Frontend"
  description  = "Service account for the frontend Cloud Run service"
}

resource "google_project_iam_member" "backend_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "frontend_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.frontend.email}"
}
