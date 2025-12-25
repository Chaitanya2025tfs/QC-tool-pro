
import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { QCRecord, User } from '../types';
import { AGENTS, PROJECTS } from '../constants';

interface DashboardProps {
  user: User;
  records: QCRecord[];
}

const LEGEND_COLORS: Record<string, string> = {
  '12 PM': '#4f46e5',
  '4 PM': '#f59e0b',
  '6 PM': '#334155'
};

const Dashboard: React.FC<DashboardProps> = ({ user, records }) => {
  const [dateRange, setDateRange] = useState({
    start: '2025-12-19',
    end: '2025-12-25'
  });
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [projectFocus, setProjectFocus] = useState('All Operations');

  // Filtering Logic
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const isWithinDate = record.date >= dateRange.start && record.date <= dateRange.end;
      const isSelectedAgent = selectedAgents.length === 0 || selectedAgents.includes(record.agentName);
      const isAgentView = user.role === 'AGENT' ? record.agentName === user.name : true;
      const isProjectMatch = projectFocus === 'All Operations' || record.projectName === projectFocus;
      return isWithinDate && isSelectedAgent && isAgentView && isProjectMatch;
    });
  }, [records, dateRange, selectedAgents, user, projectFocus]);

  // KPI Stats
  const stats = useMemo(() => {
    const regRecords = filteredRecords.filter(r => !r.isRework && !r.noWork);
    const rewRecords = filteredRecords.filter(r => r.isRework && !r.noWork);
    
    const regAvg = regRecords.length > 0 
      ? regRecords.reduce((acc, r) => acc + r.score, 0) / regRecords.length 
      : 0;
    
    const rewAvg = rewRecords.length > 0
      ? rewRecords.reduce((acc, r) => acc + (r.reworkScore || 0), 0) / rewRecords.length
      : 0;

    const activeProjects = new Set(filteredRecords.map(r => r.projectName)).size;
    const activeSelection = new Set(filteredRecords.map(r => r.agentName)).size;

    return { regAvg, rewAvg, activeProjects, activeSelection };
  }, [filteredRecords]);

  // Chart Data: Project Performance Per Slot
  const projectSlotData = useMemo(() => {
    const data: any[] = [];
    PROJECTS.forEach(proj => {
      const projRecs = filteredRecords.filter(r => r.projectName === proj);
      if (projRecs.length > 0) {
        data.push({
          name: proj,
          '12 PM': projRecs.filter(r => r.timeSlot === '12 PM' && !r.isRework).reduce((a, b) => a + b.score, 0) / (projRecs.filter(r => r.timeSlot === '12 PM' && !r.isRework).length || 1),
          '4 PM': projRecs.filter(r => r.timeSlot === '4 PM' && !r.isRework).reduce((a, b) => a + b.score, 0) / (projRecs.filter(r => r.timeSlot === '4 PM' && !r.isRework).length || 1),
          '6 PM': projRecs.filter(r => r.timeSlot === '6 PM' && !r.isRework).reduce((a, b) => a + b.score, 0) / (projRecs.filter(r => r.timeSlot === '6 PM' && !r.isRework).length || 1),
        });
      }
    });
    return data;
  }, [filteredRecords]);

  // Chart Data: Rework Performance Per Slot
  const reworkSlotData = useMemo(() => {
    const data: any[] = [];
    PROJECTS.forEach(proj => {
      const projRecs = filteredRecords.filter(r => r.projectName === proj);
      if (projRecs.length > 0) {
        data.push({
          name: proj,
          '12 PM': projRecs.filter(r => r.timeSlot === '12 PM' && r.isRework).reduce((a, b) => a + (b.reworkScore || 0), 0) / (projRecs.filter(r => r.timeSlot === '12 PM' && r.isRework).length || 1),
          '4 PM': projRecs.filter(r => r.timeSlot === '4 PM' && r.isRework).reduce((a, b) => a + (b.reworkScore || 0), 0) / (projRecs.filter(r => r.timeSlot === '4 PM' && r.isRework).length || 1),
          '6 PM': projRecs.filter(r => r.timeSlot === '6 PM' && r.isRework).reduce((a, b) => a + (b.reworkScore || 0), 0) / (projRecs.filter(r => r.timeSlot === '6 PM' && r.isRework).length || 1),
        });
      }
    });
    return data;
  }, [filteredRecords]);

  // Pie Data
  const distributionData = useMemo(() => {
    return PROJECTS.map(proj => {
      const projAgents = Array.from(new Set(filteredRecords.filter(r => r.projectName === proj).map(r => r.agentName)));
      return {
        name: proj,
        value: projAgents.length,
        agents: projAgents
      };
    }).filter(d => d.value > 0);
  }, [filteredRecords]);

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6]">
      {/* Top Bar matching screenshots */}
      <div className="w-full h-11 bg-white border-b border-gray-200 flex items-center justify-center relative shadow-sm shrink-0">
        <span className="text-[12px] font-medium text-slate-700">QC Evaluation Tool Pro</span>
        <div className="absolute right-4 flex items-center gap-4 text-[11px] text-slate-500">
           <button className="flex items-center gap-1"><i className="bi bi-display"></i> Device</button>
           <button><i className="bi bi-arrow-clockwise"></i></button>
           <button><i className="bi bi-arrows-angle-expand"></i></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Slicer Section */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-end justify-between">
          <div className="flex items-center gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">QC Performance Slicer</label>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 min-w-[180px]">
                    <i className="bi bi-person-fill text-[#4f46e5]"></i> 
                    {selectedAgents.length === 0 ? 'All Active Agents' : `${selectedAgents.length} Agents Selected`}
                    <i className="bi bi-chevron-down ml-auto text-slate-400"></i>
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-30 hidden group-hover:block">
                     <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-[12px]">
                       <input type="checkbox" checked={selectedAgents.length === AGENTS.length} onChange={() => setSelectedAgents(selectedAgents.length === AGENTS.length ? [] : [...AGENTS])} />
                       Select All
                     </label>
                     {AGENTS.map(a => (
                       <label key={a} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-[12px]">
                         <input type="checkbox" checked={selectedAgents.includes(a)} onChange={() => setSelectedAgents(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])} />
                         {a}
                       </label>
                     ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600">
                  <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="bg-transparent outline-none" />
                  <span className="text-slate-300">→</span>
                  <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="bg-transparent outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
             <label className="block text-right text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Project Focus</label>
             <select 
               value={projectFocus} 
               onChange={e => setProjectFocus(e.target.value)}
               className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 outline-none"
             >
               <option>All Operations</option>
               {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="REGULAR AVG" value={`${stats.regAvg.toFixed(1)}%`} icon="bi-activity" color="border-l-[#4f46e5]" />
          <KPICard title="REWORK AVG" value={`${stats.rewAvg.toFixed(1)}%`} icon="bi-arrow-repeat" color="border-l-[#10b981]" />
          <KPICard title="PROJECTS" value={stats.activeProjects} icon="bi-layers-fill" color="border-l-[#ef4444]" />
          <KPICard title="ACTIVE SELECTION" value={stats.activeSelection} icon="bi-person-check-fill" color="border-l-[#f59e0b]" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartBox title="PROJECT QC AVG PER SLOT" icon="bi-bar-chart-line">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectSlotData} layout="vertical" margin={{ left: 30, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="12 PM" fill={LEGEND_COLORS['12 PM']} radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="4 PM" fill={LEGEND_COLORS['4 PM']} radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="6 PM" fill={LEGEND_COLORS['6 PM']} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Legend />
          </ChartBox>

          <ChartBox title="REWORK PERFORMANCE PER SLOT" icon="bi-bar-chart-steps">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reworkSlotData} layout="vertical" margin={{ left: 30, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="12 PM" fill={LEGEND_COLORS['12 PM']} radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="4 PM" fill={LEGEND_COLORS['4 PM']} radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="6 PM" fill={LEGEND_COLORS['6 PM']} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Legend />
          </ChartBox>
        </div>

        {/* Productivity Summary Table */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-2">
               <i className="bi bi-calendar-check text-[#4f46e5]"></i>
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Performance & Productivity Summary</h3>
             </div>
             <span className="text-[9px] font-black uppercase bg-slate-100 px-2 py-1 rounded text-slate-500">{filteredRecords.length} Grouped Entries</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest px-4">Date</th>
                  <th className="pb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest px-4">Agent Name</th>
                  <th className="pb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest px-4">Project</th>
                  <th className="pb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest px-4">Submissions</th>
                  <th className="pb-4 text-right text-[10px] font-black text-slate-300 uppercase tracking-widest px-4">Regular QC Score</th>
                  <th className="pb-4 text-right text-[10px] font-black text-slate-300 uppercase tracking-widest px-4">Rework QC Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 text-[11px] font-bold text-slate-500 px-4">{r.date}</td>
                    <td className="py-4 text-[11px] font-black text-slate-700 px-4">{r.agentName}</td>
                    <td className="py-4 px-4">
                       <span className="text-[9px] font-black bg-indigo-50 text-[#4f46e5] px-3 py-1 rounded-md uppercase">{r.projectName}</span>
                    </td>
                    <td className="py-4 text-[11px] font-bold text-slate-600 px-4">1</td>
                    <td className="py-4 text-right px-4">
                      <span className={`text-[12px] font-black ${r.score < 90 ? 'text-red-500' : 'text-green-500'}`}>{r.score}%</span>
                    </td>
                    <td className="py-4 text-right px-4">
                      <span className="text-[12px] font-black text-green-500">{r.reworkScore ? `${r.reworkScore}%` : '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribution Row */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-10">
             <div className="w-2 h-2 rounded-full bg-orange-500"></div>
             <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Active Agent Distribution per Project</h3>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="w-[300px] h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={LEGEND_COLORS['12 PM']} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 {distributionData.length > 0 && (
                   <span className="text-[11px] font-bold text-slate-400 uppercase">{distributionData[0].name} (100%)</span>
                 )}
              </div>
            </div>

            <div className="flex-1 w-full overflow-hidden">
               <table className="w-full text-[11px]">
                 <thead>
                    <tr className="text-left bg-slate-50">
                      <th className="px-6 py-4 font-black text-slate-300 uppercase tracking-widest rounded-l-2xl">Project Name</th>
                      <th className="px-6 py-4 font-black text-slate-300 uppercase tracking-widest text-center">Active Agents</th>
                      <th className="px-6 py-4 font-black text-slate-300 uppercase tracking-widest text-right rounded-r-2xl">Agent Names</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {distributionData.map((d, i) => (
                     <tr key={i}>
                       <td className="px-6 py-6 font-bold text-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#4f46e5]"></span>
                            {d.name}
                          </div>
                       </td>
                       <td className="px-6 py-6 text-center">
                          <span className="bg-slate-100 px-3 py-1 rounded-lg font-black text-slate-600">{d.value}</span>
                       </td>
                       <td className="px-6 py-6 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                             {d.agents.map(name => (
                               <span key={name} className="bg-indigo-50 text-[#4f46e5] px-3 py-1 rounded-md text-[9px] font-black uppercase">{name}</span>
                             ))}
                          </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
  <div className={`bg-white p-6 rounded-[2rem] border-l-[6px] ${color} shadow-sm flex items-center justify-between hover:shadow-lg transition-all`}>
    <div>
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
      <p className="text-4xl font-black text-[#1a2138] tracking-tighter">{value}</p>
    </div>
    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#4f46e5] text-lg">
      <i className={`bi ${icon}`}></i>
    </div>
  </div>
);

const ChartBox = ({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
    <div className="flex items-center gap-2 mb-8">
      <i className={`bi ${icon} text-[#4f46e5]`}></i>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
    </div>
    {children}
  </div>
);

const Legend = () => (
  <div className="flex items-center justify-center gap-6 mt-6">
    {Object.entries(LEGEND_COLORS).map(([label, color]) => (
      <div key={label} className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
    ))}
  </div>
);

export default Dashboard;
