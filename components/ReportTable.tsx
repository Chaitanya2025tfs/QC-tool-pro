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
  const [filters, setFilters] = useState({
    agent: '',
    project: '',
    date: ''
  });

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchAgent = !filters.agent || r.agentName === filters.agent;
      const matchProject = !filters.project || r.projectName === filters.project;
      const matchDate = !filters.date || r.date === filters.date;
      const matchUser = user.role === 'AGENT' ? r.agentName === user.name : true;
      return matchAgent && matchProject && matchDate && matchUser;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [records, filters, user]);

  const exportCSV = () => {
    const headers = ['Date', 'Time', 'Agent', 'Project', 'QC Checker', 'Score', 'Rework Score', 'Task', 'Errors', 'Notes'];
    const rows = filteredRecords.map(r => {
      // Aggregating errors from manual audit and samples as QCRecord doesn't have a direct top-level errors array
      const allErrors = new Set<string>();
      if (r.manualErrors) r.manualErrors.forEach(e => allErrors.add(e));
      if (r.samples) {
        r.samples.forEach(s => {
          s.errors.forEach(e => allErrors.add(e));
        });
      }
      const errorsStr = Array.from(allErrors).join('|') || 'None';

      return [
        r.date,
        `${r.time.hr}:${r.time.min} ${r.time.period}`,
        r.agentName,
        r.projectName,
        r.qcCheckerName,
        `${r.score}%`,
        r.reworkScore ? `${r.reworkScore}%` : '-',
        r.taskName,
        errorsStr,
        r.notes.replace(/,/g, ';')
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QC_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canEditDelete = (record: QCRecord) => {
    return user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'QC';
  };

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-y-auto custom-scrollbar">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Quality Records Database</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={filters.agent} 
            onChange={e => setFilters({...filters, agent: e.target.value})}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
          >
            <option value="">All Agents</option>
            {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select 
            value={filters.project} 
            onChange={e => setFilters({...filters, project: e.target.value})}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
          >
            <option value="">All Projects</option>
            {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input 
            type="date" 
            value={filters.date} 
            onChange={e => setFilters({...filters, date: e.target.value})}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
          />
          {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-lg active:scale-95 transition-all"
            >
              <i className="bi bi-file-earmark-excel"></i> Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Date/Time</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Agent Info</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Project & Task</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">QC Checker</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Reg Score</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Rew Score</th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <i className="bi bi-inbox text-5xl mb-2"></i>
                      <p className="text-lg font-bold">No records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-700">{r.date}</div>
                      <div className="text-xs text-slate-400">{r.time.hr}:{r.time.min} {r.time.period} | {r.timeSlot}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-700">{r.agentName}</div>
                      <div className="text-xs text-slate-400 italic">TL: {r.tlName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-blue-600">{r.projectName}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">{r.taskName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 font-medium">{r.qcCheckerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-black ${r.score >= 90 ? 'text-green-600' : 'text-red-600'}`}>
                        {r.noWork ? 'N/A' : `${r.score}%`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-purple-600">
                        {r.reworkScore ? `${r.reworkScore}%` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEditDelete(r) && (
                          <>
                            <button 
                              onClick={() => onEdit(r)}
                              className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                              title="Edit Record"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button 
                              onClick={() => onDelete(r.id)}
                              className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                              title="Delete Record"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}
                        <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-200">
                          <i className="bi bi-eye"></i>
                        </button>
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
  );
};

export default ReportTable;