variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "Type of EC2 instance to provision (must be free tier eligible)"
  type        = string
  default     = "t3.micro" 
}

variable "ssh_key_name" {
  description = "Name of the existing AWS Key Pair to allow SSH access to the node"
  type        = string
  default     = "pipeline-keypairs" # We will have the user create this!
}

variable "aws_access_key" {
  description = "AWS access key"
  type        = string
  default     = "AKIAYGPJ7JOS34QN5ZF3"
}

variable "aws_secret_key" {
  description = "AWS secret key"
  type        = string
  default     = "DLVzAHytdd6UrwGWKPEfKe6iiv6/GsbKH10X1zVm"
}
