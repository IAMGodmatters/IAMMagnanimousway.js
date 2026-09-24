output "public_ip" {
  description = "Ephemeral public IPv4 assigned to the guarded OCI Telecom Core host."
  value       = oci_core_instance.telecom.public_ip
}

output "instance_id" {
  description = "OCI instance OCID."
  value       = oci_core_instance.telecom.id
}

output "ubuntu_image" {
  description = "Ubuntu image selected for the A1 host."
  value       = data.oci_core_images.ubuntu.images[0].display_name
}

output "ssh_command" {
  description = "Administrator SSH command."
  value       = "ssh ubuntu@${oci_core_instance.telecom.public_ip}"
}

output "dns_a_record" {
  description = "Public IPv4 to use for the Telecom hostname A record."
  value       = oci_core_instance.telecom.public_ip
}

output "preflight_command" {
  description = "Read-only host preflight to run after cloud-init."
  value       = "cd /opt/IAMMagnanimousway.js && bash telecom-core/deploy/oci-always-free-preflight.sh"
}

output "next_activation_step" {
  description = "Truth-preserving next action after DNS points to the public IP."
  value       = "Run telecom-core/deploy/bootstrap-public-host.sh, configure protected telecom-core/.env credentials, then run Public Telecom WebRTC Verification before enabling TELECOM_NATIVE_WEBRTC_LIVE."
}
