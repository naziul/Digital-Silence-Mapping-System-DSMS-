
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { NoiseMap } from './components/NoiseMap';
import { SubmissionForm } from './components/SubmissionForm';
import { Dashboard } from './components/Dashboard';
import { storageService } from './services/storageService';
import { NoiseRecord } from './types';
import { Plus, X } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'explore' | 'dashboard'>('explore');
  const [records, setRecords] = useState<NoiseRecord[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  useEffect(() => {
    const data = storageService.getNoiseRecords();
    setRecords(data);
    
    if (data.length === 0) {
        const mockData = [
            { latitude: 23.8103, longitude: 90.4125, decibels: 85, locationName: "Central Hub", id: '1', timestamp: Date.now() - 1000000 },
            { latitude: 23.8012, longitude: 90.4110, decibels: 42, locationName: "Green Park", id: '2', timestamp: Date.now() - 2000000 },
            { latitude: 23.8150, longitude: 90.4250, decibels: 62, locationName: "Suburban Block", id: '3', timestamp: Date.now() - 3000000 }
        ];
        mockData.forEach(m => storageService.saveNoiseRecord(m));
        setRecords(storageService.getNoiseRecords());
    }
  }, []);

  const handleDataUpdate = (newRecord?: NoiseRecord) => {
    const updatedRecords = storageService.getNoiseRecords();
    setRecords(updatedRecords);
    setIsSidebarOpen(false);
    if (newRecord) {
      setSelectedRecordId(newRecord.id);
    } else {
      setSelectedRecordId(null);
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="h-full relative overflow-hidden">
        {activeTab === 'explore' ? (
          <div className="w-full h-full flex relative overflow-hidden">
            {/* Background Map */}
            <div className="flex-1 h-full z-0">
              <NoiseMap 
                records={records} 
                selectedRecordId={selectedRecordId}
                onMarkerClick={(id) => setSelectedRecordId(id)}
                onMapClick={() => setSelectedRecordId(null)}
              />
            </div>

            {/* Float FAB for Sidebar - Permanently visible toggle */}
            <div className="absolute bottom-10 right-10 z-[4000] flex flex-col items-center">
              <span className="mb-4 bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-black shadow-lg transform whitespace-nowrap border border-slate-100 pointer-events-none transition-all">
                ADD NOISE PIN
              </span>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                  isSidebarOpen ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isSidebarOpen ? (
                  <X size={32} className="animate-in fade-in zoom-in duration-300" />
                ) : (
                  <Plus size={32} className="animate-in fade-in zoom-in duration-300" />
                )}
              </button>
            </div>

            {/* Combined Sidebar / Overlay */}
            <div 
              className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white/95 backdrop-blur-xl z-[3000] border-l border-slate-200 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-out p-8 ${
                isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
               <SubmissionForm 
                 onSuccess={handleDataUpdate} 
                 onClose={() => setIsSidebarOpen(false)} 
               />
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 min-h-full h-full overflow-y-auto pt-24 no-scrollbar">
            <Dashboard records={records} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
