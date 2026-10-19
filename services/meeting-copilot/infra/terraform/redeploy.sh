#!/usr/bin/env bash
# Ship code changes to the running instance without replacing it (your data stays).
#   1. terraform apply uploads a fresh app.zip to S3
#   2. SSM runs the on-instance deploy script, which rebuilds and restarts the containers
set -euo pipefail
cd "$(dirname "$0")"
terraform apply -auto-approve -target=aws_s3_object.app
INSTANCE=$(terraform output -raw instance_id)
REGION=$(terraform output -raw port_forward_command | sed -E 's/.*--region ([^ ]+).*/\1/')
CMD_ID=$(aws ssm send-command --region "$REGION" --instance-ids "$INSTANCE" \
  --document-name AWS-RunShellScript \
  --parameters 'commands=["/usr/local/bin/meeting-copilot-deploy"],executionTimeout=["3600"]' \
  --query Command.CommandId --output text)
echo "Deploying (command $CMD_ID)…"
aws ssm wait command-executed --region "$REGION" --command-id "$CMD_ID" --instance-id "$INSTANCE" || true
aws ssm get-command-invocation --region "$REGION" --command-id "$CMD_ID" --instance-id "$INSTANCE" \
  --query '[Status, StandardOutputContent]' --output text | tail -20
