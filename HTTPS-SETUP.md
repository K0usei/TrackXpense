# Running TrackXpense with HTTPS

This guide explains how to set up and run both the frontend and backend with HTTPS for local development.

## Prerequisites

- Node.js and npm for the frontend
- Python and virtual environment for the backend
- mkcert for generating SSL certificates

## Setting Up SSL Certificates

1. Install mkcert if you haven't already:

   - Windows (with Chocolatey): `choco install mkcert`
   - Windows (with Scoop): `scoop install mkcert`
   - macOS (with Homebrew): `brew install mkcert`
   - Linux: Follow instructions at https://github.com/FiloSottile/mkcert

2. Install the local CA in the system trust store:

   ```
   mkcert -install
   ```

3. Generate certificates for local development:

   ```
   mkcert -cert-file certificates/localhost.pem -key-file certificates/localhost-key.pem localhost 127.0.0.1 ::1 "*.localhost" "*.local" "*.internal" "*.home.arpa" "*.home" "*.lan" "*.test" "*.192.168.1.*"
   ```

   This creates wildcard certificates that will work with any local IP address.

## Starting Both Servers with HTTPS

The easiest way to start both servers is to use the provided script:

```
.\start-https.ps1
```

This script will:

1. Check if the certificates exist
2. Free up ports 3000 and 8000 if they're in use
3. Start the backend server with HTTPS
4. Start the frontend server with HTTPS

## Starting Servers Individually

### Backend with HTTPS

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Run the HTTPS startup script:
   ```
   .\start-https.ps1
   ```

### Frontend with HTTPS

1. Navigate to the project root directory.

2. Run the frontend HTTPS startup script:
   ```
   .\start-frontend-https.ps1
   ```

## Accessing the Application

- Local access: https://localhost:3000
- Network access: https://YOUR_IP_ADDRESS:3000 (using your computer's IP address)

## Environment Variables

The `.env.local` file has been updated to use HTTPS URLs:

```
NEXT_PUBLIC_OCR_API_URL=https://localhost:8000/api
NEXT_PUBLIC_ML_API_URL=https://localhost:8000/api
NEXT_PUBLIC_BACKEND_URL=https://localhost:8000
NEXT_PUBLIC_API_URL=https://localhost:8000/api
```

## Troubleshooting

### Certificate Trust Issues

If you see certificate warnings in your browser:

- Make sure you ran `mkcert -install` to install the local CA
- Try restarting your browser after installing the CA
- For development purposes, you can click "Advanced" and then "Proceed to site"

### CORS Issues

If you encounter CORS errors:

- The backend is configured to allow all origins for development
- Check the browser console for specific CORS error messages

### API Connection Issues

If the frontend can't connect to the backend:

- Make sure both servers are running with HTTPS
- Verify that the backend is accessible at https://localhost:8000/health
- Check that your certificates are valid for your IP address

### Firebase Authentication Issues

If you encounter Firebase authentication issues when accessing via IP address:

- Add your IP address to the authorized domains in the Firebase console
- Or use localhost instead

## Certificate Details

- The certificates are valid for localhost, 127.0.0.1, ::1, and various local domain patterns
- They will work with any local IP address thanks to the wildcard patterns
- To regenerate certificates, use the command in the "Setting Up SSL Certificates" section
