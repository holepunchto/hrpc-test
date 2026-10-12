"""Asserts a built wheel carries the fixtures, which an editable install cannot
show - it reads them from the repo root instead."""

import glob
import pathlib
import sys
import zipfile

wheels = glob.glob("dist/*.whl")

if not wheels:
    sys.exit("no wheel in dist/")

names = zipfile.ZipFile(wheels[0]).namelist()
packaged = [n for n in names if n.startswith("hrpc_test/fixtures/")]

fixtures = pathlib.Path(__file__).parent.parent / "fixtures"
expected = {
    f"hrpc_test/fixtures/{p.relative_to(fixtures).as_posix()}"
    for p in fixtures.rglob("*")
    if p.is_file()
}

missing = sorted(expected - set(packaged))
if missing:
    sys.exit(f"{wheels[0]} is missing {', '.join(missing)}")

print(f"ok - {len(packaged)} fixture files in {wheels[0]}")
