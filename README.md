# SevaSetu Deployment Guide

Follow these steps to deploy the SevaSetu infrastructure using Google Cloud Platform and Firebase.

## Prerequisites
- Download and install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- Download and install [Firebase CLI](https://firebase.google.com/docs/cli)

## Deployment Steps

1. Authenticate with Google Cloud CLI
```bash
gcloud auth login
```

2. Set your active Project ID
```bash
gcloud config set project [PROJECT_ID]
```

3. Deploy Backend APIs to Google Cloud Run (Using Cloud Build)
This builds the Docker image remotely and launches your Express API on Google Cloud Run.
```bash
gcloud builds submit --config cloudbuild.yaml
# Or manual deploy
# gcloud run deploy
```

4. Deploy Frontend Client to Firebase Hosting
Uploads the compiled React/Vite code onto Firebase's global CDN distribution network.
```bash
cd client
npm run build
firebase deploy --only hosting
```
