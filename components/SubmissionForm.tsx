
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Send, Loader2, AlertCircle, Mic, Check, Info, X } from 'lucide-react';
import { storageService } from '../services/storageService';
import { NoiseRecord } from '../types';

interface SubmissionFormProps {
  onSuccess: (record: NoiseRecord) => void;
  onClose?: () => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSuccess, onClose }) => {
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [db, setDb] = useState<number>(45);
  const [locationName, setLocationName] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [isApproximate, setIsApproximate] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [measureProgress, setMeasureProgress] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const handleGetLocation = () => {
    setIsLocating(true);
    setIsApproximate(false);
    setLocationStatus('Seeking GPS lock...');

    const highAccuracyOptions = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };
    const standardAccuracyOptions = { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 };

    const fetchIpFallback = async () => {
      setLocationStatus('GPS failed. Using IP...');
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.latitude && data.longitude) {
          setLat(data.latitude.toFixed(6));
          setLng(data.longitude.toFixed(6));
          setIsApproximate(true);
          setLocationStatus('Approximate (IP-based)');
          setIsLocating(false);
        } else {
          throw new Error("Invalid response");
        }
      } catch (err) {
        setIsLocating(false);
        setLocationStatus('');
        alert("Location failed. Please enter coordinates.");
      }
    };

    const successCallback = (pos: GeolocationPosition) => {
      setLat(pos.coords.latitude.toFixed(6));
      setLng(pos.coords.longitude.toFixed(6));
      setIsApproximate(false);
      setIsLocating(false);
      setLocationStatus('');
    };

    const fallbackToStandard = () => {
      setLocationStatus('Switching to standard...');
      navigator.geolocation.getCurrentPosition(
        successCallback,
        fetchIpFallback,
        standardAccuracyOptions
      );
    };

    navigator.geolocation.getCurrentPosition(successCallback, fallbackToStandard, highAccuracyOptions);
  };

  const startMeasurement = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsMeasuring(true);
      setMeasureProgress(0);
      const startTime = Date.now();
      const duration = 5000; 
      const samples: number[] = [];

      const updateMeasurement = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setMeasureProgress(progress);

        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < bufferLength; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / bufferLength);
          const currentDb = rms > 0 ? 20 * Math.log10(rms) + 95 : 30;
          samples.push(currentDb);
        }

        if (elapsed < duration) {
          animationRef.current = requestAnimationFrame(updateMeasurement);
        } else {
          const averageDb = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
          setDb(Math.max(30, Math.min(120, averageDb)));
          stopMicrophone();
        }
      };
      animationRef.current = requestAnimationFrame(updateMeasurement);
    } catch (err) {
      alert("Microphone denied.");
    }
  };

  const stopMicrophone = () => {
    setIsMeasuring(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
  };

  useEffect(() => () => stopMicrophone(), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lng) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const newRecord = storageService.saveNoiseRecord({
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        decibels: db,
        locationName: locationName || undefined
      });
      setIsSubmitting(false);
      onSuccess(newRecord);
      setLat('');
      setLng('');
      setDb(45);
      setLocationName('');
      setIsApproximate(false);
    }, 600);
  };

  return (
    <div className="w-full flex flex-col h-full overflow-y-auto no-scrollbar pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-800">Add Record</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acoustic Telemetry</p>
        </div>
        {onClose && (
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
             <X size={20} className="text-slate-400" />
           </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Location Section */}
        <div className="space-y-4">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
            1. Global Coordinates
            {lat && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${isApproximate ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                {isApproximate ? 'APPROX' : 'LOCKED'}
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Latitude</p>
                <p className="font-mono text-sm text-slate-600">{lat || '--.----'}</p>
             </div>
             <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Longitude</p>
                <p className="font-mono text-sm text-slate-600">{lng || '--.----'}</p>
             </div>
          </div>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            className={`w-full py-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border-2 ${
              isLocating 
                ? 'bg-slate-50 border-slate-100 text-slate-400 animate-pulse' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            {isLocating ? <Loader2 className="animate-spin" size={16} /> : <Navigation size={16} />}
            {isLocating ? 'FIXING POSITION...' : 'PIN CURRENT LOCATION'}
          </button>
          {locationStatus && <p className="text-[9px] text-center font-bold text-indigo-400 uppercase italic">{locationStatus}</p>}
        </div>

        {/* Noise Section */}
        <div className="space-y-4">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">2. Acoustic Intensity</label>
          <div className={`p-6 rounded-3xl border-2 transition-all ${
            isMeasuring ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-slate-100 bg-white shadow-sm'
          }`}>
            <div className="flex justify-between items-end mb-4">
              <span className="text-4xl font-black text-slate-800">{db} <small className="text-xs font-bold text-slate-400">dB</small></span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                db < 50 ? 'bg-green-100 text-green-700' : db < 75 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
              }`}>
                {db < 50 ? 'QUIET' : db < 75 ? 'MODERATE' : 'NOISY'}
              </span>
            </div>

            {isMeasuring ? (
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-100" style={{ width: `${measureProgress}%` }} />
                </div>
                <p className="text-[9px] font-black text-indigo-600 text-center uppercase tracking-tighter">Sampling Environment...</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={startMeasurement}
                className="w-full py-3 bg-slate-800 hover:bg-black text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all"
              >
                <Mic size={14} />
                AUTO-MEASURE NOISE
              </button>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">3. Venue Details</label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Name this location..."
            className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isMeasuring || !lat || !lng}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          SUBMIT PIN
        </button>
      </form>
    </div>
  );
};
