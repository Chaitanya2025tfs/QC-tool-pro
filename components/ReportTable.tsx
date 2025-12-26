
import React, { useState, useMemo } from 'react';
import { QCRecord, User } from '../types';
import { PROJECTS, AGENTS, ALL_ERRORS } from '../constants';

interface ReportTableProps {
  user: User;
  records: QCRecord[];
  onEdit: (record: QCRecord) => void;
  onDelete: (id: string) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({ user, records, onEdit, onDelete }) => {
  const [filters, setFilters] = useState({
    agent: '',
    project: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [viewingRecord, setViewingRecord] = useState<any | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);

  const displayRows = useMemo(() => {
    const flatRows: any[] = [];
    records.forEach(r => {
      flatRows.push({
        ...r,
        displayType: 'REGULAR QC',
        displayScore: r.score,
        rowId: `${r.id}_reg`,
        originalId: r.id
      });
      if (r.reworkScore !== undefined) {
        flatRows.push({
          ...r,
          displayType: 'REWORK QC',
          displayScore: r.reworkScore,
          rowId: `${r.id}_rew`,
          originalId: r.id
        });
      }
    });

    return flatRows.filter(r => {
      const matchSearch = !filters.search || r.taskName.toLowerCase().includes(filters.search.toLowerCase());
      const matchAgent = !filters.agent || r.agentName === filters.agent;
      const matchProject = !filters.project || r.projectName === filters.project;
      const matchDateFrom = !filters.startDate || r.date >= filters.startDate;
      const matchDateTo = !filters.endDate || r.date <= filters.endDate;
      const matchUser = user.role === 'AGENT' ? r.agentName === user.name : true;
      return matchSearch && matchAgent && matchProject && matchDateFrom && matchDateTo && matchUser;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [records, filters, user]);

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Project', 'Task', 'Agent', 'Score', 'QC Checker'];
    const rows = displayRows.map(r => [
      r.date, r.displayType, r.projectName, r.taskName, r.agentName, `${r.displayScore}%`, r.qcCheckerName
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canEditDelete = () => {
    return user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'QC';
  };

  const resetFilters = () => {
    setFilters({ agent: '', project: '', startDate: '', endDate: '', search: '' });
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      onDelete(recordToDelete.originalId);
      setRecordToDelete(null);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#f3f4f6] min-h-screen font-sans">
      <div className="w-[90%] mx-auto space-y-8">
        <h2 className="text-[29px] font-normal text-black tracking-tight">Audit Repository</h2>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-8">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <i className="bi bi-search absolute left-5 top-1/2 -translate-y-1/2 text-black font-bold text-[19px]"></i>
              <input 
                type="text" 
                placeholder="Search Task or File Name..."
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
                className="w-full pl-12 pr-5 py-4 bg-[#f8fafc] border border-slate-200 rounded-2xl outline-none text-[19px] font-normal text-black focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <select 
                value={filters.agent} 
                onChange={e => setFilters({...filters, agent: e.target.value})}
                className="flex-1 lg:w-48 px-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none text-[16px] font-normal uppercase tracking-widest text-black appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_1.25rem_center] bg-no-repeat pr-12"
              >
                <option value="">All Agents</option>
                {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select 
                value={filters.project} 
                onChange={e => setFilters({...filters, project: e.target.value})}
                className="flex-1 lg:w-48 px-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none text-[16px] font-normal uppercase tracking-widest text-black appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_1.25rem_center] bg-no-repeat pr-12"
              >
                <option value="">All Projects</option>
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 border-t border-slate-50 pt-6">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-bold text-black uppercase tracking-widest">Date From:</span>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={e => setFilters({...filters, startDate: e.target.value})}
                  className="px-4 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-[17px] font-normal text-black outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-bold text-black uppercase tracking-widest">Date To:</span>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={e => setFilters({...filters, endDate: e.target.value})}
                  className="px-4 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-[17px] font-normal text-black outline-none"
                />
              </div>
            </div>
            <button 
              onClick={resetFilters}
              className="text-[15px] font-normal text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-6 pt-2 text-[15px] font-bold text-black uppercase tracking-[0.1em] px-4">Record Date</th>
                  <th className="pb-6 pt-2 text-[15px] font-bold text-black uppercase tracking-[0.1em] px-4">Time Slot</th>
                  <th className="pb-6 pt-2 text-[15px] font-bold text-black uppercase tracking-[0.1em] px-4 text-center">Audit Type</th>
                  <th className="pb-6 pt-2 text-[15px] font-bold text-black uppercase tracking-[0.1em] px-4">Project / Task</th>
                  <th className="pb-6 pt-2 text-[15px] font-bold text-black uppercase tracking-[0.1em] px-4">Agent</th>
                  <th className="pb-6 pt-2 text-[15px] font-bold text-black uppercase tracking-[0.1em] px-4">QC Score</th>
                  <th className="pb-6 pt-2 text-[15px] font-bold text-black uppercase tracking-[0.1em] px-4 text-center">Audit Report</th>
                  <th className="pb-6 pt-2 text-[15px] font-bold text-black uppercase tracking-[0.1em] px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayRows.length === 0 ? (
                  <tr><td colSpan={8} className="py-20 text-center text-black font-bold uppercase tracking-widest text-[16px] italic">No Audit Records Found</td></tr>
                ) : (
                  displayRows.map((r) => (
                    <tr key={r.rowId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-8 px-4 text-[18px] font-normal text-black">{r.date}</td>
                      <td className="py-8 px-4 text-[17px] font-normal text-black">{r.timeSlot}</td>
                      <td className="py-8 px-4 text-center">
                        <span className={`px-4 py-1.5 rounded-lg text-[14px] font-bold tracking-widest ${r.displayType === 'REGULAR QC' ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#fff1f2] text-[#ef4444]'}`}>
                          {r.displayType}
                        </span>
                      </td>
                      <td className="py-8 px-4">
                        <div className="flex flex-col">
                           <span className="text-[17px] font-normal text-[#4f46e5] uppercase tracking-tighter leading-tight">{r.projectName}</span>
                           <span className="text-[16px] text-black font-bold truncate max-w-[120px]">{r.taskName}</span>
                        </div>
                      </td>
                      <td className="py-8 px-4 text-[18px] font-normal text-black">{r.agentName}</td>
                      <td className="py-8 px-4">
                        <span className={`text-[19px] font-normal ${r.displayScore >= 90 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                          {r.displayScore}%
                        </span>
                      </td>
                      <td className="py-8 px-4 text-center">
                        <button 
                          onClick={exportCSV}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#eef2ff] text-[#4f46e5] rounded-xl text-[15px] font-normal uppercase tracking-widest hover:bg-[#4f46e5] hover:text-white transition-all shadow-sm"
                        >
                          <i className="bi bi-file-earmark-excel"></i> Excel
                        </button>
                      </td>
                      <td className="py-8 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                           <button 
                             onClick={() => setViewingRecord(r)}
                             className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-black font-bold hover:bg-slate-200 transition-colors"
                             title="Check Details"
                           >
                             <i className="bi bi-eye text-[23px]"></i>
                           </button>
                           {canEditDelete() && (
                             <>
                               <button 
                                 onClick={() => onEdit(r)}
                                 className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5] hover:bg-[#4f46e5] hover:text-white transition-all shadow-sm"
                                 title="Edit Audit"
                               >
                                 <i className="bi bi-pencil-square text-[23px]"></i>
                               </button>
                               <button 
                                 onClick={() => setRecordToDelete(r)}
                                 className="w-12 h-12 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                 title="Delete Audit"
                               >
                                 <i className="bi bi-trash3 text-[23px]"></i>
                               </button>
                             </>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {recordToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
              <i className="bi bi-trash3-fill text-[41px]"></i>
            </div>
            <h3 className="text-[25px] font-normal text-black mb-2">Delete Audit Record?</h3>
            <p className="text-[19px] text-black font-bold mb-10 leading-relaxed">
              Are you sure you want to delete the audit for <span className="font-normal text-black">{recordToDelete.taskName}</span>? This operation cannot be reversed.
            </p>
            
            <div className="flex w-full gap-4">
              <button 
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-4 bg-slate-100 text-black font-normal uppercase tracking-widest text-[17px] hover:bg-slate-200 transition-all"
              >
                No, Keep
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 bg-rose-500 text-white rounded-xl font-normal uppercase tracking-widest text-[17px] hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative custom-scrollbar">
            <div className="bg-[#111827] text-white p-8 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-[#10b981]"></div>
                <h3 className="text-[25px] font-normal uppercase tracking-widest">Audit Details View</h3>
              </div>
              <button 
                onClick={() => setViewingRecord(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-rose-500 transition-colors text-white"
              >
                <i className="bi bi-x-lg text-[23px]"></i>
              </button>
            </div>

            <div className="p-10 space-y-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <SummaryItem label="Audit Type" value={viewingRecord.displayType} color="text-indigo-600" />
                <SummaryItem label="Final Score" value={`${viewingRecord.displayScore}%`} color="text-emerald-500" />
                <SummaryItem label="Time Slot" value={viewingRecord.timeSlot} />
                <SummaryItem label="Project" value={viewingRecord.projectName} />
              </div>

              <div className="border border-slate-100 rounded-3xl p-8 bg-slate-50/30 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <DetailRow label="Agent Name" value={viewingRecord.agentName} />
                      <DetailRow label="Task Name" value={viewingRecord.taskName} />
                      <DetailRow label="Date" value={viewingRecord.date} />
                    </div>
                    <div>
                      <DetailRow label="Manager/TL" value={viewingRecord.tlName} />
                      <DetailRow label="QC Checker" value={viewingRecord.qcCheckerName} />
                      <DetailRow label="Status" value={viewingRecord.noWork ? 'No Work/Absent' : 'Work Evaluated'} />
                    </div>
                 </div>
              </div>

              {!viewingRecord.noWork && viewingRecord.samples && viewingRecord.samples.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[17px] font-bold uppercase tracking-widest text-black px-2">Samples Breakdown</h4>
                  <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-[16px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-left font-bold text-black uppercase tracking-widest">Sample ID</th>
                          <th className="px-6 py-4 text-left font-bold text-black uppercase tracking-widest">Errors Found</th>
                          <th className="px-6 py-4 text-right font-bold text-black uppercase tracking-widest">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingRecord.samples.map((s: any) => (
                          <tr key={s.sampleId} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-normal text-black">{s.sampleId}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-2">
                                {s.isClean ? (
                                  <span className="text-[14px] font-bold text-emerald-500 uppercase">No Errors</span>
                                ) : (
                                  s.errors.map((e: string) => (
                                    <span key={e} className="bg-rose-50 text-rose-500 px-2 py-0.5 rounded text-[14px] font-normal">{e}</span>
                                  ))
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-normal text-black">{s.score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {viewingRecord.manualQC && (
                <div className="bg-indigo-50/30 border border-indigo-100 rounded-3xl p-8 space-y-4">
                  <h4 className="text-[17px] font-bold uppercase tracking-widest text-indigo-400">Manual Audit Entry</h4>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      {viewingRecord.manualErrors && viewingRecord.manualErrors.length > 0 ? viewingRecord.manualErrors.map((e: string) => (
                        <span key={e} className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[15px] font-normal uppercase">{e}</span>
                      )) : <span className="text-[15px] font-bold text-black italic">No manual errors selected</span>}
                    </div>
                    {viewingRecord.manualFeedback && (
                      <div className="bg-white p-4 rounded-xl border border-indigo-50">
                        <p className="text-[17px] text-indigo-700 leading-relaxed italic">"{viewingRecord.manualFeedback}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-[17px] font-bold uppercase tracking-widest text-black px-2">Coaching & Global Feedback</h4>
                <div className="bg-white p-8 border border-slate-200 rounded-[2rem] shadow-inner">
                   <p className="text-[20px] text-black leading-relaxed whitespace-pre-line font-normal">
                     {viewingRecord.notes || 'No coaching notes provided.'}
                   </p>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setViewingRecord(null)}
                className="px-8 py-3 bg-[#111827] text-white rounded-xl font-normal uppercase tracking-widest text-[17px] hover:bg-slate-800 transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryItem = ({ label, value, color = "text-black" }: { label: string, value: string, color?: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
    <span className="text-[15px] font-bold text-black uppercase tracking-[0.2em] mb-1">{label}</span>
    <span className={`text-[21px] font-normal uppercase ${color}`}>{value}</span>
  </div>
);

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <span className="text-[16px] font-bold text-black uppercase tracking-widest">{label}</span>
    <span className="text-[17px] font-normal text-black">{value}</span>
  </div>
);

export default ReportTable;