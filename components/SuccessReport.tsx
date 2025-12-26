
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
      {/* Container - Sized for content visibility without scroll */}
      <div className="bg-white w-[70%] max-w-4xl rounded-[2rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 flex flex-col relative animate-in zoom-in-95 duration-300">
        
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-indigo-600"></div>

        {/* Main Content */}
        <div className="px-10 py-6">
          
          {/* Close "X" Button - Top Right */}
          <button 
            onClick={onClose}
            className="absolute top-5 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-all active:scale-90"
          >
            <i className="bi bi-x-lg text-[16px]"></i>
          </button>

          {/* Dispatch Info Row */}
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100 shrink-0">
                <i className="bi bi-envelope-check-fill text-[20px]"></i>
             </div>
             <div className="flex flex-col">
                <h2 className="text-[16px] font-black text-[#1E2A56] uppercase tracking-tight leading-none">Report Dispatched</h2>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Successfully sent to Gmail</span>
             </div>
          </div>

          {/* Salutation */}
          <div className="mb-6">
            <p className="text-[14px] text-slate-500 leading-snug font-medium">
              Dear <span className="font-bold text-black">{record.agentName}</span>,<br />
              Your QC evaluation report for <span className="font-bold text-black">QC Evaluation on {record.date}</span> has been sent.
            </p>
          </div>

          {/* Split Content Grid: Score Left, Summary Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-center">
            
            {/* Score Visualization Card - Compacted height and font */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-[1.5rem] py-6 flex flex-col items-center justify-center relative overflow-hidden group">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Audit Score</span>
              <span className="text-[64px] font-black text-[#6366f1] leading-none mb-3 drop-shadow-sm select-none">
                {scoreToDisplay}%
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full border border-slate-100 truncate max-w-[90%]">
                SENT TO: {agentEmail.toUpperCase()}
              </span>
            </div>

            {/* Email Content Summary List */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[12px] font-black text-[#1E2A56] uppercase tracking-widest px-1">
                <i className="bi bi-info-circle text-indigo-500"></i>
                Email Content Summary:
              </div>
              
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-[#6366f1] text-white">
                    <tr>
                      <th className="px-3 py-2 font-bold uppercase tracking-widest text-[8px] text-center border-r border-white/10">Date</th>
                      <th className="px-3 py-2 font-bold uppercase tracking-widest text-[8px] text-center border-r border-white/10">Slot</th>
                      <th className="px-3 py-2 font-bold uppercase tracking-widest text-[8px] text-center border-r border-white/10">Project</th>
                      <th className="px-3 py-2 font-bold uppercase tracking-widest text-[8px] text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-indigo-50/20">
                    <tr>
                      <td className="px-3 py-3 text-slate-600 border-r border-slate-100 text-center font-bold">{record.date}</td>
                      <td className="px-3 py-3 text-slate-600 border-r border-slate-100 text-center font-bold">{record.timeSlot}</td>
                      <td className="px-3 py-3 text-slate-600 border-r border-slate-100 text-center font-bold truncate">{record.projectName}</td>
                      <td className="px-3 py-3 font-black text-black text-center text-[13px]">{scoreToDisplay}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Attribution */}
              <div className="pl-3 border-l-[3px] border-[#6366f1] py-1 bg-indigo-50/10 rounded-r-lg">
                 <p className="text-[13px] font-medium">
                   <span className="font-bold text-[#6366f1]">QC Checker:</span> 
                   <span className="text-slate-600 ml-1">{record.qcCheckerName}</span>
                 </p>
              </div>
            </div>
          </div>

          {/* Action Footer - Compacted spacing */}
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={onClose}
              className="w-full max-w-sm py-3.5 bg-[#1E2A56] text-white rounded-xl font-black uppercase tracking-[0.2em] text-[13px] hover:bg-black transition-all shadow-lg shadow-slate-900/10 active:scale-95"
            >
              Done & Return
            </button>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <i className="bi bi-check2-circle text-emerald-500 text-[12px]"></i>
               Portal system triggered official Gmail notification
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessReport;
