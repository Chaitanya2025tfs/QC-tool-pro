
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
      {/* Container - Sized to 70% width, more compact height */}
      <div className="bg-white w-[70%] max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 flex flex-col relative animate-in zoom-in-95 duration-300">
        
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-indigo-600"></div>

        {/* Header Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-8">
          
          {/* Close "X" Button - Top Right */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-all active:scale-90"
          >
            <i className="bi bi-x-lg text-[18px]"></i>
          </button>

          {/* Dispatch Info Row */}
          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100 shrink-0">
                <i className="bi bi-envelope-check-fill text-[24px]"></i>
             </div>
             <div className="flex flex-col">
                <h2 className="text-[18px] font-black text-[#1E2A56] uppercase tracking-tight leading-none">Report Dispatched</h2>
                <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Successfully sent to Gmail</span>
             </div>
          </div>

          {/* Salutation */}
          <div className="mb-8">
            <p className="text-[16px] text-slate-500 leading-snug font-medium">
              Dear <span className="font-bold text-black">{record.agentName}</span>,<br />
              Your QC evaluation report for <span className="font-bold text-black">QC Evaluation on {record.date}</span> has been sent.
            </p>
          </div>

          {/* Split Content Grid: Score Left, Summary Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 items-start">
            
            {/* Score Visualization Card */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] py-10 flex flex-col items-center justify-center relative overflow-hidden group">
              <span className="text-[13px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Audit Score</span>
              <span className="text-[90px] font-black text-[#6366f1] leading-none mb-4 drop-shadow-sm select-none">
                {scoreToDisplay}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/80 px-4 py-1.5 rounded-full border border-slate-100 truncate max-w-[90%]">
                SENT TO: {agentEmail.toUpperCase()}
              </span>
            </div>

            {/* Email Content Summary List */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[14px] font-black text-[#1E2A56] uppercase tracking-widest px-1">
                <i className="bi bi-info-circle text-indigo-500"></i>
                Email Content Summary:
              </div>
              
              <div className="border border-slate-100 rounded-[1rem] overflow-hidden shadow-sm bg-white">
                <table className="w-full text-left text-[12px] border-collapse">
                  <thead className="bg-[#6366f1] text-white">
                    <tr>
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px] text-center border-r border-white/10">Date</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px] text-center border-r border-white/10">Slot</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px] text-center border-r border-white/10">Project</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px] text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-indigo-50/20">
                    <tr>
                      <td className="px-4 py-4 text-slate-600 border-r border-slate-100 text-center font-bold">{record.date}</td>
                      <td className="px-4 py-4 text-slate-600 border-r border-slate-100 text-center font-bold">{record.timeSlot}</td>
                      <td className="px-4 py-4 text-slate-600 border-r border-slate-100 text-center font-bold truncate">{record.projectName}</td>
                      <td className="px-4 py-4 font-black text-black text-center text-[15px]">{scoreToDisplay}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Attribution */}
              <div className="pl-4 border-l-[3px] border-[#6366f1] py-1 bg-indigo-50/10 rounded-r-lg">
                 <p className="text-[15px] font-medium">
                   <span className="font-bold text-[#6366f1]">QC Checker:</span> 
                   <span className="text-slate-600 ml-1">{record.qcCheckerName}</span>
                 </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={onClose}
              className="w-full max-w-sm py-4 bg-[#1E2A56] text-white rounded-xl font-black uppercase tracking-[0.2em] text-[14px] hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              Done & Return
            </button>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <i className="bi bi-check2-circle text-emerald-500 text-[14px]"></i>
               Portal system triggered official Gmail notification
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessReport;
