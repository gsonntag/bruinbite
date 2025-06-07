#!/bin/bash

set -e # Exits if anything returns 1

ROOT="$(pwd)"

if ! command -v go >/dev/null 2>&1; then
  echo "Error: Go is not installed. Please install Go from https://go.dev/dl/"
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: Python3 is not installed. Please install Python 3 from https://www.python.org/downloads/"
fi

# Create the virtual env for the Python script
VENV_DIR="./scraper/.venv"
if [ ! -d "$VENV_DIR" ]; then
  if ! python3 -m venv "$VENV_DIR" 2>/dev/null; then
    echo "ERROR: cannot create venv. Did you run 'sudo apt install python3-venv'?" >&2
    exit 1
  fi
fi

# TODO: How to make this run only if needed
source "$VENV_DIR/bin/activate"

pip3 install --upgrade pip > /dev/null

# Install selenium if not already installed
if ! pip3 show selenium >/dev/null 2>&1; then
  echo "Installing Selenium (PIP package)..."
  pip3 install selenium
fi

# Install bs4 (really installs beautifulsoup4) if not already installed
if ! pip3 show bs4 >/dev/null 2>&1; then
  echo "Installing bs4 (PIP package)..."
  pip3 install bs4
fi

cd "$ROOT"
go run main.go --reindex 2>&1 | egrep -v 'Running in "debug" mode|using (env|code)|Logger and Recovery middleware|trusted all proxies|don-t-trust-all-proxies'
