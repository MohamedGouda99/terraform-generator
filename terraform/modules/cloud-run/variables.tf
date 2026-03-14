variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
}

variable "image" {
  description = "Docker image URI"
  type        = string
}

variable "port" {
  description = "Container port to expose"
  type        = number
}

variable "service_account" {
  description = "Service account email for the Cloud Run service"
  type        = string
}

variable "min_instance_count" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "max_instance_count" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "cpu" {
  description = "CPU allocation (e.g., 1000m)"
  type        = string
  default     = "1000m"
}

variable "memory" {
  description = "Memory allocation (e.g., 512Mi)"
  type        = string
  default     = "512Mi"
}

variable "env_vars" {
  description = "Environment variables as key-value pairs"
  type        = map(string)
  default     = {}
}

variable "secret_env_vars" {
  description = "Secret environment variables referencing Secret Manager"
  type = map(object({
    secret_id = string
    version   = string
  }))
  default = {}
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated access to the service"
  type        = bool
  default     = false
}
