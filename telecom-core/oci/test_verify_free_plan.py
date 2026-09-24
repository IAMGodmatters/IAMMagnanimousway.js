import importlib.util
import pathlib
import unittest


MODULE_PATH = pathlib.Path(__file__).with_name("verify_free_plan.py")
SPEC = importlib.util.spec_from_file_location("verify_free_plan", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


def instance_change(shape="VM.Standard.A1.Flex", ocpus=2, memory=12, boot=50, public=True):
    return {
        "mode": "managed",
        "type": "oci_core_instance",
        "change": {
            "actions": ["create"],
            "after": {
                "shape": shape,
                "shape_config": [{"ocpus": ocpus, "memory_in_gbs": memory}],
                "source_details": [{"boot_volume_size_in_gbs": boot}],
                "create_vnic_details": [{"assign_public_ip": public}],
            },
        },
    }


class FreePlanGuardTests(unittest.TestCase):
    def test_guard_accepts_exact_free_profile(self):
        plan = {
            "resource_changes": [
                {"mode": "managed", "type": "oci_core_vcn", "change": {"actions": ["create"], "after": {}}},
                instance_change(),
            ]
        }
        self.assertEqual(MODULE.verify(plan), [])

    def test_guard_rejects_paid_shape(self):
        errors = MODULE.verify({"resource_changes": [instance_change(shape="VM.Standard3.Flex")]})
        self.assertTrue(any("shape" in error.lower() for error in errors), errors)

    def test_guard_rejects_oversized_a1(self):
        errors = MODULE.verify({"resource_changes": [instance_change(ocpus=4, memory=24)]})
        self.assertTrue(any("ocpus" in error.lower() for error in errors), errors)
        self.assertTrue(any("memory" in error.lower() for error in errors), errors)

    def test_guard_rejects_large_boot_volume(self):
        errors = MODULE.verify({"resource_changes": [instance_change(boot=250)]})
        self.assertTrue(any("boot volume" in error.lower() for error in errors), errors)

    def test_guard_rejects_private_only_host(self):
        errors = MODULE.verify({"resource_changes": [instance_change(public=False)]})
        self.assertTrue(any("public ipv4" in error.lower() for error in errors), errors)

    def test_guard_rejects_unexpected_billable_resource_type(self):
        plan = {
            "resource_changes": [
                {
                    "mode": "managed",
                    "type": "oci_core_load_balancer",
                    "change": {"actions": ["create"], "after": {}},
                }
            ]
        }
        errors = MODULE.verify(plan)
        self.assertTrue(any("unexpected resource" in error.lower() for error in errors), errors)

    def test_guard_rejects_multiple_instance_creates(self):
        errors = MODULE.verify({"resource_changes": [instance_change(), instance_change()]})
        self.assertTrue(any("only one" in error.lower() for error in errors), errors)


if __name__ == "__main__":
    unittest.main()
