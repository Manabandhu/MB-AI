variable "region" {
  description = "AWS region. Bedrock model availability varies by region."
  type        = string
  default     = "us-east-1"
}

variable "name" {
  description = "Prefix for resource names."
  type        = string
  default     = "meeting-copilot"
}

variable "providers_mode" {
  description = <<-EOT
    open_source: faster-whisper + pyannote + Ollama (gpt-oss, nomic-embed-text) on the instance. Needs a GPU instance.
    aws_paid:    Deepgram for speech, Claude and Titan on Bedrock. Runs on a small CPU instance.
  EOT
  type        = string
  default     = "open_source"
  validation {
    condition     = contains(["open_source", "aws_paid"], var.providers_mode)
    error_message = "providers_mode must be open_source or aws_paid."
  }
}

variable "instance_type" {
  description = "Leave empty for g6.xlarge (L4 GPU) in open_source mode or t3.large in aws_paid mode."
  type        = string
  default     = ""
}

variable "root_volume_gb" {
  description = "Root disk: Docker images, model weights, Postgres."
  type        = number
  default     = 150
}

variable "owner_name" {
  description = "Your name as it appears in transcripts."
  type        = string
  default     = "Me"
}

variable "audio_retention_days" {
  description = "Days to keep audio. Transcripts and summaries are kept. S3 expires objects a day after this as a backstop."
  type        = number
  default     = 30
}

variable "glossary" {
  description = "Comma-separated team terms the transcriber should spell right."
  type        = string
  default     = ""
}

variable "hf_token" {
  description = "Hugging Face token for pyannote (open_source mode). Accept the model's terms on Hugging Face first."
  type        = string
  default     = ""
  sensitive   = true
}

variable "deepgram_api_key" {
  description = "Deepgram key (aws_paid mode)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "bedrock_model_id" {
  description = "Claude model or inference profile ID from the Bedrock console (aws_paid mode). Enable model access first."
  type        = string
  default     = ""
}

variable "domain_name" {
  description = <<-EOT
    Optional. A DNS name you will point at the instance's Elastic IP. When set, ports 80 and 443 open to the
    internet and Caddy serves the app over HTTPS (the app still requires the access token).
    When empty, nothing is exposed: reach the app through an SSM port-forwarding session.
  EOT
  type        = string
  default     = ""
}

variable "subnet_id" {
  description = "Optional subnet (with outbound internet). Defaults to a subnet in the default VPC."
  type        = string
  default     = ""
}

variable "snapshot_retention_count" {
  description = "Daily snapshots of the instance disk to keep (Postgres lives there)."
  type        = number
  default     = 7
}

variable "oidc_issuer" {
  description = "Optional single sign-on: the OIDC issuer URL (Keycloak realm, Cognito user pool, Entra ID tenant...)."
  type        = string
  default     = ""
}

variable "oidc_client_id" {
  description = "The public web client registered with the OIDC provider (redirect URI https://<domain>/auth/callback)."
  type        = string
  default     = ""
}

variable "oidc_allowed_domains" {
  description = "Comma-separated email domains allowed to sign in with SSO. Empty allows any."
  type        = string
  default     = ""
}

variable "bot_provider" {
  description = "Meeting bot for Teams/Zoom/Meet: none, attendee, vexa or recall. Bots need domain_name so webhooks can reach the app."
  type        = string
  default     = "none"
  validation {
    condition     = contains(["none", "attendee", "vexa", "recall"], var.bot_provider)
    error_message = "bot_provider must be none, attendee, vexa or recall."
  }
}

variable "bot_api_key" {
  description = "API key for the bot provider (stored in SSM Parameter Store)."
  type        = string
  default     = ""
  sensitive   = true
}
