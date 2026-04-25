import { useEffect, useState } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { getNeeds } from '../lib/api.js';
import { Link } from 'react-router-dom';
import { MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const URGENCY_PIN = (score) => {
  if (score >= 8) return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
  if (score >= 5) return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
  return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
};

export default function MapPage() {
  const [needs, setNeeds]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getNeeds()
      .then((r) => setNeeds(r.data.filter((n) => n.lat && n.lng)))
      .catch(() => toast.error('Failed to load map data'))
      .finally(() => setLoading(false));
  }, []);

  // Default to India center
  const center = needs.length > 0
    ? { lat: needs[0].lat, lng: needs[0].lng }
    : { lat: 20.5937, lng: 78.9629 };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Needs Map</h1>
        <p className="text-slate-400 mt-1">
          {needs.length} geo-tagged reports · 🔴 Critical &nbsp;🟡 Medium &nbsp;🟢 Low
        </p>
      </div>

      <div className="glass-card overflow-hidden" style={{ height: '70vh' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          </div>
        ) : (
          <APIProvider apiKey={API_KEY}>
            <Map
              defaultCenter={center}
              defaultZoom={5}
              mapId="sevasetu-map"
              colorScheme="DARK"
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              {needs.map((need) => (
                <Marker
                  key={need.id}
                  position={{ lat: need.lat, lng: need.lng }}
                  icon={URGENCY_PIN(need.urgency_score)}
                  onClick={() => setSelected(need)}
                />
              ))}

              {selected && (
                <InfoWindow
                  position={{ lat: selected.lat, lng: selected.lng }}
                  onCloseClick={() => setSelected(null)}
                >
                  <div className="p-1 max-w-xs">
                    <p className="font-semibold text-slate-900 text-sm">{selected.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{selected.location}</p>
                    <p className="text-xs mt-1">
                      Urgency: <strong>{selected.urgency_score}/10</strong> · {selected.status}
                    </p>
                    <a
                      href={`/needs/${selected.id}`}
                      className="text-xs text-blue-600 hover:underline mt-1.5 inline-block"
                    >
                      View details →
                    </a>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        )}
      </div>
    </div>
  );
}
