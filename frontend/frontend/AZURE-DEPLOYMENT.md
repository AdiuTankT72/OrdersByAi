# Azure Deployment Guide

This guide explains how to build and deploy the application to Azure, where both frontend and backend are hosted under the same domain.

## Building for Azure Deployment

When building the frontend for Azure deployment, use the following command:

```bash
npm run build:azure
```

This command will:

1. Use the `.env.azure` configuration
2. Set the API URL to be relative, allowing the frontend to access the backend API at the same domain

## Configuration Files

- `.env.local` - Local development environment (uses http://localhost:5142)
- `.env.azure` - Azure production environment (uses relative URLs)

## How It Works

When deployed to Azure, the frontend will use relative URLs for API requests. This means all API requests will be made to the same domain where the frontend is hosted.

For example, if your site is deployed at `https://your-app.azurewebsites.net`:

- Frontend is at `https://your-app.azurewebsites.net/`
- API requests go to `https://your-app.azurewebsites.net/api/...`

## Troubleshooting

If you're experiencing connection issues:

1. Check browser developer tools (Network tab) to see where API requests are going
2. Verify that the correct build command (`npm run build:azure`) was used
3. Check that the backend is properly configured to handle requests at the same domain
