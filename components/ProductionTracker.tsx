
import React, { useState, useEffect, useMemo } from 'react';
import { User, ProductionLog, DailyProductionSummary, ProjectTarget, QCRecord } from '../types';
import { storage } from '../services/storage';

interface ProductionTrackerProps {
  user: User;
  records: QCRecord[];
}

const ProductionTracker: React.FC<ProductionTrackerProps> = ({ user, records }) => {
  // Permission Logic: Only Admin and Manager can modify structural targets or add projects
  const canManageProjects = user.role === 'ADMIN' || user.role === 'MANAGER';
  // Permission Logic: Switching agent view is for anyone above AGENT level
  const isElevated = user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'QC';
  
  const today = new Date().toISOString().split('T')[0];
  
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<ProjectTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBreakdownDate, setSelectedBreakdownDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewedAgentName, setViewedAgentName] = useState<string>(user.name);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Display and Export States
  const [showAllEntries, setShowAllEntries] = useState(false);
  
  // Initialize range to last 30 days for better visibility
  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  const [filterStartDate, setFilterStartDate] = useState(defaultStartDate);
  const [filterEndDate, setFilterEndDate] = useState(today);

  // Modals
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [logToDelete, setLogToDelete] = useState<ProductionLog | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTarget, setNewProjectTarget] = useState(0);
  
  // Track temporary edits for project targets in the modal
  const [editingProjectTargets, setEditingProjectTargets] = useState<Record<string, number>>({});
  
  // Track temporary edits for log targets in the breakdown table
  const [editingLogTargets, setEditingLogTargets] = useState<Record<string, number>>({});

  // Form State - initialized with undefined for number fields to support placeholders and '0' entry
  const [formData, setFormData] = useState<Partial<ProductionLog>>({
    date: today,
    projectName: '',
    target: undefined,
    actual: undefined
  });

  const fetchData = async () => {
    setLoading(true);
    const [allLogs, users, fetchedProjects] = await Promise.all([
      storage.getProductionLogs(),
      storage.getUsers(),
      storage.getProjects()
    ]);
    
    // Include both AGENT and QC roles for managers to track
    setAllUsers(users.filter(u => u.role === 'AGENT' || u.role === 'QC'));
    setProjects(fetchedProjects);
    
    // Filter logs by the viewed agent
    const filteredLogs = allLogs.filter(l => l.agentName === viewedAgentName);
    setLogs(filteredLogs);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [viewedAgentName]);

  const handleProjectChange = (name: string) => {
    const project = projects.find(p => p.name === name);
    setFormData({
      ...formData,
      projectName: name,
      target: project ? project.defaultTarget : undefined
    });
    setValidationError(null);
  };

  const handleEditClick = (log: ProductionLog) => {
    setEditingLogId(log.id);
    setFormData({
      date: log.date,
      projectName: log.projectName,
      target: log.target,
      actual: log.actual
    });
    setValidationError(null);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingLogId(null);
    setValidationError(null);
    setFormData({
      date: today,
      projectName: '',
      target: undefined,
      actual: undefined
    });
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    // Allow 0 as a valid entry
    if (!formData.projectName || formData.actual === undefined || formData.target === undefined) {
      setValidationError("Please complete all fields.");
      return;
    }
    
    // Validation: Production Count cannot be more than 2x the target (only if target > 0)
    if (formData.target > 0 && formData.actual > (formData.target * 2)) {
      setValidationError(`Count cannot exceed 2x the target (${formData.target * 2})`);
      return;
    }

    setValidationError(null);
    setIsSaving(true);
    const newLog: ProductionLog = {
      id: editingLogId || Math.random().toString(36).substr(2, 9),
      agentName: viewedAgentName,
      date: formData.date || today,
      projectName: formData.projectName,
      target: Number(formData.target),
      actual: Number(formData.actual),
      loggedAt: new Date().toISOString(),
      createdAt: Date.now()
    };

    await storage.saveProductionLog(newLog);
    await fetchData();
    resetForm();
    setIsSaving(false);
  };

  const handleAddProject = async () => {
    if (!canManageProjects || !newProjectName || newProjectTarget < 0) return;
    const project: ProjectTarget = {
      id: Math.random().toString(36).substr(2, 5),
      name: newProjectName,
      defaultTarget: newProjectTarget
    };
    await storage.saveProject(project);
    setShowAddProjectModal(false);
    setNewProjectName('');
    setNewProjectTarget(0);
    await fetchData();
  };

  const handleUpdateProjectTarget = async (project: ProjectTarget, newTarget: number) => {
    if (!canManageProjects || newTarget < 0) return;
    await storage.saveProject({ ...project, defaultTarget: newTarget });
    
    // Clear the local edit state for this project
    const nextEditing = { ...editingProjectTargets };
    delete nextEditing[project.id];
    setEditingProjectTargets(nextEditing);
    
    await fetchData();
  };

  const handleUpdateLogTarget = async (log: ProductionLog, newTarget: number) => {
    if (!canManageProjects || newTarget < 0) return;
    const updatedLog = { ...log, target: newTarget };
    await storage.saveProductionLog(updatedLog);
    
    // Clear local edit state for this log
    const nextEditing = { ...editingLogTargets };
    delete nextEditing[log.id];
    setEditingLogTargets(nextEditing);
    
    await fetchData();
  };

  const handleDeleteLog = async () => {
    if (!logToDelete) return;
    await storage.deleteProductionLog(logToDelete.id);
    await fetchData();
    setLogToDelete(null);
  };

  const summaries = useMemo(() => {
    const map = new Map<string, any>();
    
    // Apply date range filter to the raw logs before summarizing
    const filteredLogsByRange = logs.filter(l => l.date >= filterStartDate && l.date <= filterEndDate);

    filteredLogsByRange.forEach(l => {
      const existing = map.get(l.date) || {
        date: l.date,
        logsCount: 0,
        totalTarget: 0,
        totalActual: 0,
        billableHours: 0,
        accuracy: 0,
        avgQcScore: '-',
        avgReworkScore: '-'
      };
      existing.logsCount++;
      existing.totalTarget += l.target;
      existing.totalActual += l.actual;
      existing.billableHours += (l.target > 0 ? l.actual / l.target : 0);
      map.set(l.date, existing);
    });

    const result = Array.from(map.values()).map(s => {
      // Find matching QC records for this agent and date to get scores
      const dayRecords = records.filter(r => r.date === s.date && r.agentName === viewedAgentName);
      
      const regularScores = dayRecords.filter(r => !r.isRework && !r.noWork).map(r => r.score);
      const reworkScores = dayRecords.filter(r => r.isRework).map(r => r.reworkScore || r.score);

      const avgReg = regularScores.length > 0 
        ? (regularScores.reduce((a, b) => a + b, 0) / regularScores.length).toFixed(1) + '%'
        : '-';
      
      const avgRew = reworkScores.length > 0 
        ? (reworkScores.reduce((a, b) => a + b, 0) / reworkScores.length).toFixed(1) + '%'
        : '-';

      return {
        ...s,
        accuracy: s.totalTarget > 0 ? Math.round((s.totalActual / s.totalTarget) * 100) : 0,
        avgQcScore: avgReg,
        avgReworkScore: avgRew
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    return result;
  }, [logs, records, viewedAgentName, filterStartDate, filterEndDate]);

  const displayedSummaries = useMemo(() => {
    return showAllEntries ? summaries : summaries.slice(0, 3);
  }, [summaries, showAllEntries]);

  const breakdownLogs = useMemo(() => {
    if (!selectedBreakdownDate) return [];
    return logs.filter(l => l.date === selectedBreakdownDate).sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  }, [selectedBreakdownDate, logs]);

  const selectedSummary = useMemo(() => {
    return summaries.find(s => s.date === selectedBreakdownDate);
  }, [selectedBreakdownDate, summaries]);

  const handleExportDailyProduction = () => {
    if (summaries.length === 0) {
      alert("No data found for the current filter range.");
      return;
    }

    const escape = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ['Date Record', 'Entry Logs', 'Avg QC Score', 'Avg Rework Score', 'Billable Hours', 'Total Billable required'];
    const csvContent = [
      headers.join(','),
      ...summaries.map(s => [
        s.date,
        s.logsCount,
        s.avgQcScore,
        s.avgReworkScore,
        s.billableHours.toFixed(2),
        (9 - s.billableHours).toFixed(2)
      ].map(escape).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daily_Production_${viewedAgentName}_${filterStartDate}_to_${filterEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 font-sans animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-white px-10 py-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-[24px] shadow-lg shadow-indigo-200">
             <i className="bi bi-rocket-takeoff-fill"></i>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[24px] font-[900] text-[#1E2A56] tracking-tight">Production Tracker</h1>
            <p className="text-[14px] text-slate-400 font-medium">Viewing performance for <span className="font-bold text-indigo-600">{viewedAgentName}</span></p>
          </div>
        </div>

        {isElevated && (
          <div className="flex flex-col md:flex-row items-end gap-4 w-full md:w-auto">
             <div className="flex flex-col gap-1.5 min-w-[240px] w-full md:w-auto">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Agent / QC Selector</span>
                <div className="relative group">
                    <select 
                      value={viewedAgentName} 
                      onChange={(e) => setViewedAgentName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-3.5 rounded-2xl text-[14px] font-bold text-[#1E2A56] outline-none appearance-none cursor-pointer group-hover:border-indigo-200 transition-all"
                    >
                      <option value={user.name}>{user.name} ({user.role})</option>
                      {allUsers.filter(u => u.name !== user.name).map(u => (
                        <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                      <div className="w-[1px] h-4 bg-slate-200"></div>
                      <i className="bi bi-person-badge text-indigo-400"></i>
                    </div>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section: Form */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex items-center gap-2">
             <i className={`bi ${editingLogId ? 'bi-pencil-fill text-amber-500' : 'bi-pencil-square text-indigo-500'}`}></i>
             <h2 className="text-[16px] font-black text-[#1E2A56] uppercase tracking-tight">
               {editingLogId ? 'Update Log Entry' : 'Add New Log'}
             </h2>
           </div>

           <form onSubmit={handleSaveLog} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Work Date</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Project Name</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select 
                      value={formData.projectName}
                      onChange={e => handleProjectChange(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold outline-none cursor-pointer appearance-none"
                    >
                      <option value="">Select project</option>
                      {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <i className="bi bi-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                  </div>
                  {!editingLogId && canManageProjects && (
                    <button 
                      type="button"
                      onClick={() => setShowAddProjectModal(true)}
                      className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                    >
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Daily Target</label>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center group focus-within:border-indigo-200">
                       <input 
                        type="number" 
                        readOnly={!canManageProjects}
                        value={formData.target ?? ''}
                        onChange={e => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          setFormData({...formData, target: val});
                          setValidationError(null);
                        }}
                        placeholder="0"
                        className={`w-full bg-transparent text-center text-[22px] font-black outline-none ${canManageProjects ? 'text-indigo-600' : 'text-slate-400'}`}
                       />
                       <span className="text-[8px] font-black text-slate-300 uppercase block">{canManageProjects ? 'Edit Daily Log Target' : 'Target Locked'}</span>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Production Count</label>
                    <div className={`bg-indigo-50/20 border-2 rounded-2xl p-4 text-center transition-all ${validationError ? 'border-rose-500 bg-rose-50/30' : 'border-indigo-100'}`}>
                       <input 
                        type="number" 
                        placeholder="0"
                        value={formData.actual ?? ''}
                        onChange={e => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          setFormData({...formData, actual: val});
                          setValidationError(null);
                        }}
                        className={`w-full bg-transparent text-center text-[22px] font-black outline-none placeholder:text-indigo-200 ${validationError ? 'text-rose-600' : 'text-indigo-600'}`}
                       />
                       <span className={`text-[8px] font-black uppercase block ${validationError ? 'text-rose-500' : 'text-indigo-300'}`}>
                         {validationError || 'Accepts Production'}
                       </span>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  type="submit" 
                  disabled={isSaving || !formData.projectName}
                  className={`w-full py-5 text-white rounded-full font-black uppercase tracking-widest text-[13px] flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${!formData.projectName ? 'bg-slate-300 cursor-not-allowed' : editingLogId ? 'bg-amber-500 hover:bg-black' : 'bg-[#4f46e5] hover:bg-black'}`}
                >
                  <i className={`bi ${isSaving ? 'bi-arrow-repeat animate-spin' : editingLogId ? 'bi-check-circle-fill' : 'bi-plus-circle-fill'}`}></i>
                  {isSaving ? 'Saving...' : editingLogId ? 'Update Log Entry' : 'Save Log Entry'}
                </button>
                
                {editingLogId && (
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="w-full py-3 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:text-rose-500 transition-all"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
           </form>
        </div>

        {/* Right Section: Aggregates and Breakdown */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* Daily Production Table */}
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-6">
                 <div className="flex flex-col gap-1">
                    <h3 className="text-[11px] font-black text-[#1E2A56] uppercase tracking-widest">DAILY PRODUCTION HISTORY</h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Applied Filter: {filterStartDate} to {filterEndDate}</span>
                 </div>
                 
                 <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm group">
                       <span className="text-[9px] font-black text-slate-300 uppercase">From</span>
                       <input 
                        type="date" 
                        value={filterStartDate}
                        onChange={e => setFilterStartDate(e.target.value)}
                        className="bg-transparent text-[11px] font-bold outline-none text-[#1E2A56] cursor-pointer"
                       />
                       <div className="w-[1px] h-4 bg-slate-100 mx-1"></div>
                       <span className="text-[9px] font-black text-slate-300 uppercase">To</span>
                       <input 
                        type="date" 
                        value={filterEndDate}
                        onChange={e => setFilterEndDate(e.target.value)}
                        className="bg-transparent text-[11px] font-bold outline-none text-[#1E2A56] cursor-pointer"
                       />
                    </div>
                    <button 
                      onClick={handleExportDailyProduction}
                      className="bg-[#1E2A56] text-white px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                      <i className="bi bi-file-earmark-excel"></i>
                      Export range
                    </button>
                 </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">
                      <th className="px-8 py-5">Date Record</th>
                      <th className="px-4 py-5">Entry Logs</th>
                      <th className="px-4 py-5 text-emerald-600">Avg QC Score</th>
                      <th className="px-4 py-5 text-rose-600">Avg Rework Score</th>
                      <th className="px-8 py-5">Billable Hours</th>
                      <th className="px-8 py-5">Total Billable required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedSummaries.map(s => (
                      <tr 
                        key={s.date} 
                        onClick={() => setSelectedBreakdownDate(s.date)}
                        className={`cursor-pointer group transition-all ${selectedBreakdownDate === s.date ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-indigo-50 border-b border-slate-50'}`}
                      >
                        <td className="px-8 py-5 text-[14px] font-bold">{s.date}</td>
                        <td className="px-4 py-5">
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedBreakdownDate === s.date ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100'}`}>
                            {s.logsCount} Entries
                          </span>
                        </td>
                        <td className={`px-4 py-5 text-[14px] font-black ${selectedBreakdownDate === s.date ? 'text-white' : 'text-emerald-500'}`}>
                          {s.avgQcScore}
                        </td>
                        <td className={`px-4 py-5 text-[14px] font-black ${selectedBreakdownDate === s.date ? 'text-white' : 'text-rose-500'}`}>
                          {s.avgReworkScore}
                        </td>
                        <td className={`px-8 py-5 text-[14px] font-black ${selectedBreakdownDate === s.date ? 'text-white' : 'text-[#1E2A56]'}`}>
                          {s.billableHours.toFixed(2)}
                        </td>
                        <td className={`px-8 py-5 text-[16px] font-black ${selectedBreakdownDate === s.date ? 'text-white' : 'text-indigo-600'}`}>
                          {(9 - s.billableHours).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {summaries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-24 text-[11px] font-bold text-slate-300 uppercase tracking-widest opacity-40 italic">
                           <div className="flex flex-col items-center gap-3">
                              <i className="bi bi-calendar-x text-[40px]"></i>
                              No production records found for the selected range.
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {summaries.length > 3 && (
                <div className="px-8 py-4 border-t border-slate-50 flex justify-center bg-slate-50/30">
                   <button 
                    onClick={() => setShowAllEntries(!showAllEntries)}
                    className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:text-black transition-colors"
                   >
                     {showAllEntries ? 'Show Less History' : `See Full History (${summaries.length - 3} more days)`}
                     <i className={`bi bi-chevron-${showAllEntries ? 'up' : 'down'}`}></i>
                   </button>
                </div>
              )}
           </div>

           {/* Log Breakdown Section */}
           {selectedBreakdownDate && (
             <div className="bg-indigo-600 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
                <div className="px-8 py-6 flex items-center justify-between">
                   <div className="flex items-center gap-3 text-white">
                      <i className="bi bi-clock-history text-[20px]"></i>
                      <h3 className="text-[13px] font-black uppercase tracking-widest">Log Breakdown: {selectedBreakdownDate}</h3>
                   </div>
                   <button 
                    onClick={() => setSelectedBreakdownDate(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white transition-all hover:bg-white/20"
                   >
                     <i className="bi bi-x-lg text-[18px]"></i>
                   </button>
                </div>

                <div className="bg-white/5 px-8 py-5 flex items-center justify-between border-y border-white/5">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Daily Aggregates</span>
                      <span className="text-[9px] font-bold text-white/40 italic">Tracking {breakdownLogs.length} unique logs</span>
                   </div>
                   <div className="flex gap-10">
                      <div className="text-center">
                         <span className="text-[9px] font-black text-white/40 uppercase block mb-1">Total Target</span>
                         <span className="text-[22px] font-black text-white">{selectedSummary?.totalTarget}</span>
                      </div>
                      <div className="text-center">
                         <span className="text-[9px] font-black text-white/40 uppercase block mb-1">Total Production Count</span>
                         <span className="text-[22px] font-black text-emerald-400">{selectedSummary?.totalActual}</span>
                      </div>
                      <div className="text-center">
                         <span className="text-[9px] font-black text-white/40 uppercase block mb-1">Billable Hours</span>
                         <span className="text-[22px] font-black text-white">{selectedSummary?.billableHours.toFixed(2)}</span>
                      </div>
                   </div>
                </div>

                <div className="bg-white m-4 rounded-[2rem] overflow-hidden shadow-inner">
                   <table className="w-full text-center">
                      <thead>
                        <tr className="text-[9px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">
                           <th className="px-6 py-4">Entry Time</th>
                           <th className="px-6 py-4 text-left">Project Name</th>
                           <th className="px-6 py-4">Current Target</th>
                           {canManageProjects && <th className="px-6 py-4">Update Target</th>}
                           <th className="px-6 py-4">Production Count</th>
                           <th className="px-6 py-4">Hours</th>
                           <th className="px-6 py-4">Manage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdownLogs.map(l => {
                          const isToday = l.date === today;
                          const hasAccess = isToday || isElevated;
                          return (
                            <tr key={l.id} className={`hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group ${editingLogId === l.id ? 'bg-amber-50/50' : ''}`}>
                               <td className="px-6 py-5 text-[11px] font-black text-slate-400 italic">
                                 {new Date(l.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </td>
                               <td className="px-6 py-5 text-left">
                                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black text-[#1E2A56] uppercase tracking-tighter">
                                     {l.projectName}
                                  </span>
                               </td>
                               <td className="px-6 py-5 text-[14px] font-bold text-slate-400">{l.target}</td>
                               {canManageProjects && (
                                 <td className="px-6 py-5">
                                    <div className="flex items-center justify-center gap-2">
                                      <input 
                                        type="number"
                                        value={editingLogTargets[l.id] ?? l.target}
                                        onChange={(e) => setEditingLogTargets({ ...editingLogTargets, [l.id]: Number(e.target.value) })}
                                        className="w-16 bg-slate-50 border border-slate-100 rounded-xl py-2 text-center text-[13px] font-black text-indigo-600 outline-none focus:bg-white focus:border-indigo-300 transition-all"
                                      />
                                      <button 
                                        onClick={() => handleUpdateLogTarget(l, editingLogTargets[l.id] ?? l.target)}
                                        disabled={editingLogTargets[l.id] === undefined || editingLogTargets[l.id] === l.target}
                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-black transition-all disabled:opacity-0 disabled:pointer-events-none active:scale-90"
                                      >
                                        UPDATE
                                      </button>
                                    </div>
                                 </td>
                               )}
                               <td className="px-6 py-5 text-[15px] font-black text-[#1E2A56]">{l.actual}</td>
                               <td className="px-6 py-5 text-[15px] font-black text-indigo-600">{(l.actual / l.target).toFixed(2)}</td>
                               <td className="px-6 py-5">
                                  <div className="flex items-center justify-center gap-2">
                                     {hasAccess ? (
                                       <>
                                         <button 
                                           onClick={() => handleEditClick(l)}
                                           className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-400 hover:text-indigo-600 rounded-lg transition-colors"
                                           title="Edit Log"
                                         >
                                           <i className="bi bi-pencil-square text-[14px]"></i>
                                         </button>
                                         <button 
                                          onClick={() => setLogToDelete(l)}
                                          className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-colors"
                                          title="Delete Log"
                                         >
                                           <i className="bi bi-trash3-fill text-[14px]"></i>
                                         </button>
                                       </>
                                     ) : (
                                       <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 opacity-60">
                                         <i className="bi bi-lock-fill text-slate-300 text-[10px]"></i>
                                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Locked</span>
                                       </div>
                                     )}
                                  </div>
                               </td>
                            </tr>
                          );
                        })}
                      </tbody>
                   </table>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Project Management Modal */}
      {showAddProjectModal && canManageProjects && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1E2A56]/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-[500px] rounded-[3rem] shadow-2xl overflow-hidden p-10 space-y-8 animate-in zoom-in-95 duration-200 relative">
              {/* Top-Right Close Button */}
              <button 
                onClick={() => setShowAddProjectModal(false)}
                className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-400 transition-all active:scale-90"
              >
                <i className="bi bi-x-lg text-[20px]"></i>
              </button>

              <div className="text-center space-y-3">
                 <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-[32px] mb-4">
                    <i className="bi bi-gear-fill"></i>
                 </div>
                 <h3 className="text-[20px] font-black text-[#1E2A56] uppercase tracking-tight">Manage Projects</h3>
                 <p className="text-[13px] text-slate-400 font-medium">Add new or update default targets of existing projects.</p>
              </div>

              {/* Add New Section */}
              <div className="bg-[#f8fafc] p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <span className="text-[10px] font-black text-[#6366f1] uppercase tracking-widest block mb-1 px-1">REGISTER NEW CAMPAIGN</span>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="Enter Project Name..."
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[14px] font-bold text-black outline-none focus:border-indigo-300 transition-all shadow-sm"
                  />
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      value={newProjectTarget === 0 ? '' : newProjectTarget}
                      placeholder="00"
                      onChange={e => setNewProjectTarget(Number(e.target.value))}
                      className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[14px] font-bold text-black outline-none placeholder:text-slate-300 shadow-sm"
                    />
                    <button 
                      onClick={handleAddProject}
                      disabled={!newProjectName || newProjectTarget < 0}
                      className="px-8 py-4 bg-[#4f46e5] text-white rounded-[1.25rem] border-2 border-black font-black uppercase tracking-widest text-[13px] shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40"
                    >
                      <i className="bi bi-plus text-[20px]"></i>
                      ADD
                    </button>
                  </div>
                </div>
              </div>

              {/* Update Existing Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Project Name</span>
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Update Target</span>
                </div>
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                   {projects.map(p => (
                     <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-100 transition-all group">
                        <div className="flex flex-col">
                           <span className="text-[12px] font-black text-[#1E2A56] uppercase tracking-tighter">{p.name}</span>
                           <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Current Default: {p.defaultTarget}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <input 
                             type="number" 
                             value={editingProjectTargets[p.id] ?? p.defaultTarget}
                             onChange={(e) => setEditingProjectTargets({ ...editingProjectTargets, [p.id]: Number(e.target.value) })}
                             className="w-16 bg-slate-50 border border-slate-100 rounded-xl py-2 text-center text-[13px] font-black text-indigo-600 outline-none focus:bg-white focus:border-indigo-300 transition-all group-hover:bg-indigo-50/50"
                           />
                           <button 
                            onClick={() => handleUpdateProjectTarget(p, editingProjectTargets[p.id] ?? p.defaultTarget)}
                            disabled={editingProjectTargets[p.id] === undefined || editingProjectTargets[p.id] === p.defaultTarget}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-black transition-all disabled:opacity-0 disabled:pointer-events-none active:scale-90"
                           >
                             UPDATE
                           </button>
                           {editingProjectTargets[p.id] === undefined && (
                            <div className="w-8 h-8 flex items-center justify-center text-slate-200 group-hover:text-indigo-200 transition-colors">
                                <i className="bi bi-arrow-left-right scale-75"></i>
                            </div>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="flex justify-center pt-2">
                 <button 
                  onClick={() => setShowAddProjectModal(false)}
                  className="w-full py-4 bg-[#1E2A56] text-white rounded-2xl font-black uppercase tracking-widest text-[12px] hover:bg-black transition-all active:scale-95 shadow-xl"
                 >
                   Done & Close
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {logToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#1E2A56]/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[340px] rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-10 relative text-center space-y-8">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-[28px] shadow-sm border border-rose-100">
              <i className="bi bi-trash3-fill"></i>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-[20px] font-black text-[#1E2A56] uppercase tracking-tight leading-tight">Delete Record?</h3>
              <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                Are you sure you want to permanently remove this entry for <span className="font-bold text-black">{logToDelete.projectName}</span>?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteLog}
                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-xl hover:bg-rose-600 transition-all active:scale-[0.98]"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setLogToDelete(null)}
                className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[12px] hover:bg-slate-100 transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionTracker;
