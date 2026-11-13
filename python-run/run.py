#!/usr/bin/env python3
"""Launch the existing UrbanFlow Node.js server from a Python entry point."""

from pathlib import Path
import shutil
import subprocess
import sys


def main() -> int:
    project_root = Path(__file__).resolve().parent.parent
    server_file = project_root / "server.js"
    node = shutil.which("node")

    if not server_file.is_file():
        print(f"File server.js tidak ditemukan: {server_file}", file=sys.stderr)
        return 2
    if node is None:
        print(
            "Node.js tidak ditemukan. Python runner ini tetap memerlukan Node.js "
            "untuk menjalankan server.js.",
            file=sys.stderr,
        )
        return 127

    return subprocess.call([node, str(server_file)], cwd=project_root)


if __name__ == "__main__":
    raise SystemExit(main())
