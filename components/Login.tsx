
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

  // Close dropdown when clicking outside
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

    // Use stored user password if exists, otherwise fallback to default
    const correctPassword = user.password || '123456';
    if (password !== correctPassword) {
      setError('Incorrect password.');
      return;
    }

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans">
      <div className="w-full h-12 bg-white border-b border-gray-200 flex items-center justify-center relative shadow-sm">
        <span className="text-[18px] font-normal text-black">QC Evaluation Tool Pro</span>
        <div className="absolute right-4 flex items-center gap-4 text-[16px] text-black font-bold">
           <button className="flex items-center gap-1 hover:text-black transition-colors">
             <i className="bi bi-display"></i> Device
           </button>
           <button className="hover:text-black transition-colors">
             <i className="bi bi-arrow-clockwise"></i>
           </button>
           <button className="hover:text-black transition-colors">
             <i className="bi bi-arrows-angle-expand"></i>
           </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[540px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-14 flex flex-col items-center">
          
          <div className="w-20 h-20 bg-[#4f46e5] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-8">
            <i className="bi bi-shield-lock-fill text-white text-[40px]"></i>
          </div>

          <h1 className="text-[30px] font-black text-[#1a2138] mb-2 tracking-tight">System Login</h1>
          <p className="text-[18px] text-black font-bold mb-10 text-center">Enter your credentials to access the evaluator</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-8 relative">
            {/* Email Field with Autocomplete */}
            <div className="space-y-3 relative" ref={dropdownRef}>
              <label className="block text-[16px] font-bold text-black uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative">
                <i className="bi bi-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]"></i>
                <input 
                  type="text"
                  placeholder="name@gmail.com"
                  value={emailQuery}
                  onChange={handleEmailChange}
                  onFocus={() => emailQuery && setShowDropdown(true)}
                  className="w-full pl-14 pr-5 py-5 bg-[#f8fafc] border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-[21px] font-normal text-black"
                  required
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && filteredUsers.length > 0 && (
                <div className="absolute z-50 top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-[250px] overflow-y-auto custom-scrollbar overflow-hidden">
                  {filteredUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectUser(u)}
                      className="w-full px-6 py-4 text-left hover:bg-indigo-50 transition-colors flex flex-col group border-b border-slate-50 last:border-0"
                    >
                      <span className="text-[18px] font-bold text-black group-hover:text-indigo-600">{u.name}</span>
                      <span className="text-[15px] font-normal text-slate-500">{u.email || generateEmail(u.name)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <label className="block text-[16px] font-bold text-black uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <i className="bi bi-key absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]"></i>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-14 pr-5 py-5 bg-[#f8fafc] border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-[21px] font-normal text-black"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
                <i className="bi bi-exclamation-circle-fill"></i>
                <span className="text-[16px] font-bold">{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-5 text-white rounded-2xl font-normal uppercase tracking-[0.3em] text-[19px] shadow-xl transition-all active:scale-[0.98] ${
                !loading
                ? 'bg-[#111827] hover:bg-[#1f2937] shadow-indigo-500/10' 
                : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="pt-6 border-t border-slate-100 text-center">
              <p className="text-[14px] text-slate-400 font-medium">
                Need to change your password? <br/>
                <span className="text-black font-bold">Contact Admin Team</span> for support.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
