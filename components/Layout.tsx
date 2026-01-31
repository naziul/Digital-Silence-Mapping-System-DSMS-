
import React from 'react';
import { Map, LayoutDashboard, Volume2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'explore' | 'dashboard';
  setActiveTab: (tab: 'explore' | 'dashboard') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-fit pointer-events-none">
        <nav className="flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-white/20 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 mr-2 border-r border-slate-200">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Volume2 className="text-white w-4 h-4" />
            </div>
            <h1 className="text-sm font-black tracking-tighter text-slate-800">DSMS</h1>
          </div>
          
          <button 
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'explore' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Map size={16} />
            <span>EXPLORER</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <LayoutDashboard size={16} />
            <span>INSIGHTS</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden h-full">
        {children}
      </main>
    </div>
  );
};
