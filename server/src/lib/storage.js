import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  // When running locally, set GOOGLE_APPLICATION_CREDENTIALS env var
  // to your service account JSON path.
  // On Cloud Run / GKE, Workload Identity handles auth automatically.
});

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

/**
 * Upload a buffer to GCS and return a public URL.
 * @param {Buffer} buffer
 * @param {string} destFileName  e.g. 'needs/abc123.jpg'
 * @param {string} contentType   e.g. 'image/jpeg'
 * @returns {Promise<string>} public URL
 */
export async function uploadToGCS(buffer, destFileName, contentType = 'image/jpeg') {
  const file = bucket.file(destFileName);

  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });

  // Make file publicly readable
  await file.makePublic();

  return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${destFileName}`;
}

export default storage;
