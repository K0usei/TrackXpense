# Fixing Connection Issues Between Frontend and Backend

This document provides solutions for common connection issues between the frontend and backend of TrackXpense.

## Common Issues and Solutions

### 1. HTTPS Connection Issues

**Problem**: Self-signed certificates can cause browser security warnings and connection failures.

**Solution**: Use HTTP instead of HTTPS for local development.

- The API URL has been updated to use HTTP instead of HTTPS
- The backend server is now configured to run with HTTP by default

### 2. IP Address Access

**Problem**: Accessing the app via IP address can cause CORS and Firebase authentication issues.

**Solution**:

- CORS has been configured to allow requests from both localhost and IP addresses
- The Firebase auth domain handler has been updated to better handle IP addresses
- For Firebase authentication, you may need to add your IP address to the authorized domains in the Firebase console

### 3. Starting the Servers

To start both the frontend and backend servers:

```powershell
# Run the start-all.ps1 script
.\start-all.ps1
```

Or start them separately:

```powershell
# Start the backend server
cd backend
.\start-http.ps1

# Start the frontend server (in a different terminal)
npm run dev
```

### 4. Accessing the Application

- Local access: http://localhost:3000
- Network access: http://YOUR_IP_ADDRESS:3000 (replace YOUR_IP_ADDRESS with your actual IP address)

## Troubleshooting

If you still encounter issues:

1. Check that the backend server is running:
   ```powershell
   Get-Process -Name python* | Where-Object { $_.CommandLine -like "*uvicorn*" }
   ```

2. Verify the backend is accessible:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -UseBasicParsing
   ```

3. Check for CORS issues in the browser developer console (F12)

4. For Firebase authentication issues, add your IP address to the authorized domains in the Firebase console
