#!/usr/bin/env bash
set -euo pipefail

python -m uvicorn main:app --reload --port 8000

