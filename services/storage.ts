
import { QCRecord, User } from '../types';

const RECORDS_KEY = 'qc_eval_records';
const USERS_KEY = 'qc_eval_users';

export const storage = {
  getRecords: (): QCRecord[] => {
    const data = localStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveRecord: (record: QCRecord) => {
    const records = storage.getRecords();
    const index = records.findIndex(r => r.id === record.id);
    if (index > -1) {
      records[index] = record;
    } else {
      records.push(record);
    }
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  },

  deleteRecord: (id: string) => {
    const records = storage.getRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(filtered));
  },

  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      const initialUsers: User[] = [
        { id: 'tl1', name: 'Mohsin', role: 'MANAGER' },
        { id: 'tl2', name: 'Venkateshwaran', role: 'MANAGER' },
        { id: 'qc1', name: 'Jimil', role: 'QC' },
        { id: 'qc2', name: 'Apurva', role: 'QC' },
        { id: 'ag1', name: 'Jash', role: 'AGENT', project: 'Moveeasy' },
        { id: 'ag2', name: 'Chaitanya', role: 'AGENT', project: 'Mfund' },
        { id: 'ag3', name: 'Priyanshu', role: 'AGENT', project: 'Altrum' },
        { id: 'ag4', name: 'Vivek', role: 'AGENT', project: 'Moveeasy' },
        { id: 'ag5', name: 'Manas', role: 'AGENT', project: 'Mfund' },
        { id: 'admin1', name: 'Admin User', role: 'ADMIN' },
      ];
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(data);
  },

  saveUser: (user: User) => {
    const users = storage.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index > -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  deleteUser: (id: string) => {
    const users = storage.getUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
  }
};
