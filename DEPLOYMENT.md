# 🚀 Deployment Guide - Streamverse Frontend

## Prerequisites
- Git repository with your code
- Render account (free tier available)
- Backend services (can be local for testing)

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

### For Testing (Local Backend Services)
In your Render dashboard, add these environment variables to test with local backend services:

```
VITE_MOVIE_API_URL=http://localhost:4001/api/movies
VITE_USER_API_URL=http://localhost:5001/api/user
VITE_WATCHPARTY_API_URL=http://localhost:4004/api/tools/watchparty
VITE_RECOMMENDATION_API_URL=http://localhost:4002/api/recommendations
VITE_MARATHON_API_URL=http://localhost:4004/api/tools/marathon
VITE_FRANCHISE_API_URL=http://localhost:4014/api/franchises
```

**⚠️ Important:** 
- Make sure your local backend services are running on these ports
- For local testing, you'll need to use a tool like ngrok to expose your local services to the internet
- Or use a service like localtunnel to make your localhost accessible

### For Production (Deployed Backend Services)
Once you deploy your backend services, update the environment variables to:

```
VITE_MOVIE_API_URL=https://your-movie-module.onrender.com/api/movies
VITE_USER_API_URL=https://your-user-module.onrender.com/api/user
VITE_WATCHPARTY_API_URL=https://your-watchparty-module.onrender.com/api/tools/watchparty
VITE_RECOMMENDATION_API_URL=https://your-recommendation-module.onrender.com/api/recommendations
VITE_MARATHON_API_URL=https://your-marathon-module.onrender.com/api/tools/marathon
VITE_FRANCHISE_API_URL=https://your-franchise-module.onrender.com/api/franchises
```

## Step 4: Expose Local Services (For Testing)

### Option A: Using ngrok
1. Install ngrok: `npm install -g ngrok`
2. Expose your backend services:
   ```bash
   # Terminal 1 - Movie Service
   ngrok http 4001
   
   # Terminal 2 - User Service  
   ngrok http 5001
   
   # Terminal 3 - Watch Party Service
   ngrok http 4004
   
   # Terminal 4 - Recommendation Service
   ngrok http 4002
   
   # Terminal 5 - Franchise Service
   ngrok http 4014
   ```
3. Use the ngrok URLs in your environment variables

### Option B: Using localtunnel
1. Install localtunnel: `npm install -g localtunnel`
2. Expose your services:
   ```bash
   # Terminal 1 - Movie Service
   lt --port 4001 --subdomain streamverse-movies
   
   # Terminal 2 - User Service
   lt --port 5001 --subdomain streamverse-users
   
   # Terminal 3 - Watch Party Service
   lt --port 4004 --subdomain streamverse-watchparty
   
   # Terminal 4 - Recommendation Service
   lt --port 4002 --subdomain streamverse-recommendations
   
   # Terminal 5 - Franchise Service
   lt --port 4014 --subdomain streamverse-franchises
   ```

## Step 5: Configure Routes

In your Render dashboard, add these routes for SPA routing:

1. Go to your static site settings
2. Add a rewrite rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`

This ensures React Router works correctly.

## Step 6: Deploy

1. Click "Deploy" in your Render dashboard
2. Wait for the build to complete (usually 2-5 minutes)
3. Your site will be available at: `https://your-app-name.onrender.com`

## Troubleshooting

### Build Failures
- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify the build command works locally: `npm run build`

### API Connection Issues
- Verify your backend services are running locally
- Check that environment variables are correctly set
- If using ngrok/localtunnel, ensure the URLs are accessible
- Test API endpoints directly in browser/Postman

### CORS Issues
- Your local backend services need to allow CORS from your Render domain
- Add your Render domain to the CORS configuration in your backend services

### Routing Issues
- Ensure the rewrite rule is configured correctly
- Check that React Router is working locally

## Environment Variables Reference

| Variable | Description | Local URL | Production URL |
|----------|-------------|-----------|----------------|
| `VITE_MOVIE_API_URL` | Movie service API URL | `http://localhost:4001/api/movies` | `https://movie-service.onrender.com/api/movies` |
| `VITE_USER_API_URL` | User service API URL | `http://localhost:5001/api/user` | `https://user-service.onrender.com/api/user` |
| `VITE_WATCHPARTY_API_URL` | Watch party service API URL | `http://localhost:4004/api/tools/watchparty` | `https://watchparty-service.onrender.com/api/tools/watchparty` |
| `VITE_RECOMMENDATION_API_URL` | Recommendation service API URL | `http://localhost:4002/api/recommendations` | `https://recommendation-service.onrender.com/api/recommendations` |
| `VITE_MARATHON_API_URL` | Marathon service API URL | `http://localhost:4004/api/tools/marathon` | `https://marathon-service.onrender.com/api/tools/marathon` |
| `VITE_FRANCHISE_API_URL` | Franchise service API URL | `http://localhost:4014/api/franchises` | `https://franchise-service.onrender.com/api/franchises` |

## Notes
- The app automatically detects production vs development environment
- In development, it uses the Vite proxy configuration
- In production, it uses the environment variables for direct API calls
- For testing with local services, use ngrok or localtunnel to expose localhost
- Make sure your backend services are running and accessible before deploying the frontend
