
import React from 'react';
import { User } from '../types';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout }) => {
  const tabs = [
    { id: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'QC', 'AGENT'] },
    { id: 'qc-form', icon: 'bi-file-earmark-text', label: 'Qc form', roles: ['ADMIN', 'MANAGER', 'QC'] },
    { id: 'report-table', icon: 'bi-grid-3x3-gap-fill', label: 'Report table', roles: ['ADMIN', 'MANAGER', 'QC', 'AGENT'] },
    { id: 'admin-panel', icon: 'bi-shield-lock', label: 'Admin Panel', roles: ['ADMIN'] },
  ];

  const filteredTabs = tabs.filter(tab => tab.roles.includes(user.role));

  return (
    <div className="w-[15%] h-screen bg-[#1E2A56] text-white flex flex-col fixed left-0 top-0 z-50 border-r border-white/5 shadow-xl">
      <div className="p-5 pb-2">
        {/* Compact Brand Identity Implementation */}
        <div className="flex flex-col mb-6 group cursor-default">
           <div className="flex items-end relative pr-6 w-fit">
              <span className="text-[20px] font-[900] italic text-white tracking-tighter leading-none uppercase select-none font-sans">TRANSFORM</span>
              <div className="absolute top-[-3px] right-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                 {/* Reconstructed Shard Arrow - Scaled down for sidebar */}
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 22 L22 2 V13 Z" fill="white" />
                 </svg>
              </div>
           </div>
           <span className="text-[10px] font-bold text-white/80 mt-1 tracking-tight pl-0.5 uppercase">
             Solutions Simplified
           </span>

           <div className="mt-8 flex flex-col gap-0.5 border-l-2 border-white/20 pl-3">
              <span className="text-[12px] font-bold text-slate-100 truncate">{user.name}</span>
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                {user.role}
              </span>
           </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 mt-2 overflow-y-auto custom-scrollbar">
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
            <i className={`bi ${tab.icon} text-[16px] ${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}></i>
            <span className={`text-[12px] ${activeTab === tab.id ? 'font-black' : 'font-medium'} truncate`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/40 rounded-l-full"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/10 transition-all group"
        >
          <i className="bi bi-box-arrow-left text-[18px]"></i>
          <span className="text-[12px] font-bold">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
