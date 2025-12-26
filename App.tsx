
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QCForm from './components/QCForm';
import ReportTable from './components/ReportTable';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import SuccessReport from './components/SuccessReport';
import { User, QCRecord } from './types';
import { storage } from './services/storage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<QCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<QCRecord | undefined>();
  const [showSuccessReport, setShowSuccessReport] = useState<QCRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    const fetchedRecords = await storage.getRecords();
    setRecords(fetchedRecords);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  const saveRecord = async (record: QCRecord) => {
    setLoading(true);
    await storage.saveRecord(record);
    await loadData();
    setEditingRecord(undefined);
    // Show the success report confirmation immediately after saving
    setShowSuccessReport(record);
  };

  const deleteRecord = async (id: string) => {
    setLoading(true);
    await storage.deleteRecord(id);
    await loadData();
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
      
      <main className="flex-1 ml-64 min-h-screen transition-all relative">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-normal text-indigo-500 uppercase tracking-widest">Syncing with DB...</span>
            </div>
          </div>
        )}
        
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

        {showSuccessReport && (
          <SuccessReport 
            record={showSuccessReport} 
            onClose={() => {
              setShowSuccessReport(null);
              setActiveTab('report-table');
            }} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
