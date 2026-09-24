variable "region" {
  description = "OCI home region for the Always Free A1 instance."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+-[0-9]+$", var.region))
    error_message = "region must look like an OCI region such as ap-singapore-1."
  }
}

variable "compartment_id" {
  description = "OCI compartment OCID. The tenancy root OCID may be used when appropriate."
  type        = string

  validation {
    condition     = startswith(var.compartment_id, "ocid1.")
    error_message = "compartment_id must be an OCI OCID."
  }
}

variable "admin_ssh_cidr" {
  description = "Single trusted administrator IPv4 CIDR for SSH, preferably x.x.x.x/32."
  type        = string

  validation {
    condition = (
      can(cidrhost(var.admin_ssh_cidr, 0)) &&
      can(cidrnetmask(var.admin_ssh_cidr)) &&
      var.admin_ssh_cidr != "0.0.0.0/0"
    )
    error_message = "admin_ssh_cidr must be a valid IPv4 CIDR and cannot be 0.0.0.0/0."
  }
}

variable "ssh_public_key" {
  description = "SSH public key installed for the Ubuntu administrator account."
  type        = string

  validation {
    condition = can(regex(
      "^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(256|384|521)) ",
      trimspace(var.ssh_public_key)
    ))
    error_message = "ssh_public_key must be a supported OpenSSH public key."
  }
}

variable "availability_domain_index" {
  description = "Availability-domain index. Change only when Always Free A1 capacity is unavailable in the first AD."
  type        = number
  default     = 0

  validation {
    condition     = var.availability_domain_index >= 0 && var.availability_domain_index <= 2
    error_message = "availability_domain_index must be 0, 1, or 2."
  }
}

variable "instance_name" {
  description = "OCI display name and DNS label prefix for the Telecom Core host."
  type        = string
  default     = "magnanimous-telecom"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,29}$", var.instance_name))
    error_message = "instance_name must be 3-30 lowercase letters, digits, or hyphens and start with a letter."
  }
}

variable "enable_turn_relay" {
  description = "Open the optional coturn TLS and relay UDP ranges. Keep false for direct public RTP."
  type        = bool
  default     = false
}

variable "repo_url" {
  description = "Public Magnanimous repository cloned by cloud-init."
  type        = string
  default     = "https://github.com/IAMGodmatters/IAMMagnanimousway.js.git"

  validation {
    condition     = startswith(var.repo_url, "https://github.com/")
    error_message = "repo_url must use a public HTTPS GitHub URL."
  }
}

variable "repo_ref" {
  description = "Repository branch or tag cloned during first boot."
  type        = string
  default     = "main"

  validation {
    condition     = length(trimspace(var.repo_ref)) > 0
    error_message = "repo_ref cannot be empty."
  }
}
