
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
    { id: 'qc-form', icon: 'bi-file-earmark-check', label: 'Qc form', roles: ['ADMIN', 'MANAGER', 'QC'] },
    { id: 'report-table', icon: 'bi-table', label: 'Report table', roles: ['ADMIN', 'MANAGER', 'QC', 'AGENT'] },
  ];

  const filteredTabs = tabs.filter(tab => tab.roles.includes(user.role));

  const getRoleLabel = (role: string) => {
    if (role === 'QC') return 'QC AGENT';
    return role;
  };

  return (
    <div className="w-64 h-screen bg-[#111827] text-white flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6 pt-10">
        <h1 className="text-sm font-black text-white uppercase tracking-wider">QC EVALUATOR</h1>
        <div className="mt-1 flex flex-col">
          <span className="text-[11px] font-bold text-slate-400">{user.name}</span>
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{getRoleLabel(user.role)}</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 mt-6">
        {filteredTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-[#4f46e5] text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <i className={`bi ${tab.icon} text-sm`}></i>
            <span className="text-[13px] font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <i className="bi bi-box-arrow-right text-sm"></i>
          <span className="text-[13px] font-bold">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
