locals {
  instance_shape = "VM.Standard.A1.Flex"
  ocpus          = 2
  memory_gib     = 12
  boot_volume_gb = 50

  vcn_cidr    = "10.42.0.0/16"
  subnet_cidr = "10.42.10.0/24"

  tcp_ingress = merge(
    {
      ssh = {
        source = var.admin_ssh_cidr
        min    = 22
        max    = 22
      }
      acme_http = {
        source = "0.0.0.0/0"
        min    = 80
        max    = 80
      }
      asterisk_wss = {
        source = "0.0.0.0/0"
        min    = 8089
        max    = 8089
      }
    },
    var.enable_turn_relay ? {
      turn_tls = {
        source = "0.0.0.0/0"
        min    = 5349
        max    = 5349
      }
    } : {}
  )

  udp_ingress = merge(
    {
      asterisk_rtp = {
        source = "0.0.0.0/0"
        min    = 10000
        max    = 20000
      }
    },
    var.enable_turn_relay ? {
      turn_relay = {
        source = "0.0.0.0/0"
        min    = 49160
        max    = 49260
      }
    } : {}
  )
}

check "always_free_profile" {
  assert {
    condition = (
      local.instance_shape == "VM.Standard.A1.Flex" &&
      local.ocpus == 2 &&
      local.memory_gib == 12 &&
      local.boot_volume_gb == 50
    )
    error_message = "Magnanimous OCI Telecom must remain on the guarded Always Free A1 2 OCPU / 12 GiB / 50 GB profile."
  }
}

data "oci_identity_availability_domains" "available" {
  compartment_id = var.compartment_id
}

check "availability_domain_exists" {
  assert {
    condition     = length(data.oci_identity_availability_domains.available.availability_domains) > var.availability_domain_index
    error_message = "The requested availability_domain_index does not exist in this OCI region."
  }
}

data "oci_core_images" "ubuntu" {
  compartment_id           = var.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = local.instance_shape
  state                    = "AVAILABLE"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

check "ubuntu_a1_image_exists" {
  assert {
    condition     = length(data.oci_core_images.ubuntu.images) > 0
    error_message = "No Ubuntu 24.04 image compatible with VM.Standard.A1.Flex was found in this region."
  }
}

resource "oci_core_vcn" "telecom" {
  compartment_id = var.compartment_id
  cidr_block     = local.vcn_cidr
  display_name   = "${var.instance_name}-vcn"
  dns_label      = "magnanimous"

  freeform_tags = {
    "MagnanimousRole" = "telecom-core"
    "CostGuard"       = "always-free-a1-only"
  }
}

resource "oci_core_internet_gateway" "telecom" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.telecom.id
  display_name   = "${var.instance_name}-internet-gateway"
  enabled        = true
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.telecom.id
  display_name   = "${var.instance_name}-public-routes"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.telecom.id
  }
}

resource "oci_core_security_list" "telecom" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.telecom.id
  display_name   = "${var.instance_name}-minimal-security-list"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.telecom.id
  cidr_block                 = local.subnet_cidr
  display_name               = "${var.instance_name}-public-subnet"
  dns_label                  = "telecom"
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.telecom.id]
}

resource "oci_core_network_security_group" "telecom" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.telecom.id
  display_name   = "${var.instance_name}-nsg"
}

resource "oci_core_network_security_group_security_rule" "tcp_ingress" {
  for_each = local.tcp_ingress

  network_security_group_id = oci_core_network_security_group.telecom.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = each.value.source
  source_type               = "CIDR_BLOCK"
  stateless                 = false

  tcp_options {
    destination_port_range {
      min = each.value.min
      max = each.value.max
    }
  }
}

resource "oci_core_network_security_group_security_rule" "udp_ingress" {
  for_each = local.udp_ingress

  network_security_group_id = oci_core_network_security_group.telecom.id
  direction                 = "INGRESS"
  protocol                  = "17"
  source                    = each.value.source
  source_type               = "CIDR_BLOCK"
  stateless                 = false

  udp_options {
    destination_port_range {
      min = each.value.min
      max = each.value.max
    }
  }
}

resource "oci_core_network_security_group_security_rule" "icmp_mtu" {
  network_security_group_id = oci_core_network_security_group.telecom.id
  direction                 = "INGRESS"
  protocol                  = "1"
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  stateless                 = false

  icmp_options {
    type = 3
    code = 4
  }
}

resource "oci_core_network_security_group_security_rule" "egress" {
  network_security_group_id = oci_core_network_security_group.telecom.id
  direction                 = "EGRESS"
  protocol                  = "all"
  destination               = "0.0.0.0/0"
  destination_type          = "CIDR_BLOCK"
  stateless                 = false
}

resource "oci_core_instance" "telecom" {
  availability_domain = data.oci_identity_availability_domains.available.availability_domains[var.availability_domain_index].name
  compartment_id      = var.compartment_id
  display_name        = var.instance_name
  shape               = local.instance_shape

  shape_config {
    ocpus         = local.ocpus
    memory_in_gbs = local.memory_gib
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu.images[0].id
    boot_volume_size_in_gbs = local.boot_volume_gb
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    assign_public_ip = true
    hostname_label   = var.instance_name
    nsg_ids          = [oci_core_network_security_group.telecom.id]
  }

  metadata = {
    ssh_authorized_keys = trimspace(var.ssh_public_key)
    user_data = base64encode(templatefile("${path.module}/cloud-init.yaml.tftpl", {
      repo_url = var.repo_url
      repo_ref = var.repo_ref
    }))
  }

  freeform_tags = {
    "MagnanimousRole" = "telecom-core"
    "CostGuard"       = "always-free-a1-only"
    "LiveGate"        = "external-webrtc-proof-required"
  }

  lifecycle {
    precondition {
      condition = (
        local.instance_shape == "VM.Standard.A1.Flex" &&
        local.ocpus == 2 &&
        local.memory_gib == 12 &&
        local.boot_volume_gb == 50
      )
      error_message = "Refusing OCI instance creation outside the guarded Always Free A1 profile."
    }
  }
}
