import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { uploadPhoto } from '../lib/api.js';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PhotoUpload({ onUploadSuccess }) {
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | compressing | uploading | success | error
  const fileInputRef = useRef(null);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = async (file) => {
    // Check type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadStatus('error');
      toast.error('Kripya sirf JPEG, PNG ya WebP photo chunen.', { id: 'invalid-type' }); // Please choose only JPEG, PNG or WebP
      return;
    }
    
    // reset state
    setUploadStatus('compressing');
    setUploadProgress(0);

    // Show preview immediately using FileReader API
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Compress client-side
    const options = {
      maxSizeMB: 1, // Compress down to 1MB
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setPhoto(compressedFile);
      setUploadStatus('idle'); // ready to upload
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
      toast.error('Photo compress karne mein error aaya.');
    }
  };

  const handleUpload = async () => {
    if (!photo) return;
    setUploadStatus('uploading');

    const formData = new FormData();
    formData.append('photo', photo);

    try {
      // Create a temporary axios instance or override config to track progress
      // We will just simulate progress if api.js doesn't support onUploadProgress,
      // but let's implement actual progress if possible via axios config trick:
      const config = {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      };
      
      const { data } = await uploadPhoto(formData, config);
      
      setUploadStatus('success');
      toast.success('Photo successfully upload ho gayi!'); // Photo uploaded successfully
      
      if (onUploadSuccess) {
        onUploadSuccess(data.url); // pass URL to parent form state
      }
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
      toast.error('Photo upload nahi hua, dobara try karein');
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
          ${uploadStatus === 'error' ? 'border-red-500/50 bg-red-500/5' : 
            uploadStatus === 'success' ? 'border-brand-500/50 bg-brand-500/5' : 
            'border-surface-border hover:border-brand-400 bg-surface'}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => uploadStatus !== 'uploading' && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/jpeg, image/png, image/webp" 
          className="hidden" 
        />

        {previewUrl ? (
          <div className="relative inline-block w-full">
            <img src={previewUrl} alt="Preview" className="mx-auto max-h-48 rounded shadow-md object-cover w-full" onClick={(e) => e.stopPropagation()} />
            
            {uploadStatus === 'success' && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center rounded">
                <CheckCircle className="w-12 h-12 text-brand-400 mb-2" />
                <span className="text-white font-medium text-sm drop-shadow-md">Uploaded</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8">
            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">Click or Drag & Drop photo</p>
            <p className="text-xs text-slate-500 mt-1">JPEG, PNG, WebP (Max 5MB)</p>
          </div>
        )}
      </div>

      {uploadStatus === 'compressing' && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-yellow-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Compressing...
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4" /> Photo upload nahi hua, dobara try karein
        </div>
      )}

      {uploadStatus === 'uploading' && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-500 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {(photo && uploadStatus !== 'success' && uploadStatus !== 'uploading' && uploadStatus !== 'compressing') && (
        <button 
          onClick={handleUpload}
          className="btn-primary w-full justify-center mt-4"
        >
          <UploadCloud className="w-4 h-4" /> Start Upload
        </button>
      )}

    </div>
  );
}
