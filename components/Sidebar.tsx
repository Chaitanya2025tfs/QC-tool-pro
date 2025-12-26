
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
    <div className="w-[15%] h-screen bg-[#0f172a] text-white flex flex-col fixed left-0 top-0 z-50 border-r border-white/5 shadow-xl">
      <div className="p-6 pb-2">
        {/* Compact Branding header */}
        <div className="flex flex-col mb-6 group cursor-default">
           <h1 className="text-[15px] font-black text-white uppercase tracking-[0.1em] leading-tight">
             QC<br/>EVALUATOR
           </h1>
           <div className="mt-4 flex flex-col gap-0.5">
              <span className="text-[12px] font-bold text-slate-300 truncate">{user.name}</span>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                {user.role}
              </span>
           </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 mt-2">
        {filteredTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-300 group relative border ${
              activeTab === tab.id
                ? 'bg-[#6366f1] text-white border-[#6366f1] shadow-[0_5px_15px_-5px_rgba(99,102,241,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <i className={`bi ${tab.icon} text-[16px] ${activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}></i>
            <span className={`text-[13px] ${activeTab === tab.id ? 'font-black' : 'font-medium'} truncate`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/10 transition-all group"
        >
          <i className="bi bi-box-arrow-left text-[18px]"></i>
          <span className="text-[13px] font-bold">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;