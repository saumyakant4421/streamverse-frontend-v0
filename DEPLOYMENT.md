# 🚀 Deployment Guide - Streamverse Frontend

## Prerequisites
- Git repository with your code
- Render account (free tier available)
- Deployed backend services

## Step 1: Prepare Your Code
1. Ensure all changes are committed to your Git repository
2. Make sure your `render.yaml` file is in the root directory
3. Verify your `package.json` has the correct build script: `"build": "vite build"`

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Static Site"
3. Connect your Git repository
4. Render will automatically detect the `render.yaml` configuration
5. Click "Create Static Site"

### Option B: Manual Configuration
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Static Site"
3. Connect your Git repository
4. Configure the following:
   - **Name**: `streamverse-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment**: `Static`

## Step 3: Configure Environment Variables

In your Render dashboard, go to your static site settings and add these environment variables:

```
VITE_MOVIE_API_URL=https://your-movie-module.onrender.com/api/movies
VITE_USER_API_URL=https://your-user-module.onrender.com/api/user
VITE_WATCHPARTY_API_URL=https://your-watchparty-module.onrender.com/api/tools/watchparty
VITE_RECOMMENDATION_API_URL=https://your-recommendation-module.onrender.com/api/recommendations
VITE_MARATHON_API_URL=https://your-marathon-module.onrender.com/api/tools/marathon
VITE_FRANCHISE_API_URL=https://your-franchise-module.onrender.com/api/franchises
```

**Replace the URLs with your actual deployed backend service URLs.**

## Step 4: Configure Routes

In your Render dashboard, add these routes for SPA routing:

1. Go to your static site settings
2. Add a rewrite rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`

This ensures React Router works correctly.

## Step 5: Deploy

1. Click "Deploy" in your Render dashboard
2. Wait for the build to complete (usually 2-5 minutes)
3. Your site will be available at: `https://your-app-name.onrender.com`

## Troubleshooting

### Build Failures
- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify the build command works locally: `npm run build`

### API Connection Issues
- Verify your backend services are deployed and accessible
- Check that environment variables are correctly set
- Test API endpoints directly in browser/Postman

### Routing Issues
- Ensure the rewrite rule is configured correctly
- Check that React Router is working locally

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_MOVIE_API_URL` | Movie service API URL | `https://movie-service.onrender.com/api/movies` |
| `VITE_USER_API_URL` | User service API URL | `https://user-service.onrender.com/api/user` |
| `VITE_WATCHPARTY_API_URL` | Watch party service API URL | `https://watchparty-service.onrender.com/api/tools/watchparty` |
| `VITE_RECOMMENDATION_API_URL` | Recommendation service API URL | `https://recommendation-service.onrender.com/api/recommendations` |
| `VITE_MARATHON_API_URL` | Marathon service API URL | `https://marathon-service.onrender.com/api/tools/marathon` |
| `VITE_FRANCHISE_API_URL` | Franchise service API URL | `https://franchise-service.onrender.com/api/franchises` |

## Notes
- The app automatically detects production vs development environment
- In development, it uses the Vite proxy configuration
- In production, it uses the environment variables for direct API calls
- Make sure your backend services are deployed and accessible before deploying the frontend
