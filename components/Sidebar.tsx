
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

  const getRoleLabel = (role: string) => {
    if (role === 'QC') return 'QC AGENT';
    return role;
  };

  return (
    <div className="w-64 h-screen bg-[#0f172a] text-white flex flex-col fixed left-0 top-0 z-20">
      <div className="p-8 pb-4">
        <h1 className="text-[25px] font-black text-white tracking-tight">QC EVALUATOR</h1>
        <div className="mt-3 flex flex-col">
          <span className="text-[19px] font-medium text-slate-300">{user.name}</span>
          <span className="text-[16px] font-bold text-[#6366f1] uppercase tracking-wider mt-0.5">
            {getRoleLabel(user.role)}
          </span>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="h-px bg-slate-800 w-full opacity-50"></div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-2">
        {filteredTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 group relative ${
              activeTab === tab.id
                ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <i className={`bi ${tab.icon} text-[23px] ${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}></i>
            <span className={`text-[20px] ${activeTab === tab.id ? 'font-semibold' : 'font-medium'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800/50">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/10 transition-all group"
        >
          <i className="bi bi-box-arrow-left text-[23px] group-hover:scale-110 transition-transform"></i>
          <span className="text-[20px] font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
