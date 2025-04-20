# PowerShell script to run the model retraining task
# This script activates the Python environment (if needed) and runs the retraining task

# Change to the backend directory
Set-Location $PSScriptRoot\..

# Create logs directory if it doesn't exist
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
}

# Get current timestamp for log file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "logs\retraining_$timestamp.log"

# Log start time
"[$(Get-Date)] Starting model retraining task..." | Out-File -FilePath $logFile -Append

# Run the retraining task
try {
    # Run the retraining script
    python tasks/retrain_models.py --min-feedback 10 | Out-File -FilePath $logFile -Append

    # Log success
    "[$(Get-Date)] Model retraining task completed successfully." | Out-File -FilePath $logFile -Append
}
catch {
    # Log error
    "[$(Get-Date)] Error running model retraining task: $_" | Out-File -FilePath $logFile -Append
}
