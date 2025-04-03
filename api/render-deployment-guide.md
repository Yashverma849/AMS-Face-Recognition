# Deploying the Face Recognition API to Render.com

Render.com offers a free tier that doesn't require payment information upfront, making it a good option for testing or low-traffic applications.

## Steps to Deploy

1. **Create a Render account**
   - Go to [render.com](https://render.com/)
   - Sign up for a free account (you can use GitHub to sign up)

2. **Deploy your API**

   **Option 1: Manual Deployment**
   - In your Render dashboard, click "New +"
   - Select "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - Name: `bpit-face-api` (or any name you prefer)
     - Environment: "Docker"
     - Branch: `main`
     - Root Directory: `api` (important - this is the directory containing the Dockerfile)
     - Instance Type: Free
   - Add the environment variable:
     - `PORT`: `8000`
   - Click "Create Web Service"

   **Option 2: Using Blueprint (render.yaml)**
   - In your Render dashboard, click "New +"
   - Select "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file and create the services
   - Review the configuration and click "Apply"

3. **Monitor the build**
   - The initial build may take several minutes as it needs to install all dependencies and build the Docker image
   - You can monitor the build progress in the Render dashboard

4. **Get your API URL**
   - Once deployed, Render will provide a URL like `https://bpit-face-api.onrender.com`
   - This is your API URL that should be used in the frontend

## Adding Persistent Storage

1. In your Render dashboard, navigate to your deployed service
2. Click on "Disks" in the left sidebar
3. Click "Add Disk"
4. Configure the disk:
   - Name: `data`
   - Mount Path: `/app/data`
   - Size: 1 GB (minimum)
5. Click "Save" and your service will be redeployed with persistent storage

## Updating the Frontend

After deploying your API to Render, update your Vercel environment variable:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add/update the variable `NEXT_PUBLIC_FACE_API_URL` with your Render URL (e.g., `https://bpit-face-api.onrender.com`)
4. Redeploy your frontend

## Testing Your API

Once deployed, you can test if your API is running by visiting:
- `https://your-render-url.onrender.com/health`

This should return a JSON response indicating that the API is operational.

## Troubleshooting

- **Cold Starts**: The free tier on Render will spin down after periods of inactivity, causing a delay (up to 30 seconds) when the service is first accessed after inactivity
- **Build Failures**: Check build logs for any errors, particularly related to Python dependencies or Docker configuration
- **Memory Limits**: The free tier has memory limitations; if your API crashes, consider optimizing or upgrading to a paid plan 