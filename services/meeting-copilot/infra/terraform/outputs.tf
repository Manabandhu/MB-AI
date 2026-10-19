output "instance_id" {
  value = aws_instance.app.id
}

output "app_url" {
  description = "Where to open the app."
  value       = local.public ? "https://${var.domain_name}" : "http://localhost:8000 (after starting the port-forwarding session below)"
}

output "port_forward_command" {
  description = "Run this, keep it open, then use http://localhost:8000 in your browser and in the desktop recorder."
  value       = "aws ssm start-session --region ${var.region} --target ${aws_instance.app.id} --document-name AWS-StartPortForwardingSession --parameters portNumber=8000,localPortNumber=8000"
}

output "access_token_command" {
  description = "Prints the access token the web app and desktop recorder sign in with."
  value       = "aws ssm get-parameter --region ${var.region} --name ${aws_ssm_parameter.api_token.name} --with-decryption --query Parameter.Value --output text"
}

output "elastic_ip" {
  description = "Point your domain's A record here (only when domain_name is set)."
  value       = local.public ? aws_eip.app[0].public_ip : null
}

output "audio_bucket" {
  value = aws_s3_bucket.audio.id
}

output "setup_log_command" {
  description = "Follow first-boot progress (image builds and model downloads take 15-30 minutes)."
  value       = "aws ssm start-session --region ${var.region} --target ${aws_instance.app.id}   # then: sudo tail -f /var/log/meeting-copilot-setup.log"
}
