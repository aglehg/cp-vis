#!/usr/bin/env python3
"""
Simple FTP deploy script (local-only).

Usage examples:
  # Preferred: keep a private local/.env, then:
  python3 local/deploy_ftp.py

  # Or override via CLI flags
  python3 local/deploy_ftp.py \
    --host ftp.example.com \
    --user "$FTPUSER" \
    --password "$FTPPASS" \
    --remote-dir "/public_html/site" \
    --local-dir "local/out" \
    [--secure] [--port 21] [--dry-run]

Notes:
- Defaults to passive mode (common on shared hosting).
- Reads ignore patterns from an optional .ftpignore in the local dir.
- Skips common junk by default (.git, node_modules, .next, .DS_Store, etc.).
"""

from __future__ import annotations

import argparse
import os
import posixpath
import sys
from fnmatch import fnmatch
from pathlib import Path
from typing import Iterable, List

from ftplib import FTP, FTP_TLS, error_perm
import subprocess
import shutil


DEFAULT_IGNORES = [
    ".git",
    ".git/**",
    "node_modules",
    "node_modules/**",
    ".next",
    ".next/**",
    "*.log",
    ".DS_Store",
    "Thumbs.db",
    "__pycache__",
    "__pycache__/**",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Deploy a local directory to an FTP server.")
    # Optional: values can come from local/.env or repo .env or environment
    parser.add_argument("--host", help="FTP hostname, e.g. ftp.example.com")
    parser.add_argument("--user", help="FTP username")
    parser.add_argument("--password", help="FTP password")
    parser.add_argument("--remote-dir", help="Remote base directory (e.g. /public_html)")
    parser.add_argument(
        "--local-dir",
        default="local/out",
        help="Local directory to upload (default: local/out)",
    )
    parser.add_argument("--port", type=int, default=21, help="FTP port (default: 21)")
    parser.add_argument(
        "--secure",
        action="store_true",
        help="Use FTPS (FTP over TLS). Useful if the host requires TLS.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List actions without uploading.",
    )
    parser.add_argument(
        "--allow-app-dir",
        action="store_true",
        help="Allow deploying from inside the ./app directory (not recommended).",
    )
    parser.add_argument(
        "--build-export",
        action="store_true",
        help="Build in ./app and export static site to ./local/out before deploying.",
    )
    return parser.parse_args()


def load_ignores(local_root: Path) -> List[str]:
    patterns: List[str] = []
    ignore_file = local_root / ".ftpignore"
    if ignore_file.exists():
        for line in ignore_file.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            patterns.append(line)
    return patterns


def load_dotenv(project_root: Path) -> dict:
    """Load a minimal .env. Prefers local/.env, falls back to repo root .env."""
    candidates = [project_root / "local" / ".env", project_root / ".env"]
    data: dict = {}
    for env_path in candidates:
        if not env_path.exists():
            continue
        for raw in env_path.read_text().splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            # Support quoted values
            val = val.strip().strip('"').strip("'")
            data[key] = val
        # First existing file wins precedence order; keep merged values
    return data


def run_cmd(cmd: list[str], cwd: Path) -> None:
    print(f"$ {' '.join(cmd)} (cwd={cwd})")
    subprocess.run(cmd, cwd=str(cwd), check=True)


def run_build_export(project_root: Path) -> Path:
    """Run Next.js build and export from ./app into ../local/out.

    Returns the path to the exported directory (project_root / 'local' / 'out').
    """
    app_dir = project_root / "app"
    if not app_dir.exists():
        raise SystemExit("Cannot build: './app' directory not found.")
    pkg = app_dir / "package.json"
    if not pkg.exists():
        raise SystemExit("Cannot build: './app/package.json' not found.")

    npm = shutil.which("npm")
    npx = shutil.which("npx")
    if not npm or not npx:
        raise SystemExit("npm/npx not found in PATH. Please install Node.js.")

    # Build with static export configured in next.config (output: 'export').
    # next build will produce ./app/out
    run_cmd([npm, "run", "build"], cwd=app_dir)

    app_out = app_dir / "out"
    if not app_out.exists():
        raise SystemExit("Build did not produce './app/out'. Ensure output: 'export' in next.config.")

    dest = project_root / "local" / "out"
    # Ensure destination exists and mirror contents from app/out
    if dest.exists():
        # clean destination contents
        for root, dirs, files in os.walk(dest, topdown=False):
            for name in files:
                try:
                    (Path(root) / name).unlink()
                except Exception:
                    pass
            for name in dirs:
                try:
                    (Path(root) / name).rmdir()
                except Exception:
                    pass
    else:
        dest.mkdir(parents=True, exist_ok=True)

    # Copy files from app/out to local/out
    def copytree(src: Path, dst: Path):
        for entry in os.scandir(src):
            s = Path(entry.path)
            d = dst / s.name
            if entry.is_dir(follow_symlinks=False):
                d.mkdir(exist_ok=True)
                copytree(s, d)
            else:
                shutil.copy2(s, d)

    copytree(app_out, dest)

    # Ensure server.js (and optional package.json) are present in local/out so hosts can run it there
    server_src = project_root / "local" / "server.js"
    if server_src.exists():
        shutil.copy2(server_src, dest / "server.js")
    pkg_src = project_root / "local" / "package.json"
    if pkg_src.exists():
        shutil.copy2(pkg_src, dest / "package.json")
    htaccess_src = project_root / "local" / ".htaccess"
    if htaccess_src.exists():
        shutil.copy2(htaccess_src, dest / ".htaccess")
    return dest


def should_ignore(rel_path: str, ignore_patterns: Iterable[str]) -> bool:
    # Normalize to forward slashes for matching
    p = rel_path.replace(os.sep, "/")
    for pat in ignore_patterns:
        if fnmatch(p, pat):
            return True
        # Also try matching the first path component against bare dir names
        first = p.split("/", 1)[0]
        if pat.rstrip("/") == first:
            return True
    return False


def connect(host: str, port: int, user: str, password: str, secure: bool) -> FTP:
    if secure:
        ftp = FTP_TLS()
        ftp.connect(host, port)
        ftp.auth()  # Explicit FTPS
        ftp.prot_p()  # Protect data connections
    else:
        ftp = FTP()
        ftp.connect(host, port)
    ftp.login(user=user, passwd=password)
    # Passive mode is typically required behind NAT/firewalls
    ftp.set_pasv(True)
    return ftp


def ensure_remote_dir(ftp: FTP, remote_dir: str) -> None:
    # Create directories recursively if they don't exist
    parts = [p for p in remote_dir.split("/") if p]
    path = ""
    for part in parts:
        path = f"{path}/{part}" if path else f"/{part}"
        try:
            ftp.cwd(path)
        except error_perm:
            # Try to create then cd
            try:
                ftp.mkd(path)
            except error_perm as e:
                # Might exist in race; try cd regardless
                try:
                    ftp.cwd(path)
                except error_perm:
                    raise e


def upload_file(ftp: FTP, local_path: Path, remote_path: str, dry_run: bool = False) -> None:
    parent = posixpath.dirname(remote_path)
    if parent:
        ensure_remote_dir(ftp, parent)
    if dry_run:
        print(f"UPLOAD {local_path} -> {remote_path}")
        return
    with local_path.open("rb") as f:
        ftp.storbinary(f"STOR {remote_path}", f)


def deploy(
    host: str,
    port: int,
    user: str,
    password: str,
    local_dir: Path,
    remote_base: str,
    secure: bool = False,
    dry_run: bool = False,
) -> None:
    if not local_dir.exists() or not local_dir.is_dir():
        print(f"Error: local-dir '{local_dir}' does not exist or is not a directory.", file=sys.stderr)
        sys.exit(2)

    ignore_patterns: List[str] = DEFAULT_IGNORES + load_ignores(local_dir)

    ftp = connect(host, port, user, password, secure)
    try:
        # Ensure base directory exists
        ensure_remote_dir(ftp, remote_base)
        # Walk local directory
        for root, dirs, files in os.walk(local_dir):
            rel_root = os.path.relpath(root, local_dir)
            rel_root = "" if rel_root == "." else rel_root

            # Filter directories in-place based on ignore patterns
            pruned_dirs: List[str] = []
            for d in dirs:
                rel_d = f"{rel_root}/{d}" if rel_root else d
                if should_ignore(rel_d, ignore_patterns):
                    continue
                pruned_dirs.append(d)
            dirs[:] = pruned_dirs

            for filename in files:
                rel_file = f"{rel_root}/{filename}" if rel_root else filename
                if should_ignore(rel_file, ignore_patterns):
                    continue
                local_path = Path(root) / filename
                remote_path = posixpath.join(remote_base, rel_file.replace(os.sep, "/"))
                upload_file(ftp, local_path, remote_path, dry_run=dry_run)

        print("Done.")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


def main() -> None:
    args = parse_args()

    # Determine project root (repo root is parent of this script's dir)
    project_root = Path(__file__).resolve().parents[1]

    # Load .env if present, then fall back to process env, then CLI
    envfile = load_dotenv(project_root)
    getenv = os.environ.get

    host = args.host or envfile.get("FTP_HOST") or getenv("FTP_HOST")
    user = args.user or envfile.get("FTP_USER") or getenv("FTP_USER") or envfile.get("FTPUSER") or getenv("FTPUSER")
    password = (
        args.password
        or envfile.get("FTP_PASSWORD")
        or getenv("FTP_PASSWORD")
        or envfile.get("FTPPASS")
        or getenv("FTPPASS")
    )
    remote_dir = (
        args.remote_dir
        or envfile.get("FTP_REMOTE_DIR")
        or getenv("FTP_REMOTE_DIR")
        or envfile.get("FTP_ROOTDIR")
        or getenv("FTP_ROOTDIR")
    )

    # Local dir precedence: CLI > .env LOCAL_DIR > env LOCAL_DIR > default
    local_dir_str = args.local_dir or envfile.get("LOCAL_DIR") or getenv("LOCAL_DIR") or "local/out"
    local_dir = (project_root / local_dir_str).resolve() if not Path(local_dir_str).is_absolute() else Path(local_dir_str)

    # Optional: build and export before deploying
    if args.build_export:
        try:
            exported = run_build_export(project_root)
            local_dir = exported
        except subprocess.CalledProcessError as e:
            print(f"Build/export failed with exit code {e.returncode}.", file=sys.stderr)
            sys.exit(e.returncode or 1)

    # Safety: avoid deploying directly from ./app unless explicitly allowed
    app_dir = (project_root / "app").resolve()
    try:
        within_app = app_dir in local_dir.parents or local_dir == app_dir
    except Exception:
        within_app = False
    if within_app and not args.allow_app_dir:
        print(
            f"Refusing to deploy from inside './app'. Found local-dir='{local_dir}'.\n"
            f"Please export to a top-level folder (e.g., './local/out') and deploy that,\n"
            f"or pass --allow-app-dir to override.",
            file=sys.stderr,
        )
        sys.exit(2)

    # Validate required fields
    missing = []
    if not host:
        missing.append("--host or FTP_HOST")
    if not user:
        missing.append("--user or FTP_USER")
    if not password:
        missing.append("--password or FTP_PASSWORD")
    if not remote_dir:
        missing.append("--remote-dir or FTP_REMOTE_DIR")
    if missing:
        print("Missing required configuration: " + ", ".join(missing), file=sys.stderr)
        print("Tip: create a local/.env (preferred) or .env at repo root.", file=sys.stderr)
        sys.exit(2)

    if not local_dir.exists() or not local_dir.is_dir():
        print(f"Local directory '{local_dir}' not found.", file=sys.stderr)
        sys.exit(2)

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
