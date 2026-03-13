provider "aws" {
  region = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# --- VPC & Networking Setup ---
# Use the default VPC for simplicity on a free tier
data "aws_vpc" "default" {
  default = true
}

# Find subnets in the default VPC
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group for the K3s Node
resource "aws_security_group" "k3s_sg" {
  name        = "k3s-freeteir-sg"
  description = "Security group for K3s Free Tier Node"
  vpc_id      = data.aws_vpc.default.id

  # SSH Access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kubernetes API Access 
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # HTTP Traffic (NodePort range and port 80/443)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound 
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- Compute Setup ---
# Fetch the latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Create the EC2 Instance (t2.micro is free tier eligible)
resource "aws_instance" "k3s_node" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.ssh_key_name
  
  vpc_security_group_ids = [aws_security_group.k3s_sg.id]

  # Allocate basic free tier storage
  root_block_device {
    volume_size = 20 # Free tier includes up to 30GB EBS
    volume_type = "gp2"
  }

  # Script to install K3s on startup
  user_data = <<-EOF
              #!/bin/bash
              # Update OS
              apt-get update && apt-get upgrade -y
              
              # Install K3s (lightweight Kubernetes)
              # Set write-kubeconfig-mode so the ubuntu user can read it
              curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--write-kubeconfig-mode 644 --tls-san $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)" sh -
              
              # Copy config so the default ubuntu user can use kubectl
              mkdir -p /home/ubuntu/.kube
              cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
              chown -R ubuntu:ubuntu /home/ubuntu/.kube
              
              # Wait for node to be ready
              sleep 15
              
              # Output kubeconfig externally (for github actions to fetch later, handled insecurely for simplicity of tutorial)
              cat /etc/rancher/k3s/k3s.yaml > /var/www/html/kubeconfig.yaml 
              chmod 644 /var/www/html/kubeconfig.yaml
              EOF

  tags = {
    Name = "K3s-DevOps-Pipeline-Node"
  }
}

# Output the IP address
output "public_ip" {
  value       = aws_instance.k3s_node.public_ip
  description = "Public IP address of the K3s node"
}
