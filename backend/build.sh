#!/bin/bash

set -e # Exits if anything returns non-zero

ROOT="$(pwd)"

if ! command -v go >/dev/null 2>&1; then
  echo "Error: Go is not installed. Please install Go from https://go.dev/dl/"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: Python3 is not installed. Please install Python 3 from https://www.python.org/downloads/"
  exit 1
fi

# Create the virtual env for the Python script if missing
VENV_DIR="./scraper/venv"
if [ ! -d "$VENV_DIR" ]; then
  if ! python3 -m venv "$VENV_DIR" 2>/dev/null; then
    echo "ERROR: cannot create venv. Did you run 'sudo apt install python3-venv'?" >&2
    exit 1
  fi
fi

source "$VENV_DIR/bin/activate"

pip3 install --upgrade pip > /dev/null

# Ensure Python deps installed (non-fatal if already present)
if ! pip3 show selenium >/dev/null 2>&1; then
  echo "Installing Selenium (PIP package)..."
  pip3 install selenium
fi

if ! pip3 show bs4 >/dev/null 2>&1; then
  echo "Installing bs4 (PIP package)..."
  pip3 install bs4
fi

# Build the Go binary
BINARY="./bruinbite"
echo "Building $BINARY..."
go build -o "$BINARY" .

echo "Build finished: $BINARY"
