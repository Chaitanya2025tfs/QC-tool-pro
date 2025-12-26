
import React, { useState, useMemo } from 'react';
import { QCRecord, User } from '../types';

interface InboxProps {
  user: User;
  records: QCRecord[];
}

const Inbox: React.FC<InboxProps> = ({ user, records }) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Filter records specifically for this user (Agent)
  const myReports = useMemo(() => {
    return records
      .filter(r => r.agentName === user.name)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [records, user]);

  const selectedRecord = useMemo(() => {
    if (!selectedRecordId) return myReports[0] || null;
    return myReports.find(r => r.id === selectedRecordId) || myReports[0] || null;
  }, [selectedRecordId, myReports]);

  if (myReports.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 bg-slate-50 min-h-screen">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-200 mb-6 shadow-sm border border-slate-100">
           <i className="bi bi-mailbox2 text-[45px]"></i>
        </div>
        <h2 className="text-[25px] font-black text-slate-400 uppercase tracking-widest">Inbox is Empty</h2>
        <p className="text-[18px] text-slate-400 font-medium mt-2">Evaluation reports sent by the portal owner will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans">
      {/* Mail List Sidebar */}
      <div className="w-96 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
           <h2 className="text-[22px] font-black text-black uppercase tracking-tight">Mail Inbox</h2>
           <span className="bg-indigo-50 text-[#4f46e5] px-3 py-1 rounded-full text-[14px] font-black tracking-widest">{myReports.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {myReports.map((report) => (
             <button
               key={report.id}
               onClick={() => setSelectedRecordId(report.id)}
               className={`w-full p-6 text-left border-b border-slate-50 transition-all hover:bg-slate-50/80 flex flex-col gap-2 group ${selectedRecordId === report.id || (!selectedRecordId && myReports[0].id === report.id) ? 'bg-indigo-50/40 border-l-4 border-l-[#4f46e5]' : ''}`}
             >
               <div className="flex justify-between items-start">
                  <span className="text-[14px] font-black text-[#4f46e5] uppercase tracking-widest">Portal Owner</span>
                  <span className="text-[13px] font-bold text-slate-400">{report.date}</span>
               </div>
               <h3 className="text-[17px] font-black text-black leading-tight group-hover:text-[#4f46e5] transition-colors">
                  QC Evaluation Report for {report.projectName}
               </h3>
               <p className="text-[15px] text-slate-500 font-medium truncate w-full">
                  Evaluation on {report.date} is ready for review. Checker: {report.qcCheckerName}
               </p>
             </button>
           ))}
        </div>
      </div>

      {/* Mail Content View */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-10 custom-scrollbar">
        {selectedRecord && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Email Metadata */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col gap-4">
               <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#1E2A56] rounded-full flex items-center justify-center text-white font-black text-[20px]">PO</div>
                     <div className="flex flex-col">
                        <span className="text-[18px] font-black text-black">Portal Owner <span className="text-slate-400 font-normal ml-2 text-[15px]">&lt;evaluator-system@portal.com&gt;</span></span>
                        <span className="text-[15px] text-slate-500 font-medium">To: {user.name} &lt;{user.email}&gt;</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">{selectedRecord.date}</span>
                  </div>
               </div>
               <h1 className="text-[25px] font-black text-black">Subject: Your QC Evaluation Report - {selectedRecord.date}</h1>
            </div>

            {/* Stylized Report Content (Matches reference Image) */}
            <div className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 flex flex-col p-12 relative border-t-[8px] border-t-[#1E2A56]">
              {/* Header Message */}
              <div className="mb-10">
                <p className="text-[21px] text-slate-600 leading-snug font-medium">
                  Dear <span className="font-bold text-black">{selectedRecord.agentName}</span>,<br />
                  Your QC evaluation report for <span className="font-bold text-black">QC Evaluation on {selectedRecord.date}</span> is ready.
                </p>
              </div>

              {/* Score Card Section */}
              <div className="bg-[#f8fbff] border border-indigo-50/50 rounded-[2.5rem] py-16 flex flex-col items-center justify-center mb-12 shadow-inner">
                <span className="text-[18px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Average QC Score</span>
                <span className="text-[115px] font-black text-[#1E2A56] leading-none mb-4 select-none drop-shadow-sm">
                   {selectedRecord.isRework ? selectedRecord.reworkScore : selectedRecord.score}%
                </span>
                <span className="text-[17px] font-bold text-slate-400 uppercase tracking-widest">Total Records: 1</span>
              </div>

              {/* Details Section */}
              <div className="space-y-5 mb-10">
                <h3 className="text-[20px] font-black text-black px-1">Score Details:</h3>
                <div className="border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left text-[18px]">
                    <thead className="bg-[#1E2A56] text-white">
                      <tr>
                        <th className="px-6 py-5 font-bold uppercase tracking-widest text-[14px] border-r border-white/20">Date</th>
                        <th className="px-6 py-5 font-bold uppercase tracking-widest text-[14px] border-r border-white/20">Slot</th>
                        <th className="px-6 py-5 font-bold uppercase tracking-widest text-[14px] border-r border-white/20">Project</th>
                        <th className="px-6 py-5 font-bold uppercase tracking-widest text-[14px] text-center">Score</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#f0fdf4]">
                      <tr>
                        <td className="px-6 py-5 text-slate-700 border-r border-slate-200/50">{selectedRecord.date}</td>
                        <td className="px-6 py-5 text-slate-700 border-r border-slate-200/50">{selectedRecord.timeSlot}</td>
                        <td className="px-6 py-5 text-slate-700 border-r border-slate-200/50">{selectedRecord.projectName}</td>
                        <td className="px-6 py-5 font-black text-black text-center">
                           {selectedRecord.isRework ? selectedRecord.reworkScore : selectedRecord.score}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Checker info with blue left accent */}
              <div className="mb-12 pl-8 border-l-[6px] border-[#1E2A56] py-4 bg-indigo-50/20 rounded-r-2xl">
                <p className="text-[20px] text-slate-600 font-medium">
                  <span className="font-bold text-[#1E2A56] mr-2">QC Checker:</span> 
                  <span className="text-slate-500">{selectedRecord.qcCheckerName}</span>
                </p>
              </div>

              {/* Footer text */}
              <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
                 <p className="text-[16px] text-slate-400 font-medium italic text-center">
                    This is an automated evaluation report generated by the Quality Evaluator Pro System. <br/>
                    Please contact your Manager/TL for coaching session if required.
                 </p>
                 <div className="flex items-center gap-3 px-6 py-2 bg-slate-50 rounded-full border border-slate-100">
                    <i className="bi bi-shield-check text-emerald-500"></i>
                    <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Evaluation Verified</span>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
