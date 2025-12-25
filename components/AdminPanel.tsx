
import React, { useState } from 'react';
import { User, Role } from '../types';
import { PROJECTS } from '../constants';
import { storage } from '../services/storage';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>(storage.getUsers());
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    role: 'AGENT',
    project: PROJECTS[0]
  });

  const handleAddUser = () => {
    if (!newUser.name) return;
    const user = {
      ...newUser,
      id: Math.random().toString(36).substr(2, 9),
    } as User;
    storage.saveUser(user);
    setUsers(storage.getUsers());
    setNewUser({ name: '', role: 'AGENT', project: PROJECTS[0] });
  };

  const handleRoleChange = (id: string, newRole: Role) => {
    const user = users.find(u => u.id === id);
    if (user) {
      storage.saveUser({ ...user, role: newRole });
      setUsers(storage.getUsers());
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Delete this user?")) {
      storage.deleteUser(id);
      setUsers(storage.getUsers());
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">User Management</h2>
        
        {/* Add User Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6 bg-slate-50 rounded-xl">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
            <input 
              type="text" 
              value={newUser.name}
              onChange={e => setNewUser({...newUser, name: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none"
              placeholder="Full Name"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
            <select 
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none"
            >
              <option value="AGENT">Agent</option>
              <option value="QC">QC Checker</option>
              <option value="MANAGER">Manager/TL</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project</label>
            <select 
              value={newUser.project}
              onChange={e => setNewUser({...newUser, project: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none"
            >
              {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleAddUser}
              className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all"
            >
              Add User
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="pb-4 text-xs font-black text-slate-400 uppercase">User Name</th>
                <th className="pb-4 text-xs font-black text-slate-400 uppercase">Current Role</th>
                <th className="pb-4 text-xs font-black text-slate-400 uppercase">Project</th>
                <th className="pb-4 text-xs font-black text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-4 font-medium text-slate-700">{u.name}</td>
                  <td className="py-4">
                    <select 
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-sm outline-none"
                    >
                      <option value="AGENT">Agent</option>
                      <option value="QC">QC Checker</option>
                      <option value="MANAGER">Manager/TL</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="py-4 text-sm text-slate-500">{u.project || '-'}</td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <i className="bi bi-person-x text-lg"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
