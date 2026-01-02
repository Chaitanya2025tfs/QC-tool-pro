
import React, { useState, useEffect } from 'react';
import { QCRecord } from '../types';
import { storage } from '../services/storage';

interface SuccessReportProps {
  record: QCRecord;
  onClose: () => void;
}

const SuccessReport: React.FC<SuccessReportProps> = ({ record, onClose }) => {
  const [agentEmail, setAgentEmail] = useState<string>('');
  const scoreToDisplay = record.isRework ? (record.reworkScore || 0) : record.score;

  useEffect(() => {
    const fetchEmail = async () => {
      const users = await storage.getUsers();
      const agent = users.find(u => u.name === record.agentName);
      if (agent?.email) setAgentEmail(agent.email.toUpperCase());
    };
    fetchEmail();
  }, [record.agentName]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300 font-sans">
      <div className="bg-white w-full max-w-[900px] rounded-[3rem] shadow-[0_30px_100px_-10px_rgba(0,0,0,0.3)] overflow-hidden border border-white relative animate-in zoom-in-95 duration-300">
        
        {/* Top Gradient Accent */}
        <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-[#10b981] via-[#6366f1] to-[#4f46e5]"></div>

        {/* Modal Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-400 transition-all active:scale-90"
        >
          <i className="bi bi-x-lg text-[20px]"></i>
        </button>

        <div className="p-12 space-y-10">
          {/* Header Section */}
          <div className="flex items-start gap-4">
             <div className="w-14 h-14 bg-[#f0fdf4] rounded-2xl flex items-center justify-center text-[#10b981] shadow-sm shrink-0">
                <i className="bi bi-envelope-check text-[32px]"></i>
             </div>
             <div className="flex flex-col pt-1">
                <h2 className="text-[20px] font-black text-[#1E2A56] uppercase tracking-widest leading-none">Report Dispatched</h2>
                <span className="text-[12px] font-black text-[#10b981] uppercase tracking-[0.2em] mt-1.5">Successfully sent to Gmail</span>
             </div>
          </div>

          <div className="space-y-2">
            <p className="text-[18px] text-slate-500 font-medium leading-snug">
              Dear <span className="font-bold text-black">{record.agentName}</span>,
            </p>
            <p className="text-[18px] text-slate-500 font-medium leading-snug">
              Your QC evaluation report for <span className="font-bold text-black">QC Evaluation on {record.date}</span> has been sent.
            </p>
          </div>

          {/* Core Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            {/* Left: Audit Score Circle Box */}
            <div className="bg-[#f8fafc]/50 rounded-[3rem] p-12 flex flex-col items-center justify-center border border-slate-100 shadow-inner relative overflow-hidden group">
               <span className="text-[14px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Audit Score</span>
               <span className="text-[120px] font-black text-[#6366f1] leading-none mb-8 drop-shadow-sm select-none">
                 {scoreToDisplay}%
               </span>
               <div className="bg-white/80 backdrop-blur-sm px-8 py-3 rounded-full border border-slate-100 shadow-sm flex items-center gap-3">
                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                   Sent to: {agentEmail || 'AGENT@GMAIL.COM'}
                 </span>
               </div>
            </div>

            {/* Right: Summary Table and Checker info */}
            <div className="space-y-8">
               <div className="flex items-center gap-2">
                  <i className="bi bi-info-circle text-[#6366f1] text-[18px]"></i>
                  <h3 className="text-[13px] font-black text-[#1E2A56] uppercase tracking-widest">Email Content Summary:</h3>
               </div>

               <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full text-center text-[13px]">
                    <thead className="bg-[#6366f1] text-white">
                      <tr>
                        <th className="py-4 font-black uppercase tracking-widest text-[9px] border-r border-white/10">Date</th>
                        <th className="py-4 font-black uppercase tracking-widest text-[9px] border-r border-white/10">Slot</th>
                        <th className="py-4 font-black uppercase tracking-widest text-[9px] border-r border-white/10">Project</th>
                        <th className="py-4 font-black uppercase tracking-widest text-[9px]">Score</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="border-b border-slate-50">
                        <td className="py-6 px-4 text-slate-500 font-bold">{record.date}</td>
                        <td className="py-6 px-4 text-slate-500 font-bold">{record.timeSlot}</td>
                        <td className="py-6 px-4 text-slate-500 font-bold">{record.projectName}</td>
                        <td className="py-6 px-4 font-black text-black text-[16px]">{scoreToDisplay}%</td>
                      </tr>
                    </tbody>
                  </table>
               </div>

               <div className="pl-6 border-l-[4px] border-[#6366f1] py-2 bg-slate-50 rounded-r-2xl">
                  <p className="text-[16px] font-medium text-slate-600">
                    <span className="font-bold text-[#6366f1]">QC Checker:</span> {record.qcCheckerName}
                  </p>
               </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 flex flex-col items-center gap-4">
             <button 
              onClick={onClose}
              className="w-full max-w-sm py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[15px] hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]"
             >
               Done & Return
             </button>
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <i className="bi bi-patch-check-fill text-[#10b981]"></i>
               Portal System Triggered Official Gmail Notification
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessReport;
