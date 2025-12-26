
import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from '../types';
import { PROJECTS } from '../constants';
import { storage } from '../services/storage';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Verification & Modal States
  const [verifyModal, setVerifyModal] = useState<{ 
    isOpen: boolean; 
    type: 'PASSWORD' | 'PHONE' | 'DELETE' | null; 
    user: User | null; 
    step: 'START' | 'CODE' | 'INPUT' | 'SUCCESS';
    enteredCode: string;
    newValue: string;
    timer: number;
    isExpired: boolean;
    isSending: boolean;
  }>({
    isOpen: false,
    type: null,
    user: null,
    step: 'START',
    enteredCode: '',
    newValue: '',
    timer: 60,
    isExpired: false,
    isSending: false
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    role: 'AGENT',
    project: PROJECTS[0],
    email: '',
    password: '123456',
    phoneNumber: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    const data = await storage.getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Timer logic for verification - only runs in 'CODE' step
  useEffect(() => {
    if (verifyModal.isOpen && verifyModal.step === 'CODE' && verifyModal.timer > 0) {
      timerRef.current = setInterval(() => {
        setVerifyModal(prev => ({
          ...prev,
          timer: prev.timer - 1,
          isExpired: prev.timer <= 1
        }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [verifyModal.isOpen, verifyModal.step, verifyModal.timer]);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;
    const user = {
      ...newUser,
      id: Math.random().toString(36).substr(2, 9),
      password: newUser.password || '123456'
    } as User;
    
    setLoading(true);
    try {
      await storage.saveUser(user);
      await fetchUsers();
      setNewUser({ 
        name: '', 
        role: 'AGENT', 
        project: PROJECTS[0], 
        email: '', 
        password: '123456', 
        phoneNumber: '' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (user: User, newRole: Role) => {
    const updatedUser = { ...user, role: newRole };
    await storage.saveUser(updatedUser);
    await fetchUsers();
  };

  // Verification Logic
  const openVerifyModal = (user: User, type: 'PASSWORD' | 'PHONE' | 'DELETE') => {
    setVerifyModal({
      isOpen: true,
      type,
      user,
      step: 'START',
      enteredCode: '',
      newValue: '',
      timer: 60,
      isExpired: false,
      isSending: false
    });
  };

  const sendCode = () => {
    setVerifyModal(prev => ({ ...prev, isSending: true }));
    // Simulate API delay for sending code
    setTimeout(() => {
      setVerifyModal(prev => ({ 
        ...prev, 
        isSending: false, 
        step: 'CODE', 
        timer: 60, 
        isExpired: false 
      }));
    }, 1200);
  };

  const verifyCode = () => {
    if (verifyModal.isExpired) {
      alert("Verification code has expired. Please request a new one.");
      return;
    }
    // Simple 4-digit check for demo
    if (verifyModal.enteredCode.length >= 4) {
      setVerifyModal(prev => ({ ...prev, step: 'INPUT' }));
    } else {
      alert("Please enter a valid verification code.");
    }
  };

  const saveVerifiedChange = async () => {
    if (!verifyModal.user) return;
    
    setLoading(true);
    try {
      if (verifyModal.type === 'DELETE') {
        await storage.deleteUser(verifyModal.user.id);
      } else {
        if (!verifyModal.newValue) return;
        const updatedUser = { ...verifyModal.user };
        if (verifyModal.type === 'PASSWORD') updatedUser.password = verifyModal.newValue;
        if (verifyModal.type === 'PHONE') updatedUser.phoneNumber = verifyModal.newValue;
        await storage.saveUser(updatedUser);
      }
      
      await fetchUsers();
      setVerifyModal(prev => ({ ...prev, step: 'SUCCESS' }));
    } finally {
      setLoading(false);
    }
  };

  const closeVerification = () => {
    setVerifyModal({ 
      isOpen: false, type: null, user: null, step: 'START', 
      enteredCode: '', newValue: '', timer: 60, isExpired: false, isSending: false 
    });
  };

  return (
    <div className="flex flex-col gap-6 py-2 pb-20 font-sans">
      {/* User Creation Section */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-[18px] font-black text-[#1a2138] uppercase tracking-tight">System Account Management</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="admin-input" placeholder="Name" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})} className="admin-input cursor-pointer">
                <option value="AGENT">Agent</option>
                <option value="QC">QC Checker</option>
                <option value="MANAGER">Manager / TL</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
              <input type="text" value={newUser.phoneNumber} onChange={e => setNewUser({...newUser, phoneNumber: e.target.value})} className="admin-input" placeholder="9876543210" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Email</label>
              <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="admin-input" placeholder="Email" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Password</label>
              <input type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="admin-input" placeholder="123456" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-8 space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Campaign</label>
              <select value={newUser.project} onChange={e => setNewUser({...newUser, project: e.target.value})} className="admin-input cursor-pointer">
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="md:col-span-4">
              <button onClick={handleAddUser} disabled={loading} className="w-full py-3 bg-[#4f46e5] text-white rounded-xl font-black uppercase tracking-[0.2em] text-[12px] shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98]">
                {loading ? 'Processing...' : 'Register User'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Repository Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
           <h3 className="text-[14px] font-black text-[#1a2138] uppercase tracking-tight">User Repository</h3>
           <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">{users.length} Active Accounts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/20 border-b border-slate-50">
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">User Identity</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">System Role</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Campaign</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-[#1a2138]">{u.name}</span>
                      <span className="text-[12px] text-slate-400 font-medium">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="relative group max-w-fit">
                      <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                        className={`appearance-none px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase cursor-pointer outline-none border border-transparent hover:border-slate-200 transition-all ${
                          u.role === 'ADMIN' ? 'bg-rose-50 text-rose-500' : 
                          u.role === 'MANAGER' ? 'bg-indigo-50 text-indigo-500' :
                          u.role === 'QC' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER / TL</option>
                        <option value="QC">QC</option>
                        <option value="AGENT">AGENT</option>
                      </select>
                      <i className="bi bi-chevron-down absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 scale-75"></i>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-[13px] font-bold text-slate-400">
                    {u.phoneNumber || '--'}
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter bg-indigo-50/50 px-2.5 py-1 rounded-md">
                      {u.project || 'GLOBAL'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => openVerifyModal(u, 'PASSWORD')}
                        className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-slate-100"
                        title="Change Password"
                      >
                        <i className="bi bi-key-fill text-[16px]"></i>
                      </button>
                      <button 
                        onClick={() => openVerifyModal(u, 'PHONE')}
                        className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-slate-100"
                        title="Change Mobile Number"
                      >
                        <i className="bi bi-telephone-plus-fill text-[16px]"></i>
                      </button>
                      <button 
                        onClick={() => openVerifyModal(u, 'DELETE')}
                        className="w-9 h-9 flex items-center justify-center bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-slate-200 border-2"
                        title="Remove People"
                      >
                        <i className="bi bi-person-x-fill text-[18px]"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal System */}
      {verifyModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1a2138]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-10 relative">
            
            {/* Close Button */}
            <button 
              onClick={closeVerification} 
              className="absolute top-8 right-8 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-500 transition-all"
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Step 1: Send Code */}
            {verifyModal.step === 'START' && (
              <div className="text-center space-y-8">
                <div className={`w-20 h-20 ${verifyModal.type === 'DELETE' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'} rounded-[2rem] flex items-center justify-center mx-auto text-[32px] shadow-sm`}>
                   <i className={`bi ${verifyModal.type === 'PASSWORD' ? 'bi-shield-lock-fill' : verifyModal.type === 'PHONE' ? 'bi-phone-vibrate-fill' : 'bi-person-x-fill'}`}></i>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[20px] font-black text-[#1a2138] uppercase tracking-tight">Security Check</h3>
                  <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                    Verify permission for <span className="font-bold text-black">{verifyModal.user?.name}</span> by sending a 6-digit code.
                  </p>
                </div>
                <button 
                  onClick={sendCode} 
                  disabled={verifyModal.isSending}
                  className={`w-full py-4 ${verifyModal.type === 'DELETE' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-[#4f46e5] hover:bg-indigo-700 shadow-indigo-600/20'} text-white rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-xl transition-all active:scale-[0.98] disabled:opacity-50`}
                >
                  {verifyModal.isSending ? 'Generating Code...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {verifyModal.step === 'CODE' && (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto text-[32px] shadow-sm">
                  <i className="bi bi-shield-fill-check"></i>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-[20px] font-black text-[#1a2138] uppercase tracking-tight">OTP Verification</h3>
                  <p className="text-[13px] text-slate-400 font-medium leading-relaxed px-4">
                    A verification code has been sent to <br/>
                    <span className="font-bold text-indigo-500">{verifyModal.user?.phoneNumber || 'registered number'}</span>
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="relative group">
                    <input 
                      type="text" 
                      maxLength={6}
                      autoFocus
                      value={verifyModal.enteredCode}
                      onChange={e => setVerifyModal({ ...verifyModal, enteredCode: e.target.value.replace(/\D/g, '') })}
                      className="w-full text-center py-5 bg-slate-50 border border-slate-100 rounded-2xl text-[28px] font-black tracking-[0.5em] outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all text-slate-400"
                      placeholder="000000"
                    />
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${verifyModal.isExpired ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                    <span className={`text-[12px] font-bold ${verifyModal.isExpired ? 'text-rose-500' : 'text-slate-400'}`}>
                      {verifyModal.isExpired ? 'Code Expired' : `Valid for ${verifyModal.timer}s`}
                    </span>
                    {verifyModal.isExpired && (
                      <button onClick={sendCode} className="ml-2 text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Resend</button>
                    )}
                  </div>
                </div>

                <button 
                  onClick={verifyCode} 
                  disabled={verifyModal.isExpired || verifyModal.enteredCode.length < 4}
                  className="w-full py-4 bg-[#8b5cf6]/60 text-white rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-xl hover:bg-[#8b5cf6] transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Verify Code
                </button>
              </div>
            )}

            {/* Step 3: Final Input or Delete Confirmation */}
            {verifyModal.step === 'INPUT' && (
              <div className="text-center space-y-8">
                <div className={`w-20 h-20 ${verifyModal.type === 'DELETE' ? 'bg-rose-50 text-rose-500' : verifyModal.type === 'PASSWORD' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'} rounded-[2rem] flex items-center justify-center mx-auto text-[32px] shadow-sm`}>
                  <i className={`bi ${verifyModal.type === 'PASSWORD' ? 'bi-key-fill' : verifyModal.type === 'PHONE' ? 'bi-phone-fill' : 'bi-person-x-fill'}`}></i>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[20px] font-black text-[#1a2138] uppercase tracking-tight">Identity Verified</h3>
                  <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                    {verifyModal.type === 'DELETE' 
                      ? "Are you absolutely sure you want to remove this employee record permanently?"
                      : `Please enter the new ${verifyModal.type?.toLowerCase()} for`
                    } <br/>
                    <span className="font-bold text-black">{verifyModal.user?.name}</span>
                  </p>
                </div>

                {verifyModal.type !== 'DELETE' && (
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New {verifyModal.type}</label>
                    <input 
                      type={verifyModal.type === 'PASSWORD' ? 'text' : 'tel'} 
                      value={verifyModal.newValue}
                      onChange={e => setVerifyModal({ ...verifyModal, newValue: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[16px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all shadow-inner"
                      placeholder={`Enter new ${verifyModal.type === 'PASSWORD' ? 'password' : 'phone number'}...`}
                    />
                  </div>
                )}

                <button 
                  onClick={saveVerifiedChange} 
                  disabled={verifyModal.type !== 'DELETE' && !verifyModal.newValue}
                  className={`w-full py-4 ${
                    verifyModal.type === 'DELETE' ? 'bg-rose-500 shadow-rose-500/20' : 
                    verifyModal.type === 'PASSWORD' ? 'bg-[#4f46e5] shadow-indigo-500/20' : 'bg-[#10b981] shadow-emerald-500/20'
                  } text-white rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 border border-black/10`}
                >
                  {verifyModal.type === 'DELETE' ? 'Remove Employee' : 'Update Account'}
                </button>
              </div>
            )}

            {/* Step 4: Success Message */}
            {verifyModal.step === 'SUCCESS' && (
              <div className="text-center space-y-8 animate-in zoom-in-95 duration-300">
                <div className={`w-24 h-24 ${verifyModal.type === 'DELETE' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'} rounded-full flex items-center justify-center mx-auto text-[45px] shadow-md border`}>
                  <i className={`bi ${verifyModal.type === 'DELETE' ? 'bi-person-x-fill' : 'bi-check-circle-fill'}`}></i>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-[24px] font-black text-[#1a2138] uppercase tracking-tight">
                    {verifyModal.type === 'DELETE' ? 'Deleted!' : 'Success!'}
                  </h3>
                  <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
                    {verifyModal.type === 'DELETE' 
                      ? "The employee record has been permanently removed from the system."
                      : `The ${verifyModal.type === 'PASSWORD' ? 'password' : 'mobile number'} has been updated successfully.`
                    }
                  </p>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={closeVerification}
                    className="w-full py-4 bg-[#1a2138] text-white rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-xl hover:bg-black transition-all active:scale-[0.98]"
                  >
                    Finish & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .admin-input {
          width: 100%;
          padding: 0.65rem 1rem;
          background-color: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 0.75rem;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
        }
        .admin-input:focus {
          background-color: white;
          border-color: #e2e8f0;
          box-shadow: 0 4px 12px -2px rgba(0,0,0,0.02);
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
