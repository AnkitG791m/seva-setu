import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { uploadMiddleware, streamToGCS } from '../services/storageService.js';

const router = Router();

/**
 * POST /api/upload
 * Accepts multipart/form-data with field "file" or "photo".
 * Returns the GCS public URL and filename.
 */
router.post(
  '/',
  authenticate,
  uploadMiddleware.single('photo'), // using 'photo' field per prior setup, or client can send 'photo'
  streamToGCS,
  (req, res) => {
    // If we reach here, file is uploaded and URL is attached
    if (!req.file || !req.file.publicUrl) {
      return res.status(500).json({ error: 'Upload failed internally' });
    }
    
    // Return { url: publicUrl, filename: string } as specified
    res.json({
      url: req.file.publicUrl,
      filename: req.file.gcsFilename,
    });
  }
);

// Error handler for multer/gcs errors locally on this route
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max size is 5MB.' });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default router;
