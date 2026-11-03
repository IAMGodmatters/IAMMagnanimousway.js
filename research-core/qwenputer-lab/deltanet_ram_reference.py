"""Small, standard-library reference model for one-hot DeltaNet RAM semantics.

This validates the addressable row-overwrite abstraction only. It is not a
transformer implementation, a RISC-V CPU, or a port of Qwenputer.
"""
from __future__ import annotations


class DeltaNetRAMReference:
    """Byte-addressable reference memory with exact one-hot row writes."""

    def __init__(self, rows: int = 256, row_width: int = 1) -> None:
        if rows <= 0:
            raise ValueError("rows must be positive")
        if row_width <= 0:
            raise ValueError("row_width must be positive")
        self.rows = rows
        self.row_width = row_width
        self._state = bytearray(rows * row_width)

    def _offset(self, row: int) -> int:
        if not isinstance(row, int) or isinstance(row, bool):
            raise TypeError("row address must be an integer")
        if row < 0 or row >= self.rows:
            raise IndexError("row address is outside the memory")
        return row * self.row_width

    def write_row(self, row: int, value: bytes | bytearray | memoryview) -> None:
        """Equivalent to gate=1, beta=1 and a one-hot key: replace one row."""
        offset = self._offset(row)
        payload = bytes(value)
        if len(payload) != self.row_width:
            raise ValueError(f"row value must contain exactly {self.row_width} bytes")
        self._state[offset : offset + self.row_width] = payload

    def read_row(self, row: int) -> bytes:
        """A one-hot query returns the selected row exactly."""
        offset = self._offset(row)
        return bytes(self._state[offset : offset + self.row_width])

    def write_byte(self, address: int, value: int) -> None:
        if self.row_width != 1:
            raise ValueError("write_byte is available only when row_width is 1")
        if not isinstance(value, int) or isinstance(value, bool) or not 0 <= value <= 255:
            raise ValueError("byte value must be an integer from 0 through 255")
        self.write_row(address, bytes((value,)))

    def read_byte(self, address: int) -> int:
        if self.row_width != 1:
            raise ValueError("read_byte is available only when row_width is 1")
        return self.read_row(address)[0]

    def clear_row(self, row: int) -> None:
        self.write_row(row, bytes(self.row_width))
