
import React, { useState } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const users = storage.getUsers();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId);
    if (user) onLogin(user);
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'QC': return 'QC AGENT';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <div className="w-full h-12 bg-white border-b border-gray-200 flex items-center justify-center relative shadow-sm">
        <span className="text-[13px] font-medium text-slate-700">QC Evaluation Tool Pro</span>
        <div className="absolute right-4 flex items-center gap-4 text-[11px] text-slate-500">
           <button className="flex items-center gap-1 hover:text-slate-800 transition-colors">
             <i className="bi bi-display"></i> Device
           </button>
           <button className="hover:text-slate-800 transition-colors">
             <i className="bi bi-arrow-clockwise"></i>
           </button>
           <button className="hover:text-slate-800 transition-colors">
             <i className="bi bi-arrows-angle-expand"></i>
           </button>
        </div>
      </div>

      {/* Login Portal Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-12 flex flex-col items-center">
          
          {/* Icon Header */}
          <div className="w-14 h-14 bg-[#4f46e5] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
            <i className="bi bi-check-circle-fill text-white text-2xl"></i>
          </div>

          <h1 className="text-xl font-black text-[#1a2138] mb-2">QC Tool Portal</h1>
          <p className="text-[13px] text-slate-400 font-medium mb-10">Please select your account to continue</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-8">
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Login Identity</label>
              <select 
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-3 bg-[#f8fafc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-[13px] font-medium text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_1.25rem_center] bg-no-repeat"
                required
              >
                <option value="">Choose your name...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({getRoleLabel(u.role)})
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="submit"
              className={`w-full py-4 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[12px] shadow-lg transition-all active:scale-[0.98] ${
                selectedUserId 
                ? 'bg-[#1a2138] hover:bg-slate-800' 
                : 'bg-slate-300 cursor-not-allowed opacity-80'
              }`}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
      
      {/* Optional decorative element matching screenshot context */}
      <div className="fixed bottom-10 right-10">
          <div className="w-10 h-10 bg-[#1a2138] rounded-lg flex items-center justify-center text-yellow-400 text-lg shadow-xl cursor-help hover:scale-110 transition-transform">
             <i className="bi bi-stars"></i>
          </div>
      </div>
    </div>
  );
};

export default Login;
