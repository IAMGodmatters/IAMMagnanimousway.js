import random
import unittest

from deltanet_ram_reference import DeltaNetRAMReference


class DeltaNetRAMReferenceTests(unittest.TestCase):
    def test_one_hot_write_and_read_are_exact(self):
        ram = DeltaNetRAMReference(rows=8)
        ram.write_byte(3, 0xA5)
        self.assertEqual(ram.read_byte(3), 0xA5)

    def test_write_only_changes_selected_row(self):
        ram = DeltaNetRAMReference(rows=8)
        ram.write_byte(2, 0x12)
        ram.write_byte(3, 0x34)
        ram.write_byte(2, 0x56)
        self.assertEqual([ram.read_byte(i) for i in range(8)], [0, 0, 0x56, 0x34, 0, 0, 0, 0])

    def test_multi_byte_row(self):
        ram = DeltaNetRAMReference(rows=4, row_width=4)
        ram.write_row(1, b"test")
        self.assertEqual(ram.read_row(1), b"test")
        self.assertEqual(ram.read_row(0), b"\x00" * 4)

    def test_clear_row(self):
        ram = DeltaNetRAMReference(rows=4)
        ram.write_byte(1, 255)
        ram.clear_row(1)
        self.assertEqual(ram.read_byte(1), 0)

    def test_rejects_invalid_address_and_width(self):
        ram = DeltaNetRAMReference(rows=4)
        with self.assertRaises(IndexError):
            ram.read_row(4)
        with self.assertRaises(IndexError):
            ram.read_row(-1)
        with self.assertRaises(ValueError):
            ram.write_row(0, b"too wide")

    def test_randomized_operations_match_plain_memory(self):
        rng = random.Random(20261103)
        ram = DeltaNetRAMReference(rows=256)
        expected = bytearray(256)
        for _ in range(100_000):
            address = rng.randrange(256)
            value = rng.randrange(256)
            ram.write_byte(address, value)
            expected[address] = value
            if rng.randrange(4) == 0:
                probe = rng.randrange(256)
                self.assertEqual(ram.read_byte(probe), expected[probe])
        self.assertEqual(bytes(ram._state), bytes(expected))


if __name__ == "__main__":
    unittest.main()
