
import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from '../types';
import { PROJECTS } from '../constants';
import { storage } from '../services/storage';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSuccess, setShowAddSuccess] = useState<{ isOpen: boolean; name: string; role: Role } | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState<{ isOpen: boolean; name: string; role: Role } | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null);
  
  // Verification & Modal States for Sensitive Updates (Password/Phone/Add)
  const [verifyModal, setVerifyModal] = useState<{ 
    isOpen: boolean; 
    type: 'PASSWORD' | 'PHONE' | 'ADD' | null; 
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
    gender: 'Male',
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

  const handleAddUserRequest = () => {
    if (!newUser.name || !newUser.email || !newUser.phoneNumber) {
      alert("Please fill name, email, and phone number to proceed.");
      return;
    }
    openVerifyModal(null, 'ADD');
  };

  const handleRoleChange = async (user: User, newRole: Role) => {
    const updatedUser = { ...user, role: newRole };
    await storage.saveUser(updatedUser);
    await fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setLoading(true);
    const deletedInfo = { name: userToDelete.name, role: userToDelete.role };
    try {
      await storage.deleteUser(userToDelete.id);
      await fetchUsers();
      setUserToDelete(null);
      // Show deletion success popup
      setShowDeleteSuccess({ isOpen: true, ...deletedInfo });
    } finally {
      setLoading(false);
    }
  };

  // Verification Logic for updates
  const openVerifyModal = (user: User | null, type: 'PASSWORD' | 'PHONE' | 'ADD') => {
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
    if (verifyModal.enteredCode.length >= 4) {
      if (verifyModal.type === 'ADD') {
        saveVerifiedChange();
      } else {
        setVerifyModal(prev => ({ ...prev, step: 'INPUT' }));
      }
    } else {
      alert("Please enter a valid verification code.");
    }
  };

  const saveVerifiedChange = async () => {
    setLoading(true);
    try {
      if (verifyModal.type === 'ADD') {
        const userToSave = {
          ...newUser,
          id: Math.random().toString(36).substr(2, 9),
          password: newUser.password || '123456',
          project: 'GLOBAL' // Defaulting project since field is removed
        } as User;
        
        await storage.saveUser(userToSave);
        await fetchUsers();
        
        setNewUser({ 
          name: '', 
          role: 'AGENT',
          gender: 'Male',
          email: '', 
          password: '123456', 
          phoneNumber: '' 
        });

        closeVerification();
        setShowAddSuccess({ 
          isOpen: true, 
          name: userToSave.name, 
          role: userToSave.role 
        });
        return;
      }

      if (!verifyModal.newValue || !verifyModal.user) {
         setLoading(false);
         return;
      };
      const updatedUser = { ...verifyModal.user };
      if (verifyModal.type === 'PASSWORD') updatedUser.password = verifyModal.newValue;
      if (verifyModal.type === 'PHONE') updatedUser.phoneNumber = verifyModal.newValue;
      await storage.saveUser(updatedUser);
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
        <h2 className="text-[18px] font-black text-[#1E2A56] uppercase tracking-tight">System Account Management</h2>
        
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
              <select value={newUser.gender} onChange={e => setNewUser({...newUser, gender: e.target.value})} className="admin-input cursor-pointer">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
              <input type="text" value={newUser.phoneNumber} onChange={e => setNewUser({...newUser, phoneNumber: e.target.value})} className="admin-input" placeholder="9876543210" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Email</label>
              <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="admin-input" placeholder="Email" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Password</label>
              <input type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="admin-input" placeholder="123456" />
            </div>
          </div>

          <div className="pt-2">
            <button onClick={handleAddUserRequest} disabled={loading} className="w-full py-3 bg-[#4f46e5] text-white rounded-xl font-black uppercase tracking-[0.2em] text-[12px] shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98]">
              {loading ? 'Processing...' : 'Register User'}
            </button>
          </div>
        </div>
      </div>

      {/* User Repository Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
           <h3 className="text-[14px] font-black text-[#1E2A56] uppercase tracking-tight">User Repository</h3>
           <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">{users.length} Active Accounts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/20 border-b border-slate-50">
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">User Identity</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Contact</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">System Role</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex flex-col items-start">
                      <button 
                        onClick={() => setSelectedUserDetails(u)}
                        className="text-[14px] font-bold text-[#1E2A56] hover:text-indigo-600 transition-colors text-left"
                      >
                        {u.name}
                      </button>
                      <span className="text-[12px] text-slate-400 font-medium">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-1.5 group cursor-pointer" onClick={() => setSelectedUserDetails(u)}>
                      <i className="bi bi-shield-lock text-slate-300 group-hover:text-indigo-400 transition-colors"></i>
                      <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest group-hover:text-slate-500 transition-colors">Private</span>
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
                        onClick={() => setUserToDelete(u)}
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

      {/* User Detail View Modal (Revealing Private Data) */}
      {selectedUserDetails && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-[#1E2A56]/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[360px] rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-10 relative space-y-8">
            <button 
              onClick={() => setSelectedUserDetails(null)}
              className="absolute top-8 right-8 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-500 transition-all"
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-[36px] shadow-sm border border-indigo-100">
                  <i className="bi bi-person-badge-fill"></i>
               </div>
               <div className="space-y-1">
                  <h3 className="text-[20px] font-black text-[#1E2A56] uppercase tracking-tight">{selectedUserDetails.name}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                      selectedUserDetails.role === 'ADMIN' ? 'bg-rose-50 text-rose-500' : 
                      selectedUserDetails.role === 'MANAGER' ? 'bg-indigo-50 text-indigo-500' :
                      selectedUserDetails.role === 'QC' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {selectedUserDetails.role}
                    </span>
                    <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">
                      {selectedUserDetails.gender || 'N/A'}
                    </span>
                  </div>
               </div>
            </div>

            <div className="space-y-6 pt-2">
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</span>
                  <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 text-[14px] font-bold text-[#1E2A56] flex items-center gap-3">
                     <i className="bi bi-envelope-fill text-slate-300"></i>
                     {selectedUserDetails.email}
                  </div>
               </div>

               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Secure Contact Number</span>
                  <div className="bg-emerald-50/50 px-4 py-3 rounded-2xl border border-emerald-100 text-[18px] font-black text-emerald-600 flex items-center gap-3 shadow-sm">
                     <i className="bi bi-telephone-fill"></i>
                     {selectedUserDetails.phoneNumber || 'Not Registered'}
                  </div>
               </div>
            </div>

            <button 
              onClick={() => setSelectedUserDetails(null)}
              className="w-full py-4 bg-[#1E2A56] text-white rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-xl hover:bg-black transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Smaller & Direct) */}
      {userToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1E2A56]/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[320px] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-8 relative text-center space-y-6">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-[24px] shadow-sm border border-rose-100">
              <i className="bi bi-trash3-fill"></i>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-[18px] font-black text-[#1E2A56] uppercase tracking-tight leading-tight">Remove People?</h3>
              <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                Delete account for <br/>
                <span className="font-bold text-black">{userToDelete.name}</span>?
              </p>
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={handleDeleteUser}
                className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-rose-600 transition-all active:scale-[0.98]"
              >
                Delete
              </button>
              <button 
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Removal Success Modal */}
      {showDeleteSuccess && showDeleteSuccess.isOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[#1E2A56]/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[320px] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-8 relative text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-[32px] shadow-md border border-rose-100">
              <i className="bi bi-person-x-fill"></i>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-[20px] font-black text-[#1E2A56] uppercase tracking-tight">User Removed!</h3>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed px-1">
                <span className="font-bold text-black">{showDeleteSuccess.name}</span> has been successfully removed as <span className="font-bold text-rose-500">{showDeleteSuccess.role}</span>.
              </p>
            </div>

            <button 
              onClick={() => setShowDeleteSuccess(null)}
              className="w-full py-3.5 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* New User Added Success Modal (Smaller Size) */}
      {showAddSuccess && showAddSuccess.isOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[#1E2A56]/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[320px] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-8 relative text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-[32px] shadow-md border border-emerald-100">
              <i className="bi bi-person-check-fill"></i>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-[20px] font-black text-[#1E2A56] uppercase tracking-tight">Access Granted!</h3>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed px-1">
                <span className="font-bold text-black">{showAddSuccess.name}</span> successfully added as <span className="font-bold text-indigo-500">{showAddSuccess.role}</span>.
              </p>
            </div>

            <button 
              onClick={() => setShowAddSuccess(null)}
              className="w-full py-3.5 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Verification Modal System for Password/Phone/Add */}
      {verifyModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1E2A56]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-10 relative">
            
            <button 
              onClick={closeVerification} 
              className="absolute top-8 right-8 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-500 transition-all"
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {verifyModal.step === 'START' && (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto text-[32px] shadow-sm">
                   <i className={`bi ${verifyModal.type === 'PASSWORD' ? 'bi-shield-lock-fill' : verifyModal.type === 'PHONE' ? 'bi-phone-vibrate-fill' : 'bi-person-plus-fill'}`}></i>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[20px] font-black text-[#1E2A56] uppercase tracking-tight">Security Check</h3>
                  <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                    Verify permission for <span className="font-bold text-black">{verifyModal.type === 'ADD' ? 'Adding New User' : verifyModal.user?.name}</span> by sending a 6-digit code.
                  </p>
                </div>
                <button 
                  onClick={sendCode} 
                  disabled={verifyModal.isSending}
                  className="w-full py-4 bg-[#4f46e5] hover:bg-indigo-700 shadow-indigo-600/20 text-white rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {verifyModal.isSending ? 'Generating Code...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {verifyModal.step === 'CODE' && (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto text-[32px] shadow-sm">
                  <i className="bi bi-shield-fill-check"></i>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-[20px] font-black text-[#1E2A56] uppercase tracking-tight">OTP Verification</h3>
                  <p className="text-[13px] text-slate-400 font-medium leading-relaxed px-4">
                    A verification code has been sent to <br/>
                    <span className="font-bold text-indigo-500">
                      {verifyModal.type === 'ADD' ? newUser.phoneNumber : (verifyModal.user?.phoneNumber || 'registered number')}
                    </span>
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
                  className="w-full py-4 bg-[#8b5cf6] text-white rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Verify Code
                </button>
              </div>
            )}

            {verifyModal.step === 'INPUT' && (
              <div className="text-center space-y-8">
                <div className={`w-20 h-20 ${verifyModal.type === 'PASSWORD' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'} rounded-[2rem] flex items-center justify-center mx-auto text-[32px] shadow-sm`}>
                  <i className={`bi ${verifyModal.type === 'PASSWORD' ? 'bi-key-fill' : 'bi-phone-fill'}`}></i>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[20px] font-black text-[#1E2A56] uppercase tracking-tight">Identity Verified</h3>
                  <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                    Please enter the new {verifyModal.type?.toLowerCase()} for <br/>
                    <span className="font-bold text-black">{verifyModal.user?.name}</span>
                  </p>
                </div>

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

                <button 
                  onClick={saveVerifiedChange} 
                  disabled={!verifyModal.newValue}
                  className={`w-full py-4 ${
                    verifyModal.type === 'PASSWORD' ? 'bg-[#4f46e5] shadow-indigo-500/20' : 'bg-[#10b981] shadow-emerald-500/20'
                  } text-white rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 border border-black/10`}
                >
                  Update Account
                </button>
              </div>
            )}

            {verifyModal.step === 'SUCCESS' && (
              <div className="text-center space-y-8 animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 border-emerald-100 rounded-full flex items-center justify-center mx-auto text-[45px] shadow-md border">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-[24px] font-black text-[#1E2A56] uppercase tracking-tight">Success!</h3>
                  <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
                    The {verifyModal.type === 'PASSWORD' ? 'password' : 'mobile number'} has been updated successfully.
                  </p>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={closeVerification}
                    className="w-full py-4 bg-[#1E2A56] text-white rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-xl hover:bg-black transition-all active:scale-[0.98]"
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
