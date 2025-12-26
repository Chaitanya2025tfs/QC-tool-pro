
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [emailQuery, setEmailQuery] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await storage.getUsers();
      setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateEmail = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '') + '@gmail.com';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmailQuery(val);
    setError('');

    if (val.length > 0) {
      const filtered = users.filter(u => 
        (u.email && u.email.includes(val.toLowerCase())) || 
        u.name.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowDropdown(true);
    } else {
      setFilteredUsers([]);
      setShowDropdown(false);
    }
  };

  const selectUser = (user: User) => {
    setEmailQuery(user.email || generateEmail(user.name));
    setShowDropdown(false);
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => (u.email || generateEmail(u.name)).toLowerCase() === emailQuery.toLowerCase());
    
    if (!user) {
      setError('Email address not found.');
      return;
    }

    const correctPassword = user.password || '123456';
    if (password !== correctPassword) {
      setError('Incorrect password.');
      return;
    }

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans">
      {/* Top Utility Bar - Matches density of previous UI fixes */}
      <div className="w-full h-10 bg-white border-b border-gray-200 flex items-center justify-center relative shadow-sm">
        <span className="text-[14px] font-bold text-slate-500 uppercase tracking-widest">QC Evaluation Tool Pro</span>
        <div className="absolute right-4 flex items-center gap-3 text-[14px] text-slate-400">
           <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
             <i className="bi bi-display text-[14px]"></i>
             <span className="text-[11px] font-black uppercase tracking-tighter">Device</span>
           </div>
           <i className="bi bi-arrow-clockwise cursor-pointer hover:text-black transition-colors"></i>
           <i className="bi bi-arrows-angle-expand cursor-pointer hover:text-black transition-colors"></i>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {/* Login Card - Scaled down to be more compact (Approx 420px wide) */}
        <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] p-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 border border-white">
          
          <div className="w-16 h-16 bg-[#4f46e5] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 transition-transform hover:scale-110 duration-500">
            <i className="bi bi-shield-lock-fill text-white text-[32px]"></i>
          </div>

          <h1 className="text-[24px] font-black text-[#1a2138] mb-1 tracking-tight uppercase">System Login</h1>
          <p className="text-[13px] text-slate-400 font-bold mb-8 text-center uppercase tracking-widest">Secure Evaluator Access</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-6 relative">
            
            {/* Email Field */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative">
                <i className="bi bi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[16px]"></i>
                <input 
                  type="text"
                  placeholder="name@gmail.com"
                  value={emailQuery}
                  onChange={handleEmailChange}
                  onFocus={() => emailQuery && setShowDropdown(true)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 focus:bg-white outline-none transition-all text-[15px] font-medium text-black"
                  required
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && filteredUsers.length > 0 && (
                <div className="absolute z-50 top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-[200px] overflow-y-auto custom-scrollbar overflow-hidden">
                  {filteredUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectUser(u)}
                      className="w-full px-5 py-3 text-left hover:bg-indigo-50 transition-colors flex flex-col group border-b border-slate-50 last:border-0"
                    >
                      <span className="text-[14px] font-bold text-black group-hover:text-indigo-600">{u.name}</span>
                      <span className="text-[12px] font-medium text-slate-400">{u.email || generateEmail(u.name)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <i className="bi bi-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[16px]"></i>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 focus:bg-white outline-none transition-all text-[15px] font-medium text-black"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-rose-500 animate-in fade-in slide-in-from-top-2">
                <i className="bi bi-exclamation-circle-fill text-[14px]"></i>
                <span className="text-[13px] font-bold">{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[14px] shadow-lg transition-all active:scale-[0.97] ${
                !loading
                ? 'bg-[#1E2A56] hover:bg-black shadow-indigo-900/10' 
                : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="pt-6 border-t border-slate-50 text-center">
              <p className="text-[12px] text-slate-400 font-medium">
                Locked out of your account? <br/>
                <span className="text-indigo-600 font-black uppercase tracking-tighter cursor-pointer hover:underline">Request Reset from IT</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
