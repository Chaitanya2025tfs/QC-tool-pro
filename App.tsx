
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QCForm from './components/QCForm';
import ReportTable from './components/ReportTable';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import { User, QCRecord } from './types';
import { storage } from './services/storage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<QCRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<QCRecord | undefined>();

  useEffect(() => {
    // Initial data load
    setRecords(storage.getRecords());
  }, []);

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  const saveRecord = (record: QCRecord) => {
    storage.saveRecord(record);
    setRecords(storage.getRecords());
    setActiveTab('report-table');
    setEditingRecord(undefined);
  };

  const deleteRecord = (id: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      storage.deleteRecord(id);
      setRecords(storage.getRecords());
    }
  };

  const startEdit = (record: QCRecord) => {
    setEditingRecord(record);
    setActiveTab('qc-form');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 ml-64 min-h-screen transition-all">
        {activeTab === 'dashboard' && <Dashboard user={user} records={records} />}
        {activeTab === 'qc-form' && (
          <QCForm 
            user={user} 
            onSave={saveRecord} 
            editRecord={editingRecord}
            onDiscard={() => {
              setEditingRecord(undefined);
              setActiveTab('report-table');
            }}
          />
        )}
        {activeTab === 'report-table' && (
          <ReportTable 
            user={user} 
            records={records} 
            onEdit={startEdit} 
            onDelete={deleteRecord} 
          />
        )}
        {activeTab === 'admin-panel' && user.role === 'ADMIN' && <AdminPanel />}
      </main>
    </div>
  );
};

export default App;
