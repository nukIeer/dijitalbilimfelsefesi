import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, MapPin, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

// Create a pulsating dot using simple HTML and Tailwind's animate-ping
const createPulseIcon = () => {
  return L.divIcon({
    className: 'custom-pulse-marker',
    html: `
      <div class="relative flex h-5 w-5 items-center justify-center">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-[#8A1538]"></span>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10], // center the icon
  });
};

const LOCATIONS = [
  { id: 'Synthese', name: 'Synthese', coords: [52.3676, 4.9041], desc: 'Springer, Netherlands', mockCount: 2105 },
  { id: 'PhilSci', name: 'Philosophy of Science', coords: [41.8781, -87.6298], desc: 'Chicago, USA', mockCount: 1540 },
  { id: 'BJPS', name: 'The British Journal for the Philosophy of Science', coords: [51.7520, -1.2577], desc: 'Oxford, UK', mockCount: 1340 },
  { id: 'SHPS', name: 'Studies in History and Philosophy of Science', coords: [52.2053, 0.1218], desc: 'Elsevier, UK', mockCount: 1120 },
  { id: 'Mind', name: 'Mind', coords: [51.7548, -1.2544], desc: 'Oxford University Press, UK', mockCount: 890 },
  { id: 'Erkenntnis', name: 'Erkenntnis', coords: [48.1351, 11.5820], desc: 'Springer, Germany', mockCount: 840 },
  { id: 'IntStud', name: 'Int. Studies in the Philosophy of Science', coords: [51.5072, -0.1276], desc: 'UK', mockCount: 650 },
  { id: 'Analysis', name: 'Analysis', coords: [51.5098, -0.1180], desc: 'OUP, UK', mockCount: 520 },
  { id: 'PhilQ', name: 'The Philosophical Quarterly', coords: [56.3398, -2.7967], desc: 'St Andrews, UK', mockCount: 450 },
  { id: 'Monist', name: 'The Monist', coords: [40.7128, -74.0060], desc: 'USA', mockCount: 310 },
  { id: 'Aristotelian', name: 'Aristotelian Society Supp.', coords: [51.5223, -0.1308], desc: 'London, UK', mockCount: 227 },
].sort((a, b) => b.mockCount - a.mockCount); 

function SetViewOnChange({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(coords, 5, { duration: 1.5 });
  }, [coords, map]);
  return null;
}

export default function SpatialAnalysis() {
  const [loading, setLoading] = useState(true);
  const [activeLoc, setActiveLoc] = useState<any>(null);

  useEffect(() => {
    // Simulate loading to match the feel of other data-heavy components
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] w-full flex-col gap-4 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#8A1538]" />
        <p className="font-serif font-bold text-gray-900 text-lg">Mekânsal Dağılım Hesaplanıyor</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Kurumsal / Mekânsal Dağılım</h2>
        <p className="font-sans text-gray-600">Makalelerin yayımlandığı dergilerin kurumsal kökenlerine göre coğrafi haritalandırması.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Leaderboard Sidebar */}
        <div className="lg:col-span-1 bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col h-[600px]">
          <div className="bg-[#FAFAFA] border-b border-gray-100 p-4 flex items-center gap-3 shrink-0">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-serif font-bold text-gray-900 text-lg leading-none">Lider Tablosu</h3>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {LOCATIONS.map((loc, idx) => (
              <motion.button
                key={loc.id}
                onClick={() => setActiveLoc(loc)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeLoc?.id === loc.id ? 'bg-rose-50 border border-rose-100' : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                  <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-sans font-bold text-sm text-gray-900 truncate" title={loc.name}>{loc.name}</h4>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5"><MapPin className="inline w-3 h-3 mr-0.5 opacity-70" />{loc.desc}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="bg-[#8A1538] text-white text-[10px] font-bold px-2 py-1 rounded-full">{loc.mockCount}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-3 h-[600px] border border-gray-200 shadow-sm rounded-xl overflow-hidden relative bg-blue-50">
          <MapContainer center={[50.505, -15.09]} zoom={4} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            {activeLoc && <SetViewOnChange coords={activeLoc.coords as [number, number]} />}
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" // Daha sade ve modern bir basemap
            />
            {LOCATIONS.map((loc, idx) => (
              <Marker 
                key={idx} 
                position={loc.coords as [number, number]} 
                icon={createPulseIcon()}
                eventHandlers={{
                  click: () => setActiveLoc(loc),
                }}
              >
                <Popup className="custom-popup">
                  <div className="font-sans min-w-[200px]">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-2 leading-snug">{loc.name}</h3>
                    <p className="text-gray-600 text-xs mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> {loc.desc}</p>
                    <div className="bg-rose-50 text-[#8A1538] p-2 rounded-md border border-rose-100 flex items-center justify-between">
                       <span className="text-xs font-semibold uppercase tracking-widest text-rose-700/80">Yayın</span>
                       <span className="font-black text-lg">{loc.mockCount.toLocaleString("tr-TR")}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
