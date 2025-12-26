
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
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Check connectivity
      const isConnected = await storage.checkBackend();
      setIsBackendConnected(isConnected);

      // Load records
      const fetchedRecords = await storage.getRecords();
      setRecords(fetchedRecords);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll for connectivity status every 30 seconds
    const interval = setInterval(async () => {
      const isConnected = await storage.checkBackend();
      setIsBackendConnected(isConnected);
    }, 30000);
    return () => clearInterval(interval);
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
    try {
      await storage.saveRecord(record);
      await loadData();
      setEditingRecord(undefined);
      setShowSuccessReport(record);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    setLoading(true);
    try {
      await storage.deleteRecord(id);
      await loadData();
    } finally {
      setLoading(false);
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
    <div className="flex bg-[#f3f4f6] min-h-screen">
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        isBackendConnected={isBackendConnected}
      />
      
      <main className="ml-[15%] w-[85%] min-h-screen transition-all relative py-4 px-6 overflow-x-hidden">
        {loading && (
          <div className="fixed inset-0 z-[150] bg-white/40 backdrop-blur-md flex items-center justify-center">
            <div className="bg-white/90 p-8 rounded-[4px] shadow-2xl border border-slate-300 flex flex-col items-center gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-[4px] border-indigo-100 rounded-full"></div>
                <div className="absolute inset-0 border-[4px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[17px] font-black text-black uppercase tracking-widest">Processing</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="w-full transition-all duration-300">
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
        </div>

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
