# Running TrackXpense with HTTPS

This guide explains how to run both the frontend and backend with HTTPS for local development.

## Prerequisites

- SSL certificates (already generated in the `certificates` directory)
- Node.js and npm for the frontend
- Python and virtual environment for the backend

## Starting the Backend with HTTPS

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Activate the virtual environment:
   ```
   .\venv\Scripts\activate
   ```

3. Start the FastAPI server with HTTPS:
   ```
   uvicorn main:app --reload --ssl-keyfile=../certificates/localhost-key.pem --ssl-certfile=../certificates/localhost.pem --host 0.0.0.0
   ```

   Or use the provided script:
   ```
   .\start-https.ps1
   ```

## Starting the Frontend with HTTPS

1. Navigate to the project root directory.

2. Start the Next.js development server with HTTPS:
   ```
   npm run dev
   ```

   This will use the custom HTTPS server defined in `server.js`.

## Accessing the Application

- Local access: https://localhost:3000
- Network access: https://192.168.1.9:3000 (using your computer's IP address)

## Troubleshooting

### Certificate Trust Issues

If you see certificate warnings in your browser:
- For development purposes, you can click "Advanced" and then "Proceed to site"
- To permanently trust the certificates, make sure the mkcert root CA is installed on your device

### CORS Issues

If you encounter CORS errors, check that the backend's CORS configuration includes all necessary origins:
- https://localhost:3000
- https://127.0.0.1:3000
- https://192.168.1.9:3000

### API Connection Issues

If the frontend can't connect to the backend:
- Make sure both servers are running
- Check that the environment variables in `.env.local` are using HTTPS URLs
- Verify that the backend is accessible at https://localhost:8000/health

## Notes

- The certificates are valid for localhost, 127.0.0.1, ::1, and 192.168.1.9
- They will expire on July 9, 2027
- To generate new certificates, use: `mkcert localhost 127.0.0.1 ::1 192.168.1.9`
