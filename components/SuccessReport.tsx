
import React, { useState, useEffect } from 'react';
import { QCRecord, User } from '../types';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-6 animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden border border-white/20 flex flex-col p-12 relative animate-in zoom-in-95 duration-300">
        
        {/* Success Status Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-indigo-500 to-indigo-600"></div>

        {/* Dispatch Confirmation Header */}
        <div className="flex items-center gap-4 mb-8">
           <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
              <i className="bi bi-envelope-check-fill text-[30px]"></i>
           </div>
           <div className="flex flex-col">
              <h2 className="text-[22px] font-black text-black uppercase tracking-tight leading-none">Report Dispatched</h2>
              <span className="text-[14px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Successfully sent to Gmail</span>
           </div>
        </div>

        {/* Header Message */}
        <div className="mb-8">
          <p className="text-[19px] text-slate-600 leading-snug font-medium">
            Dear <span className="font-bold text-black">{record.agentName}</span>,<br />
            Your QC evaluation report for <span className="font-bold text-black">QC Evaluation on {record.date}</span> has been sent.
          </p>
        </div>

        {/* Score Card Section */}
        <div className="bg-[#f8fbff] border border-indigo-50/50 rounded-[2.5rem] py-14 flex flex-col items-center justify-center mb-10 shadow-inner">
          <span className="text-[17px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Audit Score</span>
          <span className="text-[105px] font-black text-[#5850ec] leading-none mb-4 select-none drop-shadow-sm">{scoreToDisplay}%</span>
          <span className="text-[15px] font-bold text-slate-400 uppercase tracking-widest">Sent to: {agentEmail}</span>
        </div>

        {/* Details Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-[18px] font-black text-black">Email Content Summary:</h3>
          <div className="border border-slate-200 rounded-[1.25rem] overflow-hidden shadow-sm">
            <table className="w-full text-left text-[16px]">
              <thead className="bg-[#5850ec] text-white">
                <tr>
                  <th className="px-5 py-4 font-bold uppercase tracking-widest text-[12px] border-r border-white/20">Date</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-widest text-[12px] border-r border-white/20">Slot</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-widest text-[12px] border-r border-white/20">Project</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-widest text-[12px] text-center">Score</th>
                </tr>
              </thead>
              <tbody className="bg-[#f0fdf4]">
                <tr>
                  <td className="px-5 py-4 text-slate-700 border-r border-slate-200/50">{record.date}</td>
                  <td className="px-5 py-4 text-slate-700 border-r border-slate-200/50">{record.timeSlot}</td>
                  <td className="px-5 py-4 text-slate-700 border-r border-slate-200/50">{record.projectName}</td>
                  <td className="px-5 py-4 font-black text-black text-center">{scoreToDisplay}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Checker info */}
        <div className="mb-10 pl-6 border-l-[5px] border-[#5850ec] py-2 bg-indigo-50/20 rounded-r-xl">
           <p className="text-[18px] text-slate-600 font-medium">
             <span className="font-bold text-[#5850ec] mr-1">QC Checker:</span> 
             <span className="text-slate-500">{record.qcCheckerName}</span>
           </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-4">
          <button 
            onClick={onClose}
            className="w-full py-5 bg-[#111827] text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[18px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-3"
          >
            Done & Return
          </button>
          
          <div className="flex items-center justify-center gap-2.5 text-slate-400">
             <i className="bi bi-check-circle-fill text-[18px] text-emerald-500"></i>
             <span className="text-[13px] font-bold uppercase tracking-widest">Portal Owner has triggered Gmail</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuccessReport;
