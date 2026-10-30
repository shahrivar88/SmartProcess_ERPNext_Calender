#!/usr/bin/env python3
"""Build the setuptools sdist and prove required app files are packaged."""

from __future__ import annotations

import shutil
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "LICENSE",
    "README.md",
    "pyproject.toml",
    "setup.py",
    "MANIFEST.in",
    "jalali_shamsi_datepicker/__init__.py",
    "jalali_shamsi_datepicker/hooks.py",
    "jalali_shamsi_datepicker/boot.py",
    "jalali_shamsi_datepicker/uninstall.py",
    "jalali_shamsi_datepicker/jalali.py",
    "jalali_shamsi_datepicker/naming.py",
    "jalali_shamsi_datepicker/patches.txt",
    "jalali_shamsi_datepicker/patches/remove_date_storage_format.py",
    "jalali_shamsi_datepicker/fixtures/custom_field.json",
    "jalali_shamsi_datepicker/public/js/jalali_core.js",
    "jalali_shamsi_datepicker/public/js/jalali_persian_date_adapter.js",
    "jalali_shamsi_datepicker/public/js/jalali_controls.js",
    "jalali_shamsi_datepicker/public/js/persian-date.min.js",
    "jalali_shamsi_datepicker/public/js/persian-datepicker.min.js",
    "jalali_shamsi_datepicker/public/css/persian-datepicker.min.css",
    "jalali_shamsi_datepicker/public/css/custom.css",
)


def ensure_setuptools() -> None:
    try:
        import setuptools  # noqa: F401
    except ImportError:
        print("setuptools is missing; installing it for sdist verification", file=sys.stderr)
        subprocess.run([sys.executable, "-m", "pip", "install", "setuptools>=69"], check=True)


def main() -> int:
    ensure_setuptools()
    dist_dir = Path(tempfile.mkdtemp(prefix="jalali-sdist-"))
    try:
        cmd = [sys.executable, "setup.py", "sdist", "--dist-dir", str(dist_dir)]
        print("Running:", " ".join(cmd))
        subprocess.run(cmd, cwd=ROOT, check=True)
        archives = list(dist_dir.glob("*.tar.gz"))
        if len(archives) != 1:
            print("expected one sdist, found", archives, file=sys.stderr)
            return 1
        archive = archives[0]
        print("sdist:", archive.name)
        with tarfile.open(archive, "r:gz") as tar:
            names = tar.getnames()
        print(f"sdist members: {len(names)}")
        if names:
            root_prefix = names[0].split("/")[0]
        else:
            print("empty sdist", file=sys.stderr)
            return 1
        missing = []
        for rel in REQUIRED:
            expected = f"{root_prefix}/{rel}"
            if expected not in names:
                missing.append(expected)
        if missing:
            print("missing required packaged files:", file=sys.stderr)
            for item in missing:
                print("  " + item, file=sys.stderr)
            return 1
        print("setuptools sdist contains the required Python, hooks, patches, fixtures, assets and LICENSE.")
        print("Dual packaging note: pyproject.toml still declares flit_core. This script checks setuptools.")
        return 0
    finally:
        shutil.rmtree(dist_dir, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
