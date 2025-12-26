
import React, { useState, useEffect } from 'react';
import { QCRecord } from '../types';
import { storage } from '../services/storage';

interface SuccessReportProps {
  record: QCRecord;
  onClose: () => void;
}

const SuccessReport: React.FC<SuccessReportProps> = ({ record, onClose }) => {
  const [agentEmail, setAgentEmail] = useState<string>('agent@gmail.com');
  const scoreToDisplay = record.isRework ? (record.reworkScore || 0) : record.score;

  useEffect(() => {
    const fetchEmail = async () => {
      const users = await storage.getUsers();
      const agent = users.find(u => u.name === record.agentName);
      if (agent?.email) setAgentEmail(agent.email);
    };
    fetchEmail();
  }, [record.agentName]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      {/* Container - Enhanced to fit more content */}
      <div className="bg-white w-[85%] max-w-5xl rounded-[2.5rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 flex flex-col relative animate-in zoom-in-95 duration-300 max-h-[90vh]">
        
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-indigo-600"></div>

        {/* Header Section */}
        <div className="px-10 py-6 border-b border-slate-50 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-all active:scale-90"
          >
            <i className="bi bi-x-lg text-[16px]"></i>
          </button>

          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100 shrink-0">
                <i className="bi bi-envelope-check-fill text-[20px]"></i>
             </div>
             <div className="flex flex-col">
                <h2 className="text-[16px] font-black text-[#1E2A56] uppercase tracking-tight leading-none">Report Dispatched</h2>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Successfully sent to Gmail</span>
             </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-10 py-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="mb-6">
            <p className="text-[14px] text-slate-500 leading-snug font-medium">
              Dear <span className="font-bold text-black">{record.agentName}</span>,<br />
              Your QC evaluation report for <span className="font-bold text-black">QC Evaluation on {record.date}</span> has been finalized and sent to your registered email address.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] py-8 flex flex-col items-center justify-center relative group overflow-hidden">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Final Audit Score</span>
              <span className="text-[72px] font-black text-[#6366f1] leading-none mb-3 drop-shadow-sm select-none">
                {scoreToDisplay}%
              </span>
              <div className="flex items-center gap-2 bg-white/80 px-4 py-1.5 rounded-full border border-slate-100">
                <i className="bi bi-at text-slate-400"></i>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[200px]">
                  {agentEmail}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <i className="bi bi-journal-text text-indigo-500"></i>
                Audit Summary Details:
              </h3>
              
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-[#1E2A56] text-white">
                    <tr>
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-[8px] text-center border-r border-white/10">Project</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-[8px] text-center border-r border-white/10">Time Slot</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-[8px] text-center">Checker</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-50/30">
                    <tr className="border-b border-slate-50">
                      <td className="px-4 py-4 text-slate-700 border-r border-slate-100 text-center font-black">{record.projectName}</td>
                      <td className="px-4 py-4 text-slate-700 border-r border-slate-100 text-center font-bold">{record.timeSlot}</td>
                      <td className="px-4 py-4 text-slate-700 text-center font-bold truncate">{record.qcCheckerName}</td>
                    </tr>
                    <tr className="bg-indigo-50/20">
                      <td colSpan={3} className="px-4 py-3 text-center">
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">SYSTEM VERIFIED DATA DISPATCH</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Feedback & Coaching Section - Added as requested */}
          <div className="space-y-6 mb-8 pt-4 border-t border-slate-50">
            <h3 className="text-[12px] font-black text-[#1E2A56] uppercase tracking-widest flex items-center gap-2">
              <i className="bi bi-patch-check-fill text-indigo-500"></i>
              Feedback & Coaching Insights
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden group hover:border-amber-200 transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 group-hover:w-1.5 transition-all"></div>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Manual Audit Feedback</h4>
                <p className="text-[13px] font-medium text-slate-600 italic leading-relaxed">
                  {record.manualFeedback || 'No additional manual feedback was provided for this evaluation.'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden group hover:border-indigo-200 transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 group-hover:w-1.5 transition-all"></div>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Feedback & Notes</h4>
                <p className="text-[13px] font-semibold text-slate-700 leading-relaxed">
                  {record.notes || 'No general coaching notes recorded for this task.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-3">
          <button 
            onClick={onClose}
            className="w-full max-w-md py-4 bg-[#1E2A56] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[13px] hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
          >
            Acknowledge & Close
          </button>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <i className="bi bi-shield-lock-fill text-emerald-500"></i>
             Official Quality Dispatch • Record ID: {record.id.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessReport;
