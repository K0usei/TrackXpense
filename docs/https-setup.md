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

## Starting Servers with HTTPS

To run the application with HTTPS, you'll need to start both the frontend and backend servers separately.

### Backend with HTTPS

Navigate to the backend directory and run:

```bash
# Activate the virtual environment if needed
.\venv\Scripts\activate

# Start the FastAPI server with HTTPS
uvicorn main:app --reload --ssl-keyfile=../certificates/localhost-key.pem --ssl-certfile=../certificates/localhost.pem --host 0.0.0.0 --port 8000
```

### Frontend with HTTPS

Navigate to the admin directory and run:

```bash
# Start the Next.js server with HTTPS
npm run dev
```

## Accessing the Application

- Local access: https://localhost:3000
- Network access: https://YOUR_IP_ADDRESS:3000 (using your computer's IP address)

## Environment Variables

The `.env.local` file in the admin directory should be updated to use HTTPS URLs:

```
NEXT_PUBLIC_API_URL=https://localhost:8000/api
GEMINI_API_KEY=your_gemini_api_key_here
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
