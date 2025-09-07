#!/usr/bin/env python3
"""
One-step: build Next.js in ./app, export to ./local/out, then deploy via FTP.

Reads local/.env (preferred) or .env at repo root for:
- FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR
- Optional: LOCAL_DIR (defaults to local/out)

Usage:
  python3 local/build_export_deploy.py [--secure] [--dry-run] [--port 21]
"""

from __future__ import annotations

import argparse
from pathlib import Path
import os
import sys
import subprocess

from deploy_ftp import deploy, load_dotenv, run_build_export


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Build, export to ./local/out, then deploy via FTP")
    p.add_argument("--secure", action="store_true", help="Use FTPS/TLS")
    p.add_argument("--dry-run", action="store_true", help="List actions without uploading")
    p.add_argument("--port", type=int, default=21, help="FTP port (default: 21)")
    return p.parse_args()


def main() -> None:
    args = parse_args()

    project_root = Path(__file__).resolve().parents[1]
    envfile = load_dotenv(project_root)

    host = envfile.get("FTP_HOST") or os.environ.get("FTP_HOST")
    user = envfile.get("FTP_USER") or os.environ.get("FTP_USER") or envfile.get("FTPUSER") or os.environ.get("FTPUSER")
    password = envfile.get("FTP_PASSWORD") or os.environ.get("FTP_PASSWORD") or envfile.get("FTPPASS") or os.environ.get("FTPPASS")
    remote_dir = envfile.get("FTP_REMOTE_DIR") or os.environ.get("FTP_REMOTE_DIR") or envfile.get("FTP_ROOTDIR") or os.environ.get("FTP_ROOTDIR")

    missing = []
    if not host:
        missing.append("FTP_HOST")
    if not user:
        missing.append("FTP_USER")
    if not password:
        missing.append("FTP_PASSWORD")
    if not remote_dir:
        missing.append("FTP_REMOTE_DIR")
    if missing:
        print("Missing required configuration in local/.env or .env: " + ", ".join(missing), file=sys.stderr)
        print("Tip: create local/.env with your FTP details.", file=sys.stderr)
        sys.exit(2)

    try:
        local_dir = run_build_export(project_root)
    except subprocess.CalledProcessError as e:
        print(f"Build/export failed with exit code {e.returncode}.", file=sys.stderr)
        sys.exit(e.returncode or 1)

    deploy(
        host=host,
        port=args.port,
        user=user,
        password=password,
        local_dir=local_dir,
        remote_base=remote_dir,
        secure=args.secure,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()

