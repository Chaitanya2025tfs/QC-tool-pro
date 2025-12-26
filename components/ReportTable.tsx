
import React, { useState, useMemo } from 'react';
import { QCRecord, User } from '../types';
import { PROJECTS, AGENTS } from '../constants';

interface ReportTableProps {
  user: User;
  records: QCRecord[];
  onEdit: (record: QCRecord) => void;
  onDelete: (id: string) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({ user, records, onEdit, onDelete }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const toMMDDYYYY = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${m}/${d}/${y}`;
  };

  const [filters, setFilters] = useState({
    agent: 'ALL AGENTS',
    project: 'ALL PROJECTS',
    startDate: today,
    endDate: today,
    search: ''
  });

  const [startInput, setStartInput] = useState(toMMDDYYYY(today));
  const [endInput, setEndInput] = useState(toMMDDYYYY(today));

  const [viewingRecord, setViewingRecord] = useState<QCRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<QCRecord | null>(null);

  const resetFilters = () => {
    setFilters({
      agent: 'ALL AGENTS',
      project: 'ALL PROJECTS',
      startDate: today,
      endDate: today,
      search: ''
    });
    setStartInput(toMMDDYYYY(today));
    setEndInput(toMMDDYYYY(today));
  };

  const handleManualDateInput = (val: string, inputSetter: (v: string) => void, filterKey: 'startDate' | 'endDate') => {
    let cleaned = val.replace(/\D/g, '').slice(0, 8);
    if (cleaned.length >= 5) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    } else if (cleaned.length >= 3) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    inputSetter(cleaned);

    if (cleaned.length === 10) {
      const [m, d, y] = cleaned.split('/');
      const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      if (!isNaN(Date.parse(iso))) {
        setFilters(prev => ({ ...prev, [filterKey]: iso }));
      }
    }
  };

  const handlePickerChange = (val: string, inputSetter: (v: string) => void, filterKey: 'startDate' | 'endDate') => {
    setFilters(prev => ({ ...prev, [filterKey]: val }));
    inputSetter(toMMDDYYYY(val));
  };

  const displayRows = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !filters.search || 
        r.taskName.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.notes.toLowerCase().includes(filters.search.toLowerCase());
      const matchAgent = filters.agent === 'ALL AGENTS' || r.agentName === filters.agent;
      const matchProject = filters.project === 'ALL PROJECTS' || r.projectName === filters.project;
      const matchStart = !filters.startDate || r.date >= filters.startDate;
      const matchEnd = !filters.endDate || r.date <= filters.endDate;
      const matchUserRole = user.role === 'AGENT' ? r.agentName === user.name : true;
      
      return matchSearch && matchAgent && matchProject && matchStart && matchEnd && matchUserRole;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [records, filters, user]);

  return (
    <div className="flex flex-col gap-6 pb-20">
      <h2 className="text-[22px] font-black text-[#1a2138] uppercase tracking-tight">Audit Repository</h2>

      {/* Unified Filter Bar - Centered without Search */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-6 w-full">
          
          {/* Agent Slicer - For non-AGENT roles */}
          {user.role !== 'AGENT' && (
            <div className="relative min-w-[180px] flex-shrink-0">
              <i className="bi bi-person absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-[14px]"></i>
              <select 
                value={filters.agent} 
                onChange={e => setFilters({...filters, agent: e.target.value})}
                className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none"
              >
                <option>ALL AGENTS</option>
                {AGENTS.map(a => <option key={a}>{a}</option>)}
              </select>
              <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none scale-75"></i>
            </div>
          )}

          {/* Project Slicer */}
          <div className="relative min-w-[180px] flex-shrink-0">
            <i className="bi bi-stack absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-[14px]"></i>
            <select 
              value={filters.project} 
              onChange={e => setFilters({...filters, project: e.target.value})}
              className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none"
            >
              <option>ALL PROJECTS</option>
              {PROJECTS.map(p => <option key={p}>{p}</option>)}
            </select>
            <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none scale-75"></i>
          </div>

          <div className="flex items-center gap-6 flex-shrink-0">
            {/* Date Ranges - Compacted */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">FROM:</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl group relative shadow-sm">
                <input 
                  type="text"
                  value={startInput}
                  onChange={(e) => handleManualDateInput(e.target.value, setStartInput, 'startDate')}
                  placeholder="MM/DD/YYYY"
                  className="w-[85px] text-center text-[13px] font-black text-[#1a2138] bg-transparent outline-none tracking-tight"
                />
                <div className="relative w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-100 group-hover:bg-indigo-50 transition-all cursor-pointer">
                   <i className="bi bi-calendar4 text-slate-400 text-[11px]"></i>
                   <input 
                    type="date" 
                    value={filters.startDate}
                    onChange={(e) => handlePickerChange(e.target.value, setStartInput, 'startDate')}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">TO:</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl group relative shadow-sm">
                <input 
                  type="text"
                  value={endInput}
                  onChange={(e) => handleManualDateInput(e.target.value, setEndInput, 'endDate')}
                  placeholder="MM/DD/YYYY"
                  className="w-[85px] text-center text-[13px] font-black text-[#1a2138] bg-transparent outline-none tracking-tight"
                />
                <div className="relative w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-100 group-hover:bg-indigo-50 transition-all cursor-pointer">
                   <i className="bi bi-calendar4 text-slate-400 text-[11px]"></i>
                   <input 
                    type="date" 
                    value={filters.endDate}
                    onChange={(e) => handlePickerChange(e.target.value, setEndInput, 'endDate')}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <button 
            onClick={resetFilters}
            className="flex items-center justify-center w-11 h-11 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex-shrink-0 shadow-sm border border-rose-100"
            title="Reset All Filters"
          >
            <i className="bi bi-arrow-counterclockwise text-[20px]"></i>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="w-[12%] px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Record Date</th>
              <th className="w-[12%] px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit Type</th>
              <th className="w-[18%] px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Project / Task</th>
              <th className="w-[12%] px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Agent</th>
              <th className="w-[30%] px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Findings & Coaching</th>
              <th className="w-[8%] px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
              <th className="w-[8%] px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayRows.map((r) => (
              <tr key={r.id} className="hover:bg-indigo-50/20 transition-all group">
                <td className="px-6 py-5 text-[13px] font-bold text-slate-500">
                  <div className="flex flex-col">
                    <span>{r.date}</span>
                    <span className="text-[10px] text-slate-400 font-black">{r.timeSlot}</span>
                  </div>
                </td>
                <td className="px-4 py-5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase ${r.isRework ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {r.isRework ? 'REWORK QC' : 'REGULAR QC'}
                  </span>
                </td>
                <td className="px-4 py-5">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter mb-0.5">{r.projectName}</span>
                    <span className="text-[13px] font-bold text-black truncate" title={r.taskName}>{r.taskName}</span>
                  </div>
                </td>
                <td className="px-4 py-5 text-[13px] font-bold text-black truncate">{r.agentName}</td>
                <td className="px-4 py-5">
                  <div className="flex flex-col gap-1.5 overflow-hidden">
                    {r.manualFeedback && (
                      <div className="flex gap-2 items-start overflow-hidden">
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-[7px] font-black uppercase shrink-0 mt-0.5">Manual</span>
                        <p className="text-[10px] text-slate-500 italic truncate">{r.manualFeedback}</p>
                      </div>
                    )}
                    {r.notes && (
                      <div className="flex gap-2 items-start overflow-hidden">
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[7px] font-black uppercase shrink-0 mt-0.5">Global</span>
                        <p className="text-[11px] font-medium text-slate-600 line-clamp-2 leading-snug">{r.notes}</p>
                      </div>
                    )}
                    {!r.notes && !r.manualFeedback && (
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No Notes Recorded</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-5 text-center">
                  <span className={`text-[15px] font-black ${r.score >= 90 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {r.score}%
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <button 
                      onClick={() => setViewingRecord(r)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" 
                      title="View Details"
                    >
                      <i className="bi bi-eye text-[16px]"></i>
                    </button>
                    {(user.role === 'ADMIN' || user.role === 'QC' || user.role === 'MANAGER') && (
                      <>
                        <button 
                          onClick={() => onEdit(r)}
                          className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors" 
                          title="Edit Audit"
                        >
                          <i className="bi bi-pencil-square text-[16px]"></i>
                        </button>
                        <button 
                          onClick={() => setRecordToDelete(r)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors" 
                          title="Delete Record"
                        >
                          <i className="bi bi-trash3 text-[16px]"></i>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayRows.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-2">
              <i className="bi bi-search text-[24px] opacity-20"></i>
            </div>
            <div className="text-center">
               <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">No Records Found</p>
               <p className="text-[10px] font-medium text-slate-300 mt-1">Try adjusting your filters or date range</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1E2A56]/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 space-y-7 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto border border-rose-100 shadow-sm">
                <i className="bi bi-trash3-fill text-[28px]"></i>
              </div>
              <div className="space-y-3">
                <h3 className="text-[18px] font-black text-[#1E2A56] uppercase tracking-tight">Delete Audit Record?</h3>
                <p className="text-[14px] font-medium text-slate-500 leading-relaxed px-4">
                  Permanently remove the audit for <span className="font-bold text-black">{recordToDelete.agentName}</span> from the project <span className="font-bold text-black">{recordToDelete.projectName}</span>?
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => {
                    onDelete(recordToDelete.id);
                    setRecordToDelete(null);
                  }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                >
                  Yes, Delete
                </button>
                <button 
                  onClick={() => setRecordToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Viewer Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1E2A56]/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] border border-white/20">
            <div className="bg-[#1E2A56] px-10 py-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/5">
                   <i className="bi bi-file-earmark-check text-[24px] text-white"></i>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[20px] font-black uppercase tracking-widest leading-none mb-1">
                    {viewingRecord.isRework ? 'Rework Audit Record' : 'Regular Audit Record'}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                    <span>{viewingRecord.projectName}</span>
                    <span className="opacity-30">|</span>
                    <span>{viewingRecord.agentName}</span>
                    <span className="opacity-30">|</span>
                    <span>Slot: {viewingRecord.timeSlot}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <button 
                  onClick={() => setViewingRecord(null)} 
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
                 >
                  <i className="bi bi-x-lg text-[20px]"></i>
                </button>
              </div>
            </div>
            <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-[#f8fafc]">
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-1">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Row Score</span>
                   <span className="text-[32px] font-black text-[#6366f1] leading-none">{viewingRecord.score}%</span>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-1 overflow-hidden">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Task Name</span>
                   <span className="text-[18px] font-bold text-[#1a2138] truncate">{viewingRecord.taskName}</span>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-1">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">QC Checker</span>
                   <span className="text-[18px] font-bold text-[#1a2138]">{viewingRecord.qcCheckerName}</span>
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 border-b border-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                          <th className="px-10 py-5">QC Code / Entry Type</th>
                          <th className="px-10 py-5 text-center">Errors Found</th>
                          <th className="px-10 py-5 text-right">Score</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {viewingRecord.samples && viewingRecord.samples.length > 0 ? viewingRecord.samples.map((s, idx) => (
                         <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-10 py-5 font-black text-black text-[14px]">{s.sampleId}</td>
                            <td className="px-10 py-5 text-center">
                               {s.errors.length > 0 ? (
                                 <div className="flex flex-wrap justify-center gap-2">
                                    {s.errors.map(errLabel => (
                                      <span key={errLabel} className="bg-rose-50 text-rose-500 px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest">
                                        {errLabel}
                                      </span>
                                    ))}
                                 </div>
                               ) : (
                                 <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Clean Entry</span>
                               )}
                            </td>
                            <td className="px-10 py-5 text-right font-black text-black text-[14px]">{s.score}</td>
                         </tr>
                       )) : (
                         <tr>
                            <td colSpan={3} className="px-10 py-10 text-center">
                               <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">No Sample Data</span>
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
            </div>
            <div className="p-8 bg-white border-t border-slate-50 flex justify-end">
               <button 
                onClick={() => setViewingRecord(null)}
                className="px-8 py-3.5 bg-[#1E2A56] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
               >
                 Close Report
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTable;
