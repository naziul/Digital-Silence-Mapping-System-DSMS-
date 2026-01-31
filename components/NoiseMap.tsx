
import React, { useEffect, useRef } from 'react';
import { NoiseRecord } from '../types';

interface NoiseMapProps {
  records: NoiseRecord[];
  selectedRecordId?: string | null;
  onMarkerClick?: (id: string) => void;
  onMapClick?: () => void;
}

export const NoiseMap: React.FC<NoiseMapProps> = ({ 
  records, 
  selectedRecordId,
  onMarkerClick,
  onMapClick
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  const getMarkerColor = (db: number) => {
    if (db < 50) return '#22c55e'; // Green
    if (db < 75) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already done
    if (!mapRef.current) {
      mapRef.current = (window as any).L.map(mapContainerRef.current, {
        zoomControl: false
      }).setView([23.8103, 90.4125], 15);
      
      (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      (window as any).L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

      mapRef.current.on('click', () => {
        if (onMapClick) onMapClick();
      });
    }

    // Sync markers
    const currentRecordIds = new Set(records.map(r => r.id));
    
    markersRef.current.forEach((marker, id) => {
      if (!currentRecordIds.has(id)) {
        mapRef.current.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    records.forEach(record => {
      if (!markersRef.current.has(record.id)) {
        const color = getMarkerColor(record.decibels);
        const marker = (window as any).L.circleMarker([record.latitude, record.longitude], {
          radius: 14,
          fillColor: color,
          color: '#fff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(mapRef.current);

        marker.on('click', (e: any) => {
          (window as any).L.DomEvent.stopPropagation(e);
          if (onMarkerClick) onMarkerClick(record.id);
        });

        marker.bindPopup(`
          <div class="p-3 min-w-[150px]">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
              <span class="font-black text-xl text-slate-800">${record.decibels} <small class="text-xs font-normal">dB</small></span>
            </div>
            <p class="text-xs font-bold text-slate-500 uppercase tracking-tight">${record.locationName || 'Unlabeled Node'}</p>
            <hr class="my-2 border-slate-100" />
            <p class="text-[10px] text-slate-400">Captured: ${new Date(record.timestamp).toLocaleString()}</p>
            <p class="text-[10px] font-mono text-slate-300 mt-1">${record.latitude.toFixed(5)}, ${record.longitude.toFixed(5)}</p>
          </div>
        `, { closeButton: false });

        markersRef.current.set(record.id, marker);
      }
    });

    // Handle view centering
    const L = (window as any).L;
    if (selectedRecordId) {
      const record = records.find(r => r.id === selectedRecordId);
      if (record) {
        mapRef.current.flyTo([record.latitude, record.longitude], 17, {
          animate: true,
          duration: 1.5
        });
        const marker = markersRef.current.get(record.id);
        if (marker) marker.openPopup();
      }
    } else if (records.length > 0) {
      const bounds = L.latLngBounds(records.map(r => [r.latitude, r.longitude]));
      mapRef.current.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 16,
        animate: true,
        duration: 1.5
      });
      // Close any open popups when showing all
      mapRef.current.closePopup();
    }

  }, [records, selectedRecordId, onMarkerClick, onMapClick]);

  return (
    <div className="w-full h-full bg-slate-100 relative">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Legend Overlay */}
      <div className="absolute top-6 left-6 z-10 bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-200">
        <h4 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Sound Levels</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4 group cursor-help">
            <div className="relative">
              <span className="block w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-700">Silence Zone</span>
              <span className="block text-[10px] text-slate-400">&lt; 50dB (Whisper/Library)</span>
            </div>
          </div>
          <div className="flex items-center gap-4 group cursor-help">
            <span className="w-5 h-5 rounded-full bg-orange-500 border-2 border-white shadow-sm" />
            <div>
              <span className="block text-xs font-bold text-slate-700">Moderate Zone</span>
              <span className="block text-[10px] text-slate-400">50-75dB (Normal Office)</span>
            </div>
          </div>
          <div className="flex items-center gap-4 group cursor-help">
            <span className="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow-sm" />
            <div>
              <span className="block text-xs font-bold text-slate-700">Noisy Zone</span>
              <span className="block text-[10px] text-slate-400">&gt; 75dB (Traffic/Construction)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overlay */}
      <div className="absolute bottom-6 left-6 z-10 bg-indigo-600 text-white p-4 px-6 rounded-2xl shadow-xl flex items-center gap-4">
        <div className="text-center">
          <span className="block text-[10px] font-bold opacity-70 uppercase">Active Nodes</span>
          <span className="block text-xl font-black">{records.length}</span>
        </div>
        <div className="w-px h-8 bg-white/20"></div>
        <div className="text-center">
          <span className="block text-[10px] font-bold opacity-70 uppercase">Avg. City Noise</span>
          <span className="block text-xl font-black">
            {records.length > 0 ? Math.round(records.reduce((a, b) => a + b.decibels, 0) / records.length) : '--'} <small className="text-xs">dB</small>
          </span>
        </div>
      </div>
    </div>
  );
};
