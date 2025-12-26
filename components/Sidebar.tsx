
import React from 'react';
import { User } from '../types';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isBackendConnected?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout, isBackendConnected = false }) => {
  const tabs = [
    { id: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'QC', 'AGENT'] },
    { id: 'qc-form', icon: 'bi-file-earmark-text', label: 'Qc form', roles: ['ADMIN', 'MANAGER', 'QC'] },
    { id: 'report-table', icon: 'bi-grid-3x3-gap-fill', label: 'Report table', roles: ['ADMIN', 'MANAGER', 'QC', 'AGENT'] },
    { id: 'admin-panel', icon: 'bi-shield-lock', label: 'Admin Panel', roles: ['ADMIN'] },
  ];

  const filteredTabs = tabs.filter(tab => tab.roles.includes(user.role));

  return (
    <div className="w-[15%] h-screen bg-[#1E2A56] text-white flex flex-col fixed left-0 top-0 z-50 border-r border-white/5 shadow-xl">
      <div className="p-4 pb-0 flex flex-col items-center">
        {/* Centered Brand Identity */}
        <div className="flex flex-col items-center group cursor-default w-full">
           <div className="flex items-end relative w-fit">
              <span className="text-[20px] font-[900] italic text-white tracking-tighter leading-none uppercase select-none font-sans">TRANSFORM</span>
              <div className="ml-1 mb-1 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 22 L22 2 V13 Z" fill="white" />
                 </svg>
              </div>
           </div>
           <span className="text-[9px] font-bold text-white/60 mt-1 tracking-widest uppercase text-center w-full">
             Solutions Simplified
           </span>

           {/* User Identity Section */}
           <div className="mt-6 flex flex-col items-center gap-3 py-5 w-full rounded-2xl bg-white/5 border border-white/5 shadow-inner mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg border border-white/10 shrink-0">
                <svg width="42" height="42" viewBox="0 0 100 100" className="text-black">
                  <circle cx="50" cy="50" r="48" fill="white" />
                  <circle cx="50" cy="32" r="16" fill="currentColor" />
                  <path d="M50 52 C30 52, 18 66, 18 80 L82 80 C82 66, 70 52, 50 52 Z" fill="currentColor" />
                  <rect x="30" y="60" width="40" height="28" rx="3" fill="#1E2A56" />
                  <circle cx="50" cy="74" r="2.5" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col items-center text-center px-4 w-full overflow-hidden">
                <span className="text-[13px] font-black text-white leading-tight mb-1 truncate w-full">
                  {user.name}
                </span>
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] truncate w-full">
                  {user.role}
                </span>
              </div>
           </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 group relative border ${
              activeTab === tab.id
                ? 'bg-white/10 text-white border-white/10 shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <i className={`bi ${tab.icon} text-[15px] ${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}></i>
            <span className={`text-[11px] ${activeTab === tab.id ? 'font-black' : 'font-medium'} truncate uppercase tracking-wider`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/40 rounded-l-full"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5 space-y-4">
        {/* System Status Indicator */}
        <div className="flex flex-col gap-2 px-2 py-3 rounded-xl bg-black/20 border border-white/5">
           <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Storage Status</span>
              <div className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'} animate-pulse`}></div>
           </div>
           <div className="flex items-center gap-2">
              <i className={`bi ${isBackendConnected ? 'bi-database-check text-emerald-400' : 'bi-hdd-fill text-rose-400'} text-[12px]`}></i>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${isBackendConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isBackendConnected ? 'MySQL Active' : 'Offline Mode'}
              </span>
           </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/10 transition-all group"
        >
          <i className="bi bi-box-arrow-left text-[16px]"></i>
          <span className="text-[11px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
