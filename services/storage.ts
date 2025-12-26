
import { QCRecord, User } from '../types';

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

export const storage = {
  // Check if backend is available
  async checkBackend(): Promise<boolean> {
    try {
      const resp = await fetch(`${API_BASE_URL}/health`, { 
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(1500) 
      });
      return resp.ok;
    } catch {
      return false;
    }
  },

  // --- RECORDS ---
  
  getRecords: async (): Promise<QCRecord[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/records`);
      if (response.ok) return await response.json();
    } catch (e) {
      console.warn('Backend not reached, using localStorage fallback');
    }
    const data = localStorage.getItem('qc_eval_records');
    return data ? JSON.parse(data) : [];
  },
  
  saveRecord: async (record: QCRecord): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (response.ok) return;
    } catch (e) {
      console.warn('Backend not reached, saving to localStorage fallback');
    }
    
    // LocalStorage Fallback Logic
    const records = await storage.getRecords();
    const index = records.findIndex(r => r.id === record.id);
    if (index > -1) {
      records[index] = record;
    } else {
      records.push(record);
    }
    localStorage.setItem('qc_eval_records', JSON.stringify(records));
  },

  deleteRecord: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/records/${id}`, { method: 'DELETE' });
      if (response.ok) return;
    } catch (e) {
      console.warn('Backend not reached, deleting from localStorage');
    }
    const records = await storage.getRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem('qc_eval_records', JSON.stringify(filtered));
  },

  // --- USERS ---

  getUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (response.ok) return await response.json();
    } catch (e) {
      console.warn('Backend not reached, using localStorage fallback');
    }
    const data = localStorage.getItem('qc_eval_users');
    if (!data) {
      const initialUsers: User[] = [
        { id: 'tl1', name: 'Mohsin', role: 'MANAGER', email: 'mohsin@gmail.com', password: '123456', phoneNumber: '9876543210' },
        { id: 'tl2', name: 'Venkateshwaran', role: 'MANAGER', email: 'venkateshwaran@gmail.com', password: '123456', phoneNumber: '9876543211' },
        { id: 'qc1', name: 'Jimil', role: 'QC', email: 'jimil@gmail.com', password: '123456', phoneNumber: '9876543212' },
        { id: 'qc2', name: 'Apurva', role: 'QC', email: 'apurva@gmail.com', password: '123456', phoneNumber: '9876543213' },
        { id: 'ag1', name: 'Jash', role: 'AGENT', project: 'Moveeasy', email: 'jashtfs14@gmail.com', password: '123456', phoneNumber: '9876543214' },
        { id: 'ag2', name: 'Chaitanya', role: 'AGENT', project: 'Mfund', email: 'chaitanya.bh.2025@gmail.com', password: '123456', phoneNumber: '9876543215' },
        { id: 'ag3', name: 'Priyanshu', role: 'AGENT', project: 'Altrum', email: 'priyanshu@gmail.com', password: '123456', phoneNumber: '9876543216' },
        { id: 'ag4', name: 'Vivek', role: 'AGENT', project: 'Moveeasy', email: 'vivekattransform@gmail.com', password: '123456', phoneNumber: '9876543217' },
        { id: 'ag5', name: 'Manas', role: 'AGENT', project: 'Mfund', email: 'manas.pradhan8855@gmail.com', password: '123456', phoneNumber: '9876543218' },
        { id: 'admin1', name: 'Admin User', role: 'ADMIN', email: 'admin@gmail.com', password: '123456', phoneNumber: '9999999999' },
      ];
      localStorage.setItem('qc_eval_users', JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(data);
  },

  saveUser: async (user: User): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      if (response.ok) return;
    } catch (e) {
      console.warn('Backend not reached, saving to localStorage');
    }
    const users = await storage.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index > -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem('qc_eval_users', JSON.stringify(users));
  },

  deleteUser: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
      if (response.ok) return;
    } catch (e) {
      console.warn('Backend not reached, deleting from localStorage');
    }
    const users = await storage.getUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem('qc_eval_users', JSON.stringify(filtered));
  }
};
