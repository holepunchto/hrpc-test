"""Asserts a built wheel carries the fixtures, which an editable install cannot
show - it reads them from the repo root instead."""

import glob
import sys
import zipfile

wheels = glob.glob("dist/*.whl")

if not wheels:
    sys.exit("no wheel in dist/")

names = zipfile.ZipFile(wheels[0]).namelist()
packaged = [n for n in names if n.startswith("hrpc_test/fixtures/")]

if not packaged:
    sys.exit(f"{wheels[0]} carries no fixtures")

for expected in ["envelope", "error", "boundary", "dispatch", "negative", "sequence"]:
    if not any(n.startswith(f"hrpc_test/fixtures/{expected}/") for n in packaged):
        sys.exit(f"{wheels[0]} is missing the {expected} fixtures")

print(f"ok - {len(packaged)} fixture files in {wheels[0]}")
