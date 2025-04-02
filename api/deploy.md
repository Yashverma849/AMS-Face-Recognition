# Face Recognition API Deployment Guide

This guide provides instructions for deploying the Python face recognition API to various platforms.

## Option 1: Deploy to Fly.io

[Fly.io](https://fly.io) offers a free tier and is easy to use for deploying containerized applications.

### Prerequisites
- Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/)
- Sign up for a Fly.io account

### Deployment Steps

1. **Login to Fly.io**
   ```
   flyctl auth login
   ```

2. **Initialize the app (first time only)**
   ```
   cd api
   flyctl launch
   ```
   - When prompted, choose a unique app name
   - Choose the region closest to your users
   - Say no to setting up a PostgreSQL database
   - Say no to setting up a Redis database
   - Say yes to deploying now

3. **Create a volume for persistent data**
   ```
   flyctl volumes create face_data --size 1
   ```

4. **Deploy updates**
   ```
   flyctl deploy
   ```

5. **Get your deployment URL**
   ```
   flyctl info
   ```

6. Update the frontend environment variable `NEXT_PUBLIC_FACE_API_URL` in Vercel with your Fly.io URL.

## Option 2: Deploy to Digital Ocean App Platform

### Steps
1. Create a Digital Ocean account
2. Create a new App from the App Platform
3. Connect your GitHub repository
4. Configure as a Web Service and select the `/api` directory
5. Set the HTTP port to 8000
6. Add a volume mount to `/app/data`
7. Deploy the app
8. Update the frontend environment variable in Vercel

## Option 3: Deploy to Render

### Steps
1. Create a Render account
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure to use the Dockerfile in the `/api` directory
5. Set the environment variable `PORT=8000`
6. Deploy the app
7. Update the frontend environment variable in Vercel

## Updating the Frontend

After deploying your API, you need to update the frontend to use the deployed API URL:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add/update the variable `NEXT_PUBLIC_FACE_API_URL` with your API URL (e.g., `https://face-recognition-api.fly.dev`)
4. Redeploy your frontend

## Troubleshooting

### API returns 500 error
- Check the logs of your deployed API service
- Make sure the data directories are writable
- Verify that face_recognition library is installed correctly

### CORS errors
- The API has CORS enabled for all origins by default
- For production, update the CORS middleware in `main.py` to only allow your frontend domain 