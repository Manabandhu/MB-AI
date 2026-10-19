data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

locals {
  partition   = data.aws_partition.current.partition
  gpu         = var.providers_mode == "open_source"
  public      = var.domain_name != ""
  param_path  = "/${var.name}"
  repo_root   = abspath("${path.module}/../..")
  backup_tags = { Backup = "${var.name}-daily" }
}

resource "random_id" "suffix" {
  byte_length = 4
}

# ---------------------------------------------------------------- secrets (SSM Parameter Store)

resource "random_password" "api_token" {
  length  = 40
  special = false
}

resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "aws_ssm_parameter" "api_token" {
  name  = "${local.param_path}/api-token"
  type  = "SecureString"
  value = random_password.api_token.result
}

resource "aws_ssm_parameter" "postgres" {
  name  = "${local.param_path}/postgres-password"
  type  = "SecureString"
  value = random_password.postgres.result
}

resource "aws_ssm_parameter" "hf_token" {
  name  = "${local.param_path}/hf-token"
  type  = "SecureString"
  value = var.hf_token == "" ? "unset" : var.hf_token
}

resource "aws_ssm_parameter" "deepgram" {
  name  = "${local.param_path}/deepgram-api-key"
  type  = "SecureString"
  value = var.deepgram_api_key == "" ? "unset" : var.deepgram_api_key
}

# ---------------------------------------------------------------- storage

resource "aws_s3_bucket" "audio" {
  bucket        = "${var.name}-audio-${random_id.suffix.hex}"
  force_destroy = false
}

resource "aws_s3_bucket_public_access_block" "audio" {
  bucket                  = aws_s3_bucket.audio.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audio" {
  bucket = aws_s3_bucket.audio.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "audio" {
  count  = var.audio_retention_days > 0 ? 1 : 0
  bucket = aws_s3_bucket.audio.id
  rule {
    id     = "expire-audio"
    status = "Enabled"
    filter {}
    expiration {
      days = var.audio_retention_days + 1
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 2
    }
  }
}

resource "aws_s3_bucket_policy" "audio_tls_only" {
  bucket = aws_s3_bucket.audio.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyInsecureTransport"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = [aws_s3_bucket.audio.arn, "${aws_s3_bucket.audio.arn}/*"]
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.audio]
}

# The app's source, uploaded so the instance can build it without git credentials.
resource "aws_s3_bucket" "deploy" {
  bucket        = "${var.name}-deploy-${random_id.suffix.hex}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "deploy" {
  bucket                  = aws_s3_bucket.deploy.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "archive_file" "app" {
  type        = "zip"
  source_dir  = local.repo_root
  output_path = "${path.module}/.build/app.zip"
  excludes = [
    ".git/**",
    ".github/**",
    ".env",
    "infra/**",
    "desktop/**",
    "**/node_modules/**",
    "**/dist/**",
    "**/__pycache__/**",
    "**/.pytest_cache/**",
    "**/.ruff_cache/**",
    "**/.venv/**",
    "**/data/**",
  ]
}

resource "aws_s3_object" "app" {
  bucket = aws_s3_bucket.deploy.id
  key    = "app.zip"
  source = data.archive_file.app.output_path
  etag   = data.archive_file.app.output_md5
}

# ---------------------------------------------------------------- network

data "aws_vpc" "default" {
  count   = var.subnet_id == "" ? 1 : 0
  default = true
}

data "aws_subnets" "default" {
  count = var.subnet_id == "" ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default[0].id]
  }
  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

data "aws_subnet" "selected" {
  id = var.subnet_id != "" ? var.subnet_id : sort(data.aws_subnets.default[0].ids)[0]
}

resource "aws_security_group" "app" {
  name_prefix = "${var.name}-"
  description = "Meeting Copilot. No inbound unless a domain is configured; admin access is through SSM."
  vpc_id      = data.aws_subnet.selected.vpc_id

  dynamic "ingress" {
    for_each = local.public ? [80, 443] : []
    content {
      description = "HTTPS (Caddy). Port 80 is needed for certificate issuance and redirects."
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  egress {
    description = "Package installs, model downloads, AWS APIs, paid model APIs"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ---------------------------------------------------------------- instance

data "aws_ami" "gpu" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["Deep Learning Base OSS Nvidia Driver GPU AMI (Ubuntu 22.04) *"]
  }
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720108477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

locals {
  env = {
    OWNER_NAME           = var.owner_name
    STORAGE_BACKEND      = "s3"
    S3_BUCKET            = aws_s3_bucket.audio.id
    AWS_REGION           = var.region
    AUDIO_RETENTION_DAYS = tostring(var.audio_retention_days)
    GLOSSARY             = var.glossary
    DOMAIN               = var.domain_name
    STT_PROVIDER         = local.gpu ? "faster_whisper" : "deepgram"
    DIARIZER             = local.gpu ? "pyannote" : "none"
    LLM_PROVIDER         = local.gpu ? "openai_compat" : "bedrock"
    EMBED_PROVIDER       = local.gpu ? "openai_compat" : "bedrock"
    EMBED_DIM            = local.gpu ? "768" : "1024"
    BEDROCK_MODEL_ID     = var.bedrock_model_id
  }
}

resource "aws_instance" "app" {
  ami                         = local.gpu ? data.aws_ami.gpu.id : data.aws_ami.ubuntu.id
  instance_type               = var.instance_type != "" ? var.instance_type : (local.gpu ? "g6.xlarge" : "t3.large")
  subnet_id                   = data.aws_subnet.selected.id
  vpc_security_group_ids      = [aws_security_group.app.id]
  iam_instance_profile        = aws_iam_instance_profile.app.name
  associate_public_ip_address = true

  metadata_options {
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 2
  }

  root_block_device {
    volume_size = var.root_volume_gb
    volume_type = "gp3"
    encrypted   = true
    tags        = merge(local.backup_tags, { Name = "${var.name}-root" })
  }

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    region         = var.region
    deploy_bucket  = aws_s3_bucket.deploy.id
    param_path     = local.param_path
    gpu            = local.gpu
    public         = local.public
    env            = local.env
    install_docker = !local.gpu # the Deep Learning AMI already has Docker and the NVIDIA toolkit
  })

  tags = { Name = var.name }

  lifecycle {
    # Updates are rolled out with redeploy.sh, not by replacing the instance (Postgres lives on it).
    ignore_changes = [ami, user_data]
  }

  depends_on = [aws_s3_object.app]
}

resource "aws_eip" "app" {
  count    = local.public ? 1 : 0
  instance = aws_instance.app.id
  domain   = "vpc"
  tags     = { Name = var.name }
}

# ---------------------------------------------------------------- daily disk snapshots

resource "aws_iam_role" "dlm" {
  name_prefix = "${var.name}-dlm-"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "dlm.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy_attachment" "dlm" {
  role       = aws_iam_role.dlm.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

resource "aws_dlm_lifecycle_policy" "daily" {
  description        = "${var.name} daily disk snapshots"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]
    target_tags    = local.backup_tags

    schedule {
      name = "daily"
      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["07:00"]
      }
      retain_rule {
        count = var.snapshot_retention_count
      }
      copy_tags = true
    }
  }
}
