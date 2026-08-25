"""Conformance vectors for the bare-rpc / hrpc wire protocol.

The Python mirror of index.js, so ports can depend on the fixtures instead of
vendoring a copy that drifts.
"""

import json
from pathlib import Path

# Installed wheels carry the fixtures inside the package; a source checkout
# reads them from the repo root, where the JS entry point also looks
_packaged = Path(__file__).parent / "fixtures"

FIXTURES_DIR = (
    _packaged if _packaged.is_dir() else Path(__file__).resolve().parents[2] / "fixtures"
)

# Read from the same file index.js reads, so the two surfaces cannot drift
FAMILIES = json.loads((FIXTURES_DIR / "families.json").read_text())


def _read_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_family(name):
    """Families with {messages, frames} (index-aligned)."""
    directory = FIXTURES_DIR / name
    return {
        "messages": _read_json(directory / "messages.json"),
        "frames": _read_json(directory / "frames.json"),
    }


def load_negative():
    """{hex, reason}[] a conformant decoder must reject."""
    return _read_json(FIXTURES_DIR / "negative" / "frames.json")


def load_sequence():
    """{concatenated, count} - one byte stream of several frames."""
    return _read_json(FIXTURES_DIR / "sequence" / "frames.json")


__all__ = [
    "FAMILIES",
    "FIXTURES_DIR",
    "load_family",
    "load_negative",
    "load_sequence",
]
