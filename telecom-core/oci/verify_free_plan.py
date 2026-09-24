#!/usr/bin/env python3
"""Fail closed when an OCI Terraform plan tries to create outside the free Telecom profile."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ALLOWED_CREATE_TYPES = {
    "oci_core_vcn",
    "oci_core_internet_gateway",
    "oci_core_route_table",
    "oci_core_security_list",
    "oci_core_subnet",
    "oci_core_network_security_group",
    "oci_core_network_security_group_security_rule",
    "oci_core_instance",
}

EXPECTED_SHAPE = "VM.Standard.A1.Flex"
EXPECTED_OCPUS = 2
EXPECTED_MEMORY_GIB = 12
MAX_BOOT_VOLUME_GB = 50


def _first(value):
    return value[0] if isinstance(value, list) and value else {}


def verify(plan: dict) -> list[str]:
    errors: list[str] = []
    instance_creates = 0

    for change in plan.get("resource_changes", []):
        if change.get("mode", "managed") != "managed":
            continue

        resource_type = str(change.get("type") or "")
        actions = list((change.get("change") or {}).get("actions") or [])
        after = (change.get("change") or {}).get("after") or {}

        if "create" in actions and resource_type not in ALLOWED_CREATE_TYPES:
            errors.append(
                f"Unexpected resource create is not allowed by the Always Free guard: {resource_type}"
            )

        if resource_type != "oci_core_instance" or actions == ["delete"]:
            continue

        if "create" in actions:
            instance_creates += 1

        if after.get("shape") != EXPECTED_SHAPE:
            errors.append(
                f"OCI instance shape must be {EXPECTED_SHAPE}; planned {after.get('shape')!r}"
            )

        shape_config = _first(after.get("shape_config"))
        if shape_config.get("ocpus") != EXPECTED_OCPUS:
            errors.append(
                f"OCI A1 OCPUs must be {EXPECTED_OCPUS}; planned {shape_config.get('ocpus')!r}"
            )
        if shape_config.get("memory_in_gbs") != EXPECTED_MEMORY_GIB:
            errors.append(
                "OCI A1 memory must be "
                f"{EXPECTED_MEMORY_GIB} GiB; planned {shape_config.get('memory_in_gbs')!r}"
            )

        source_details = _first(after.get("source_details"))
        boot_size = source_details.get("boot_volume_size_in_gbs")
        if not isinstance(boot_size, (int, float)) or boot_size > MAX_BOOT_VOLUME_GB:
            errors.append(
                f"Boot volume must be <= {MAX_BOOT_VOLUME_GB} GB; planned {boot_size!r}"
            )

        vnic = _first(after.get("create_vnic_details"))
        if vnic.get("assign_public_ip") is not True:
            errors.append("Telecom A1 host must explicitly receive a public IPv4.")

    if instance_creates > 1:
        errors.append(
            f"Only one guarded A1 Telecom instance may be created by this module; planned {instance_creates}."
        )

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: verify_free_plan.py <terraform-show-json-file>", file=sys.stderr)
        return 2

    plan_path = Path(sys.argv[1])
    try:
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Could not read Terraform plan JSON: {exc}", file=sys.stderr)
        return 2

    errors = verify(plan)
    if errors:
        print("OCI Always Free plan guard FAILED:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("OCI Always Free plan guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
