import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import { Link } from 'react-router-dom';
import { getNeeds } from '../lib/api.js';
import { ShieldAlert, Droplet, Utensils, Home, Info, Crosshair, ChevronRight, Activity, MapPin } from 'lucide-react';

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 20.5937, lng: 78.9629 };
const LIBRARIES = ['visualization'];

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#64779e" }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#334e87" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
  { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3C7680" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b0d5ce" }] },
  { featureType: "road.highway", elementType: "labels.text.stroke", stylers: [{ color: "#023e58" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "transit", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#283d6a" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#3a4762" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] }
];

export default function NeedsMap() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const [reports, setReports] = useState([]);
  const [filterTab, setFilterTab] = useState('Sab');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Fetch needs and map their categories to match filter keys if needed
    getNeeds().then(res => setReports(res.data.filter(n => n.lat && n.lng)));
  }, []);

  const onLoad = useCallback(map => { mapRef.current = map; }, []);
  const onUnmount = useCallback(() => { mapRef.current = null; }, []);

  const flyTo = (report) => {
    setSelectedMarker(report);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: report.lat, lng: report.lng });
      mapRef.current.setZoom(12);
    }
  };

  // Filter Logic
  const validFilters = { 'Sab': 'All', 'Medical': 'Medical', 'Paani': 'Water', 'Khana': 'Food', 'Aawas': 'Shelter' };
  
  const filteredReports = reports
    .filter(r => filterTab === 'Sab' || r.category === validFilters[filterTab])
    .sort((a, b) => b.urgency_score - a.urgency_score);

  const getHeatmapData = () => {
    if (!window.google) return [];
    return filteredReports.map(r => ({
      location: new window.google.maps.LatLng(r.lat, r.lng),
      weight: r.urgency_score
    }));
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Medical': return <Activity className="w-5 h-5 text-red-400" />;
      case 'Water':   return <Droplet className="w-5 h-5 text-blue-400" />;
      case 'Food':    return <Utensils className="w-5 h-5 text-orange-400" />;
      case 'Shelter': return <Home className="w-5 h-5 text-purple-400" />;
      default:        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getUrgencyBadge = (label, score) => {
    if (score >= 80) return <span className="bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-500/30">CRITICAL</span>;
    if (score >= 60) return <span className="bg-orange-500/20 text-orange-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-orange-500/30">HIGH</span>;
    if (score >= 40) return <span className="bg-yellow-500/20 text-yellow-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-yellow-500/30">MEDIUM</span>;
    return <span className="bg-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-500/30">LOW</span>;
  };

  const getCustomMarkerIcon = (score) => {
    const color = score >= 80 ? 'red' : score >= 60 ? 'orange' : score >= 40 ? 'yellow' : 'green';
    return `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
  };

  if (loadError) return <div className="p-8 text-center text-red-400">Map load karne mein samasya aayi. API Key check karein.</div>;
  if (!isLoaded) return <div className="p-8 flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div></div>;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-4 lg:p-0 absolute lg:relative inset-0 overflow-hidden">
      {/* ── Left Panel: List (35%) ── */}
      <div className="w-full lg:w-[35%] flex flex-col bg-surface-card border-r border-surface-border h-1/2 lg:h-full z-10 shadow-2xl overflow-hidden rounded-xl lg:rounded-none">
        
        <div className="p-5 border-b border-surface-border shrink-0 bg-surface">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-brand-500" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Zaroorat Hotspots</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.keys(validFilters).map(tab => (
              <button 
                key={tab} 
                onClick={() => setFilterTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300
                  ${filterTab === tab 
                    ? 'bg-brand-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                    : 'bg-surface-border text-slate-400 hover:bg-surface-border/80'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredReports.map(report => (
            <div 
              key={report.id} 
              onClick={() => flyTo(report)}
              className="glass-card p-4 hover:border-brand-500/50 cursor-pointer transition-colors group relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-surface rounded-xl group-hover:scale-110 transition-transform">
                  {getCategoryIcon(report.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white truncate text-base">{report.title}</h3>
                    {getUrgencyBadge(report.priority_label, report.urgency_score)}
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 truncate">
                    <MapPin className="w-3.5 h-3.5" />
                    {report.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {filteredReports.length === 0 && (
            <div className="text-center p-8 text-slate-500 text-sm">Koi report nahin mili.</div>
          )}
        </div>
      </div>

      {/* ── Right Panel: Map (65%) ── */}
      <div className="w-full lg:w-[65%] h-1/2 lg:h-full relative rounded-xl lg:rounded-none overflow-hidden">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={5}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            styles: mapStyles,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
          }}
        >
          {/* Heatmap */}
          {window.google && getHeatmapData().length > 0 && (
            <HeatmapLayer 
              data={getHeatmapData()} 
              options={{
                radius: 30,
                opacity: 0.8,
                gradient: [
                  'rgba(0, 255, 255, 0)',
                  'rgba(0, 255, 255, 1)',
                  'rgba(0, 191, 255, 1)',
                  'rgba(0, 127, 255, 1)',
                  'rgba(0, 63, 255, 1)',
                  'rgba(0, 0, 255, 1)',
                  'rgba(0, 0, 223, 1)',
                  'rgba(0, 0, 191, 1)',
                  'rgba(0, 0, 159, 1)',
                  'rgba(0, 0, 127, 1)',
                  'rgba(63, 0, 91, 1)',
                  'rgba(127, 0, 63, 1)',
                  'rgba(191, 0, 31, 1)',
                  'rgba(255, 0, 0, 1)'
                ]
              }} 
            />
          )}

          {/* Individual Markers */}
          {filteredReports.map(report => (
            <Marker
              key={report.id}
              position={{ lat: report.lat, lng: report.lng }}
              icon={getCustomMarkerIcon(report.urgency_score)}
              onClick={() => flyTo(report)}
            />
          ))}

          {/* Info Window */}
          {selectedMarker && (
            <InfoWindow
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-1 max-w-[220px]">
                <h4 className="font-bold text-slate-900 text-base leading-tight mb-1">{selectedMarker.title}</h4>
                <div className="flex items-center gap-1.5 mb-2 border-b border-gray-100 pb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded-md text-gray-700">{selectedMarker.category}</span>
                  <span className="text-xs font-semibold text-gray-500">Score: {selectedMarker.urgency_score}</span>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  <strong>Prahbhavit log (Affected):</strong> {selectedMarker.people_affected || 'N/A'}
                </p>
                <div className="mt-3">
                  <Link 
                    to={`/needs/${selectedMarker.id}`}
                    className="block w-full text-center bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs py-2 px-3 rounded shadow-sm transition-colors"
                  >
                    Volunteer Assign Karo
                  </Link>
                </div>
              </div>
            </InfoWindow>
          )}

        </GoogleMap>
      </div>
    </div>
  );
}
