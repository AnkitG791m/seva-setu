import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNeed, uploadPhoto } from '../lib/api.js';
import { MapPin, Image, Loader2, ArrowLeft, ChevronDown, Search } from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import toast from 'react-hot-toast';


const CATEGORIES = ['Food', 'Medical', 'Shelter', 'Education', 'Water', 'Other'];
const LIBRARIES = ['places'];

export default function CreateNeedPage() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const [form, setForm] = useState({
    title: '', description: '', category: 'Food',
    location: '', lat: '', lng: '', photo_url: '',
  });

  const [photo, setPhoto]     = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) })),
      () => toast.error('Could not get location')
    );
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        setForm(f => ({
          ...f,
          location: place.formatted_address || place.name,
          lat: place.geometry.location.lat().toFixed(6),
          lng: place.geometry.location.lng().toFixed(6)
        }));
      }
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let photo_url = '';
      if (photo) {
        setUploading(true);
        const fd = new FormData();
        fd.append('photo', photo);
        const { data } = await uploadPhoto(fd);
        photo_url = data.url;
        setUploading(false);
      }

      await createNeed({ ...form, photo_url });
      toast.success('Need report submitted! Gemini is analysing urgency… ✨');
      navigate('/needs');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="page-title">Report a Need</h1>
        <p className="text-slate-400 mt-1">Gemini AI will automatically score the urgency of this report.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
        {/* Title */}
        <div>
          <label className="label">Title</label>
          <input type="text" className="input-field" placeholder="e.g. Flood victims need food in Sector 7" {...field('title')} required />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea className="input-field resize-none" rows={4} placeholder="Describe the situation in detail…" {...field('description')} required />
        </div>

        {/* Category */}
        <div>
          <label className="label">Category</label>
          <div className="relative">
            <select className="input-field appearance-none pr-8" {...field('category')}>
              {CATEGORIES.map((c) => <option key={c} className="bg-surface-card">{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
          </div>
        </div>

        {/* Location with Autocomplete */}
        <div>
          <label className="label">Location (Search or Use Autocomplete)</label>
          {isLoaded ? (
            <Autocomplete
              onLoad={(ref) => autocompleteRef.current = ref}
              onPlaceChanged={onPlaceChanged}
            >
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search for a location..." 
                value={form.location}
                onChange={(e) => setForm({...form, location: e.target.value})}
                required 
              />
            </Autocomplete>
          ) : (
            <input type="text" className="input-field" placeholder="Village, District, State" {...field('location')} required />
          )}
        </div>


        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Latitude</label>
            <input type="number" step="any" className="input-field" placeholder="28.6139" {...field('lat')} required />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input type="number" step="any" className="input-field" placeholder="77.2090" {...field('lng')} required />
          </div>
        </div>

        <button type="button" onClick={handleGeolocate} className="btn-secondary text-sm py-2">
          <MapPin className="w-4 h-4 text-brand-400" /> Use My Location
        </button>

        {/* Photo upload */}
        <div>
          <label className="label">Photo <span className="text-surface-muted font-normal">(optional)</span></label>
          <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handlePhotoChange} />
          <button type="button" onClick={() => fileRef.current.click()} className="btn-secondary text-sm py-2">
            <Image className="w-4 h-4" /> {photo ? photo.name : 'Choose Photo'}
          </button>
          {preview && (
            <img src={preview} alt="Preview" className="mt-3 rounded-xl max-h-48 object-cover w-full border border-surface-border" />
          )}
        </div>

        <button type="submit" disabled={submitting || uploading} className="btn-primary w-full justify-center py-3">
          {(submitting || uploading) ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {uploading ? 'Uploading photo…' : 'Submitting…'}</>
          ) : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
