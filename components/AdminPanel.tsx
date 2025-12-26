
import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { PROJECTS } from '../constants';
import { storage } from '../services/storage';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    role: 'AGENT',
    project: PROJECTS[0]
  });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await storage.getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    if (!newUser.name) return;
    const user = {
      ...newUser,
      id: Math.random().toString(36).substr(2, 9),
    } as User;
    
    setLoading(true);
    await storage.saveUser(user);
    await fetchUsers();
    setNewUser({ name: '', role: 'AGENT', project: PROJECTS[0] });
  };

  const handleRoleChange = async (id: string, newRole: Role) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setLoading(true);
      await storage.saveUser({ ...user, role: newRole });
      await fetchUsers();
    }
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      setLoading(true);
      await storage.deleteUser(userToDelete.id);
      await fetchUsers();
      setUserToDelete(null);
    }
  };

  return (
    <div className="p-10 bg-[#f3f4f6] min-h-screen font-sans">
      <div className="w-[90%] mx-auto space-y-10 relative">
        
        {loading && !users.length && (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
            <div>
              <label className="block text-[15px] font-bold text-black uppercase tracking-widest mb-2 ml-1">Name</label>
              <input 
                type="text" 
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
                className="w-full px-5 py-4 bg-[#f8fafc] border border-slate-200 rounded-xl outline-none text-[18px] font-normal text-black"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-[15px] font-bold text-black uppercase tracking-widest mb-2 ml-1">Role</label>
              <select 
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl outline-none text-[18px] font-normal text-black appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_1.25rem_center] bg-no-repeat pr-10"
              >
                <option value="AGENT">Agent</option>
                <option value="QC">QC Checker</option>
                <option value="MANAGER">Manager/TL</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[15px] font-bold text-black uppercase tracking-widest mb-2 ml-1">Project</label>
              <select 
                value={newUser.project}
                onChange={e => setNewUser({...newUser, project: e.target.value})}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl outline-none text-[18px] font-normal text-black appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_1.25rem_center] bg-no-repeat pr-10"
              >
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <button 
                onClick={handleAddUser}
                disabled={loading}
                className="w-full py-4 bg-[#2563eb] text-white font-normal uppercase tracking-widest text-[17px] rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[18px]">
              <thead>
                <tr className="text-left bg-white border-b border-slate-50">
                  <th className="px-10 py-6 font-bold text-black uppercase tracking-widest text-[15px]">User Name</th>
                  <th className="px-10 py-6 font-bold text-black uppercase tracking-widest text-[15px]">Current Role</th>
                  <th className="px-10 py-6 font-bold text-black uppercase tracking-widest text-[15px]">Project</th>
                  <th className="px-10 py-6 font-bold text-black uppercase tracking-widest text-[15px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6 font-normal text-black">{u.name}</td>
                    <td className="px-10 py-6">
                      <select 
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                        disabled={loading}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[17px] font-normal text-black outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px] bg-[right_1rem_center] bg-no-repeat pr-8 disabled:opacity-50"
                      >
                        <option value="AGENT">Agent</option>
                        <option value="QC">QC Checker</option>
                        <option value="MANAGER">Manager/TL</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-10 py-6 font-normal text-black">{u.project || '-'}</td>
                    <td className="px-10 py-6 text-right">
                      <button 
                        onClick={() => setUserToDelete(u)}
                        disabled={loading}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm disabled:opacity-50"
                        title="Remove User"
                      >
                        <i className="bi bi-person-x-fill text-[23px]"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {userToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
              <i className="bi bi-person-x-fill text-[41px]"></i>
            </div>
            <h3 className="text-[25px] font-normal text-black mb-2">Confirm User Removal</h3>
            <p className="text-[19px] text-black font-bold mb-10 leading-relaxed">
              Are you sure you want to remove <span className="font-normal text-black">{userToDelete.name}</span> from the system? This action will permanently revoke their access.
            </p>
            
            <div className="flex w-full gap-4">
              <button 
                onClick={() => setUserToDelete(null)}
                disabled={loading}
                className="flex-1 py-4 bg-slate-100 text-black font-normal uppercase tracking-widest text-[17px] hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                No, Keep
              </button>
              <button 
                onClick={confirmDelete}
                disabled={loading}
                className="flex-1 py-4 bg-rose-500 text-white rounded-xl font-normal uppercase tracking-widest text-[17px] hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;