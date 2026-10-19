resource "aws_iam_role" "app" {
  name_prefix = "${var.name}-"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_instance_profile" "app" {
  name_prefix = "${var.name}-"
  role        = aws_iam_role.app.name
}

# Session Manager: shell and port forwarding without SSH keys or open ports.
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "app" {
  statement {
    sid       = "AudioBucket"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.audio.arn}/*"]
  }

  statement {
    sid       = "DeployPackage"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.deploy.arn}/*"]
  }

  statement {
    sid     = "Secrets"
    actions = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = [
      "arn:${local.partition}:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter${local.param_path}/*",
    ]
  }

  # Claude and Titan on Bedrock (aws_paid mode). Inference profiles can route across regions,
  # so this is not narrowed to one region; tighten to your chosen model ARNs if you prefer.
  statement {
    sid       = "Bedrock"
    actions   = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "app" {
  name   = "app"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.app.json
}
