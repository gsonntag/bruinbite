# Requires PowerShell 5.0+
$ErrorActionPreference = "Stop"

$ROOT = Get-Location

# Check if Go is installed
if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
    Write-Error "Error: Go is not installed. Please install Go from https://go.dev/dl/"
}

# Check if Python3 is installed
if (-not (Get-Command python3 -ErrorAction SilentlyContinue)) {
    Write-Error "Error: Python3 is not installed. Please install Python 3 from https://www.python.org/downloads/"
}

# Create the virtual environment if it doesn't exist
$VENV_DIR = "./scraper/.venv"
if (-not (Test-Path "$VENV_DIR")) {
    python3 -m venv "$VENV_DIR"
    Write-Output "Created Python virtual environment in $VENV_DIR"
}

# Activate the virtual environment
$ActivateScript = Join-Path $VENV_DIR "Scripts\Activate.ps1"
. $ActivateScript

# Upgrade pip
python3 -m pip install --upgrade pip | Out-Null

# Install selenium if not already installed
if (-not (python3 -m pip show selenium | Out-String)) {
    Write-Output "Installing Selenium (PIP package)..."
    python3 -m pip install selenium
}

# Install bs4 if not already installed
if (-not (python3 -m pip show bs4 | Out-String)) {
    Write-Output "Installing bs4 (PIP package)..."
    python3 -m pip install bs4
}

# Run Go application and filter output
Set-Location $ROOT
go run main.go 2>&1 | Select-String -NotMatch 'Running in "debug" mode|using (env|code)|Logger and Recovery middleware|trusted all proxies|don-t-trust-all-proxies'
