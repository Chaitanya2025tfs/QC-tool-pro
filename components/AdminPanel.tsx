
import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from '../types';
import { PROJECTS } from '../constants';
import { storage } from '../services/storage';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    role: 'AGENT',
    project: PROJECTS[0],
    email: '',
    password: '123456',
    phoneNumber: ''
  });

  // Modals state
  const [userToDelete, setUserToDelete] = useState<{ 
    user: User, 
    verificationCode: string, 
    inputCode: string, 
    isCodeSent: boolean,
    timer: number 
  } | null>(null);

  const [passwordModal, setPasswordModal] = useState<{ 
    user: User, 
    newPass: string, 
    verificationCode: string, 
    inputCode: string, 
    step: 'INIT' | 'VERIFY' | 'UPDATE',
    isCodeSent: boolean,
    timer: number
  } | null>(null);

  const [phoneModal, setPhoneModal] = useState<{ 
    user: User, 
    newPhone: string 
  } | null>(null);

  const timerRef = useRef<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await storage.getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (passwordModal?.isCodeSent && passwordModal.timer > 0) {
      const id = setInterval(() => {
        setPasswordModal(prev => prev ? { ...prev, timer: prev.timer - 1 } : null);
      }, 1000);
      return () => clearInterval(id);
    }
  }, [passwordModal?.isCodeSent, passwordModal?.timer]);

  useEffect(() => {
    if (userToDelete?.isCodeSent && userToDelete.timer > 0) {
      const id = setInterval(() => {
        setUserToDelete(prev => prev ? { ...prev, timer: prev.timer - 1 } : null);
      }, 1000);
      return () => clearInterval(id);
    }
  }, [userToDelete?.isCodeSent, userToDelete?.timer]);

  const generateEmail = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '') + '@gmail.com';
  };

  const handleNameChange = (name: string) => {
    setNewUser({
      ...newUser,
      name,
      email: generateEmail(name)
    });
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;
    const user = {
      ...newUser,
      id: Math.random().toString(36).substr(2, 9),
      password: newUser.password || '123456'
    } as User;
    
    setLoading(true);
    await storage.saveUser(user);
    await fetchUsers();
    setNewUser({ name: '', role: 'AGENT', project: PROJECTS[0], email: '', password: '123456', phoneNumber: '' });
  };

  const handleRoleChange = async (id: string, newRole: Role) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setLoading(true);
      await storage.saveUser({ ...user, role: newRole });
      await fetchUsers();
    }
  };

  // Password Verification Logic
  const openPasswordModal = (u: User) => {
    setPasswordModal({ 
      user: u, 
      newPass: '', 
      verificationCode: '', 
      inputCode: '', 
      step: 'VERIFY', 
      isCodeSent: false, 
      timer: 0 
    });
  };

  const sendPassCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[SIMULATION] Password Reset Code for ${passwordModal?.user.email}: ${code}`);
    setPasswordModal(prev => prev ? { ...prev, verificationCode: code, isCodeSent: true, timer: 60 } : null);
  };

  const handleVerifyPassCode = () => {
    if (passwordModal && passwordModal.timer <= 0) {
      alert("Verification code expired. Please send a new one.");
      return;
    }
    if (passwordModal && passwordModal.inputCode === passwordModal.verificationCode) {
      setPasswordModal({ ...passwordModal, step: 'UPDATE' });
    } else {
      alert("Invalid Verification Code!");
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordModal || !passwordModal.newPass) return;
    setLoading(true);
    await storage.saveUser({ ...passwordModal.user, password: passwordModal.newPass });
    await fetchUsers();
    setPasswordModal(null);
  };

  // Delete Verification Logic
  const openDeleteModal = (u: User) => {
    setUserToDelete({ user: u, verificationCode: '', inputCode: '', isCodeSent: false, timer: 0 });
  };

  const sendDeleteCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[SIMULATION] Delete Account Code for ${userToDelete?.user.phoneNumber}: ${code}`);
    setUserToDelete(prev => prev ? { ...prev, verificationCode: code, isCodeSent: true, timer: 60 } : null);
  };

  const confirmDelete = async () => {
    if (userToDelete && userToDelete.timer <= 0) {
      alert("Verification code expired.");
      return;
    }
    if (userToDelete && userToDelete.inputCode === userToDelete.verificationCode) {
      setLoading(true);
      await storage.deleteUser(userToDelete.user.id);
      await fetchUsers();
      setUserToDelete(null);
    } else {
      alert("Invalid Verification Code!");
    }
  };

  // Phone Change Logic (No Verification Required)
  const handleUpdatePhone = async () => {
    if (!phoneModal || !phoneModal.newPhone) return;
    setLoading(true);
    await storage.saveUser({ ...phoneModal.user, phoneNumber: phoneModal.newPhone });
    await fetchUsers();
    setPhoneModal(null);
  };

  return (
    <div className="p-10 bg-[#f3f4f6] min-h-screen font-sans">
      <div className="w-[90%] mx-auto space-y-10 relative">
        
        {loading && !users.length && (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* 2x2 Form Section */}
        <div className="bg-white p-12 rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-slate-100 space-y-8">
          <h2 className="text-[25px] font-black text-[#1e293b] tracking-tight mb-2 uppercase">Create Account Container</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Row 1: Name and Role */}
            <div>
              <label className="block text-[15px] font-bold text-black uppercase tracking-widest mb-3 ml-1">Name</label>
              <input 
                type="text" 
                value={newUser.name}
                onChange={e => handleNameChange(e.target.value)}
                className="w-full px-6 py-5 bg-[#f8fafc] border border-slate-200 rounded-2xl outline-none text-[18px] font-normal text-black focus:border-indigo-500 transition-all"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-[15px] font-bold text-black uppercase tracking-widest mb-3 ml-1">Role</label>
              <select 
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                className="w-full px-6 py-5 bg-white border border-slate-200 rounded-2xl outline-none text-[18px] font-normal text-black appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1.5rem_center] bg-no-repeat pr-10"
              >
                <option value="AGENT">Agent</option>
                <option value="QC">QC Checker</option>
                <option value="MANAGER">Manager/TL</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Row 2: Email and Password */}
            <div>
              <label className="block text-[15px] font-bold text-black uppercase tracking-widest mb-3 ml-1">Email</label>
              <input 
                type="email" 
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                className="w-full px-6 py-5 bg-[#f8fafc] border border-slate-200 rounded-2xl outline-none text-[18px] font-normal text-black focus:border-indigo-500 transition-all"
                placeholder="Email Address"
              />
            </div>
            <div>
              <label className="block text-[15px] font-bold text-black uppercase tracking-widest mb-3 ml-1">Password</label>
              <input 
                type="text" 
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                className="w-full px-6 py-5 bg-[#f8fafc] border border-slate-200 rounded-2xl outline-none text-[18px] font-normal text-black focus:border-indigo-500 transition-all"
                placeholder="123456"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-50 pt-8">
            <div>
              <label className="block text-[15px] font-bold text-black uppercase tracking-widest mb-3 ml-1">Phone Number</label>
              <input 
                type="text" 
                value={newUser.phoneNumber}
                onChange={e => setNewUser({...newUser, phoneNumber: e.target.value})}
                className="w-full px-6 py-5 bg-[#f8fafc] border border-slate-200 rounded-2xl outline-none text-[18px] font-normal text-black focus:border-indigo-500 transition-all"
                placeholder="+91 00000 00000"
              />
            </div>
            <div>
              <label className="block text-[15px] font-bold text-black uppercase tracking-widest mb-3 ml-1">Project</label>
              <div className="flex gap-4">
                <select 
                  value={newUser.project}
                  onChange={e => setNewUser({...newUser, project: e.target.value})}
                  className="flex-1 px-6 py-5 bg-white border border-slate-200 rounded-2xl outline-none text-[18px] font-normal text-black appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1.5rem_center] bg-no-repeat pr-10"
                >
                  {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button 
                  onClick={handleAddUser}
                  disabled={loading || !newUser.name}
                  className="px-10 py-5 bg-[#2563eb] text-white font-black uppercase tracking-[0.2em] text-[17px] rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                >
                  ADD USER
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
          <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
             <h3 className="text-[18px] font-black text-black uppercase tracking-tight">Access Repository</h3>
             <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">{users.length} Active Accounts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[18px]">
              <thead>
                <tr className="text-left bg-white border-b border-slate-50">
                  <th className="px-10 py-7 font-bold text-black uppercase tracking-widest text-[14px]">User Identity</th>
                  <th className="px-10 py-7 font-bold text-black uppercase tracking-widest text-[14px]">System Role</th>
                  <th className="px-10 py-7 font-bold text-black uppercase tracking-widest text-[14px]">Campaign</th>
                  <th className="px-10 py-7 font-bold text-black uppercase tracking-widest text-[14px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-10 py-7">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1e293b]">{u.name}</span>
                        <span className="text-[14px] text-slate-400 font-normal lowercase">{u.email} • {u.phoneNumber || 'No Phone'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <select 
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                        disabled={loading}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[16px] font-medium text-black outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px] bg-[right_1rem_center] bg-no-repeat pr-8 disabled:opacity-50"
                      >
                        <option value="AGENT">Agent</option>
                        <option value="QC">QC Checker</option>
                        <option value="MANAGER">Manager/TL</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-10 py-7">
                       <span className="px-4 py-1.5 rounded-full bg-slate-100 text-[14px] font-bold text-slate-600 uppercase tracking-tighter">
                         {u.project || 'Global'}
                       </span>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end gap-3 transition-opacity">
                        <button 
                          onClick={() => openPasswordModal(u)}
                          className="px-4 py-2.5 bg-[#4f46e5] text-white rounded-xl text-[14px] font-black uppercase hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                        >
                          Change Password
                        </button>
                        <button 
                          onClick={() => setPhoneModal({ user: u, newPhone: u.phoneNumber || '' })}
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-indigo-50 text-[#4f46e5] hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                          title="Change Phone Number"
                        >
                          <i className="bi bi-telephone-plus-fill text-[20px]"></i>
                        </button>
                        <button 
                          onClick={() => openDeleteModal(u)}
                          disabled={loading}
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm disabled:opacity-50 active:scale-95"
                          title="Remove User"
                        >
                          <i className="bi bi-trash3-fill text-[20px]"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Password Verification Modal Flow */}
      {passwordModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[22px] font-black text-black uppercase tracking-tight">
                  {passwordModal.step === 'VERIFY' ? 'Security Check' : 'Update Credentials'}
                </h3>
                <button onClick={() => setPasswordModal(null)} className="text-slate-400 hover:text-black"><i className="bi bi-x-lg"></i></button>
              </div>

              {passwordModal.step === 'VERIFY' && (
                <>
                  <p className="text-[16px] text-slate-500 font-medium leading-relaxed">
                    Verify account for <span className="font-bold text-black">{passwordModal.user.name}</span>. Codes are sent to registered channels.
                  </p>

                  {!passwordModal.isCodeSent ? (
                    <button 
                      onClick={sendPassCode}
                      className="w-full py-5 bg-[#4f46e5] text-white rounded-2xl font-black uppercase text-[16px] shadow-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <i className="bi bi-send-fill"></i> Send Verification Code
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[14px] font-bold text-black uppercase tracking-widest">Enter Code</label>
                        <span className={`text-[14px] font-bold ${passwordModal.timer > 10 ? 'text-indigo-600' : 'text-rose-500'}`}>
                          Expires in: {passwordModal.timer}s
                        </span>
                      </div>
                      <input 
                        type="text" 
                        maxLength={6}
                        value={passwordModal.inputCode}
                        onChange={e => setPasswordModal({...passwordModal, inputCode: e.target.value})}
                        className="w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-[28px] font-black text-center tracking-[0.5em] focus:border-indigo-500"
                        placeholder="000000"
                        autoFocus
                      />
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={handleVerifyPassCode} 
                          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[16px] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                        >
                          Verify Account
                        </button>
                        <button 
                          onClick={sendPassCode}
                          className="text-[14px] font-bold text-slate-400 uppercase tracking-widest hover:text-black transition-colors"
                        >
                          Didn't get code? Resend
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {passwordModal.step === 'UPDATE' && (
                <>
                  <p className="text-[16px] text-slate-500 font-medium">Identity verified. Please set the new access code for <span className="font-bold text-black">{passwordModal.user.name}</span>.</p>
                  <div className="space-y-2">
                    <label className="text-[14px] font-bold text-black uppercase tracking-widest ml-1">New Password</label>
                    <input 
                      type="text" 
                      value={passwordModal.newPass}
                      onChange={e => setPasswordModal({...passwordModal, newPass: e.target.value})}
                      className="w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-[21px] font-normal"
                      placeholder="Enter new code..."
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setPasswordModal(null)} className="flex-1 py-5 bg-slate-100 text-black rounded-2xl font-black uppercase text-[15px]">Cancel</button>
                    <button 
                      onClick={handleUpdatePassword} 
                      disabled={!passwordModal.newPass}
                      className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[15px] shadow-xl shadow-indigo-600/20 disabled:opacity-50 active:scale-95 transition-all"
                    >
                      Update
                    </button>
                  </div>
                </>
              )}
           </div>
        </div>
      )}

      {/* Phone Change Modal (No Verification Required) */}
      {phoneModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[22px] font-black text-black uppercase tracking-tight">Change Mobile</h3>
                <button onClick={() => setPhoneModal(null)} className="text-slate-400 hover:text-black"><i className="bi bi-x-lg"></i></button>
              </div>
              <p className="text-[16px] text-slate-500">Updating contact for <span className="font-bold text-black">{phoneModal.user.name}</span>.</p>
              
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-black uppercase tracking-widest ml-1">New Mobile Number</label>
                <input 
                  type="text" 
                  value={phoneModal.newPhone}
                  onChange={e => setPhoneModal({...phoneModal, newPhone: e.target.value})}
                  className="w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-[21px] font-normal"
                  placeholder="+91 00000 00000"
                  autoFocus
                />
              </div>

              <div className="flex gap-4 pt-4">
                 <button onClick={() => setPhoneModal(null)} className="flex-1 py-5 bg-slate-100 text-black rounded-2xl font-black uppercase text-[15px]">Cancel</button>
                 <button 
                  onClick={handleUpdatePhone} 
                  disabled={!phoneModal.newPhone}
                  className="flex-1 py-5 bg-[#4f46e5] text-white rounded-2xl font-black uppercase text-[15px] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                 >
                   Save Mobile
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Delete Verification Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
              <i className="bi bi-person-x-fill text-[41px]"></i>
            </div>
            <h3 className="text-[25px] font-black text-[#1e293b] mb-2">Delete Agent Account?</h3>
            <p className="text-[16px] text-slate-500 font-medium mb-8 leading-relaxed">
              Verification is required to remove <span className="font-black text-black">{userToDelete.user.name}</span>. Code will be sent to their registered mobile.
            </p>
            
            {!userToDelete.isCodeSent ? (
              <div className="flex w-full gap-5">
                <button 
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-5 bg-slate-100 text-[#1e293b] rounded-2xl font-black uppercase tracking-widest text-[16px] hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={sendDeleteCode}
                  className="flex-1 py-5 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[16px] hover:bg-rose-600 shadow-xl shadow-rose-500/30 transition-all"
                >
                  Send Code
                </button>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[14px] font-bold text-black uppercase tracking-widest">Verification Code</label>
                  <span className={`text-[14px] font-bold ${userToDelete.timer > 10 ? 'text-rose-500' : 'text-slate-400'}`}>
                    Time: {userToDelete.timer}s
                  </span>
                </div>
                <input 
                  type="text" 
                  maxLength={6}
                  value={userToDelete.inputCode}
                  onChange={e => setUserToDelete({...userToDelete, inputCode: e.target.value})}
                  className="w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-[28px] font-black text-center tracking-[0.5em] focus:border-rose-500"
                  placeholder="000000"
                />
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={confirmDelete}
                    className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black uppercase text-[16px] shadow-xl shadow-rose-500/30 active:scale-95 transition-all"
                  >
                    Confirm Termination
                  </button>
                  <button 
                    onClick={sendDeleteCode}
                    className="text-[14px] font-bold text-slate-400 uppercase tracking-widest hover:text-black"
                  >
                    Resend Code
                  </button>
                  <button 
                    onClick={() => setUserToDelete(null)}
                    className="text-[14px] font-bold text-rose-500 uppercase underline"
                  >
                    Abort Process
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
