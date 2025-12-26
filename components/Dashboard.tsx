
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

const PIE_COLORS = [
  '#4f46e5', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

const Dashboard: React.FC<DashboardProps> = ({ user, records }) => {
  // Calculate dynamic default date range (Last 30 days)
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({
    start: thirtyDaysAgo,
    end: today
  });
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [projectFocus, setProjectFocus] = useState('All Operations');

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const isWithinDate = record.date >= dateRange.start && record.date <= dateRange.end;
      const isSelectedAgent = selectedAgents.length === 0 || selectedAgents.includes(record.agentName);
      const isAgentView = user.role === 'AGENT' ? record.agentName === user.name : true;
      const isProjectMatch = projectFocus === 'All Operations' || record.projectName === projectFocus;
      return isWithinDate && isSelectedAgent && isAgentView && isProjectMatch;
    });
  }, [records, dateRange, selectedAgents, user, projectFocus]);

  const stats = useMemo(() => {
    const regRecords = filteredRecords.filter(r => !r.noWork);
    const rewRecords = filteredRecords.filter(r => r.reworkScore !== undefined && !r.noWork);
    
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

  const trendData = useMemo(() => {
    const dates = Array.from(new Set(filteredRecords.map(r => r.date))).sort();
    return dates.map(date => {
      const dateRecs = filteredRecords.filter(r => r.date === date);
      const result: any = { date };
      ['12 PM', '4 PM', '6 PM'].forEach(slot => {
        const slotRecs = dateRecs.filter(r => r.timeSlot === slot);
        const regRecs = slotRecs.filter(r => !r.noWork);
        const rewRecs = slotRecs.filter(r => r.reworkScore !== undefined);
        
        result[slot] = regRecs.length ? regRecs.reduce((a, b) => a + b.score, 0) / regRecs.length : null;
        result[`${slot} Rework`] = rewRecs.length ? rewRecs.reduce((a, b) => a + (b.reworkScore || 0), 0) / rewRecs.length : null;
      });
      return result;
    });
  }, [filteredRecords]);

  const projectSlotData = useMemo(() => {
    return PROJECTS.map(proj => {
      const projRecs = filteredRecords.filter(r => r.projectName === proj && !r.noWork);
      const result: any = { name: proj };
      ['12 PM', '4 PM', '6 PM'].forEach(slot => {
        const slotRecs = projRecs.filter(r => r.timeSlot === slot);
        result[slot] = slotRecs.length ? slotRecs.reduce((a, b) => a + b.score, 0) / slotRecs.length : 0;
      });
      return result;
    }).filter(d => d['12 PM'] || d['4 PM'] || d['6 PM']);
  }, [filteredRecords]);

  const reworkSlotData = useMemo(() => {
    return PROJECTS.map(proj => {
      const projRecs = filteredRecords.filter(r => r.projectName === proj && r.reworkScore !== undefined);
      const result: any = { name: proj };
      ['12 PM', '4 PM', '6 PM'].forEach(slot => {
        const slotRecs = projRecs.filter(r => r.timeSlot === slot);
        result[slot] = slotRecs.length ? slotRecs.reduce((a, b) => a + (b.reworkScore || 0), 0) / slotRecs.length : 0;
      });
      return result;
    }).filter(d => d['12 PM'] || d['4 PM'] || d['6 PM']);
  }, [filteredRecords]);

  const distributionData = useMemo(() => {
    return PROJECTS.map(proj => {
      const projAgents = Array.from(new Set(filteredRecords.filter(r => r.projectName === proj).map(r => r.agentName)));
      return { name: proj, value: projAgents.length, agents: projAgents };
    }).filter(d => d.value > 0);
  }, [filteredRecords]);

  const resetFilters = () => {
    setSelectedAgents([]);
    setProjectFocus('All Operations');
    setDateRange({ start: thirtyDaysAgo, end: today });
  };

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6]">
      <div className="w-full h-11 bg-white border-b border-gray-200 flex items-center justify-center relative shadow-sm shrink-0">
        <span className="text-[17px] font-normal text-black">QC Evaluation Tool Pro</span>
        <div className="absolute right-4 flex items-center gap-4 text-[16px] text-black font-bold">
           <button className="flex items-center gap-1"><i className="bi bi-display"></i> Device</button>
           <button onClick={() => window.location.reload()}><i className="bi bi-arrow-clockwise"></i></button>
           <button><i className="bi bi-arrows-angle-expand"></i></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Slicer Section */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-end justify-between">
          <div className="flex items-center gap-6">
            <div className="space-y-2">
              <label className="text-[15px] font-bold text-black uppercase tracking-widest ml-1">QC Performance Slicer</label>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[16px] font-normal text-black min-w-[180px]">
                    <i className="bi bi-person-fill text-[#4f46e5]"></i> 
                    {selectedAgents.length === 0 ? 'All Active Agents' : `${selectedAgents.length} Agents Selected`}
                    <i className="bi bi-chevron-down ml-auto text-black font-bold"></i>
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-30 hidden group-hover:block max-h-48 overflow-y-auto custom-scrollbar">
                     {AGENTS.map(a => (
                       <label key={a} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-[16px] font-normal text-black">
                         <input type="checkbox" checked={selectedAgents.includes(a)} onChange={() => setSelectedAgents(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])} className="rounded" />
                         {a}
                       </label>
                     ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-bold text-black">
                  <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="bg-transparent outline-none" />
                  <span className="text-black">→</span>
                  <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="bg-transparent outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
             <label className="block text-right text-[15px] font-bold text-black uppercase tracking-widest mr-1">Project Focus</label>
             <div className="flex gap-3">
                <select value={projectFocus} onChange={e => setProjectFocus(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[16px] font-normal text-black outline-none">
                  <option>All Operations</option>
                  {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={resetFilters} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[14px] font-bold uppercase tracking-widest border border-rose-100 hover:bg-rose-100">Reset</button>
             </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-dashed border-slate-300">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                <i className="bi bi-clipboard-x text-[40px]"></i>
             </div>
             <h3 className="text-[22px] font-black text-slate-400 uppercase tracking-widest">No Records Found</h3>
             <p className="text-slate-400 mt-2">Adjust your date slicer or filters to see your productivity records.</p>
             <button onClick={resetFilters} className="mt-8 px-8 py-3 bg-[#4f46e5] text-white rounded-xl font-bold uppercase tracking-widest text-[14px] shadow-lg shadow-indigo-500/20">Reset Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard title="REGULAR AVG" value={`${stats.regAvg.toFixed(1)}%`} icon="bi-activity" color="border-l-[#4f46e5]" />
              <KPICard title="REWORK AVG" value={`${stats.rewAvg.toFixed(1)}%`} icon="bi-arrow-repeat" color="border-l-[#10b981]" />
              <KPICard title="PROJECTS" value={stats.activeProjects} icon="bi-layers-fill" color="border-l-[#ef4444]" />
              <KPICard title="ACTIVE SELECTION" value={stats.activeSelection} icon="bi-person-check-fill" color="border-l-[#f59e0b]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartBox title="TIME SLOT TRENDS (REGULAR)" icon="bi-graph-up">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" fontSize={15} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} fontSize={15} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line connectNulls type="monotone" dataKey="12 PM" stroke={LEGEND_COLORS['12 PM']} strokeWidth={3} dot={{ r: 4, fill: '#fff' }} />
                      <Line connectNulls type="monotone" dataKey="4 PM" stroke={LEGEND_COLORS['4 PM']} strokeWidth={3} dot={{ r: 4, fill: '#fff' }} />
                      <Line connectNulls type="monotone" dataKey="6 PM" stroke={LEGEND_COLORS['6 PM']} strokeWidth={3} dot={{ r: 4, fill: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Legend />
              </ChartBox>

              <ChartBox title="TIME SLOT TRENDS (REWORK)" icon="bi-arrow-repeat">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" fontSize={15} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} fontSize={15} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line connectNulls type="monotone" dataKey="12 PM Rework" stroke={LEGEND_COLORS['12 PM']} strokeWidth={3} dot={{ r: 4, fill: '#fff' }} />
                      <Line connectNulls type="monotone" dataKey="4 PM Rework" stroke={LEGEND_COLORS['4 PM']} strokeWidth={3} dot={{ r: 4, fill: '#fff' }} />
                      <Line connectNulls type="monotone" dataKey="6 PM Rework" stroke={LEGEND_COLORS['6 PM']} strokeWidth={3} dot={{ r: 4, fill: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Legend />
              </ChartBox>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartBox title="PROJECT QC AVG PER SLOT" icon="bi-bar-chart-line">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectSlotData} layout="vertical" margin={{ left: 30, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} fontSize={15} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" fontSize={15} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="12 PM" fill={LEGEND_COLORS['12 PM']} radius={[0, 4, 4, 0]} barSize={25} />
                      <Bar dataKey="4 PM" fill={LEGEND_COLORS['4 PM']} radius={[0, 4, 4, 0]} barSize={25} />
                      <Bar dataKey="6 PM" fill={LEGEND_COLORS['6 PM']} radius={[0, 4, 4, 0]} barSize={25} />
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
                      <XAxis type="number" domain={[0, 100]} fontSize={15} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" fontSize={15} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="12 PM" fill={LEGEND_COLORS['12 PM']} radius={[0, 4, 4, 0]} barSize={25} />
                      <Bar dataKey="4 PM" fill={LEGEND_COLORS['4 PM']} radius={[0, 4, 4, 0]} barSize={25} />
                      <Bar dataKey="6 PM" fill={LEGEND_COLORS['6 PM']} radius={[0, 4, 4, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Legend />
              </ChartBox>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-2">
                   <i className="bi bi-calendar-check text-[#4f46e5]"></i>
                   <h3 className="text-[15px] font-bold uppercase tracking-[0.2em] text-black">Performance & Productivity Summary</h3>
                 </div>
                 <span className="text-[14px] font-bold uppercase bg-slate-100 px-2 py-1 rounded text-black">{filteredRecords.length} Grouped Entries</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left bg-slate-50/30">
                      <th className="py-4 text-[14px] font-bold text-black uppercase tracking-widest px-6 rounded-l-xl">Date</th>
                      <th className="py-4 text-[14px] font-bold text-black uppercase tracking-widest px-6">Agent Name</th>
                      <th className="py-4 text-[14px] font-bold text-black uppercase tracking-widest px-6">Project</th>
                      <th className="py-4 text-[14px] font-bold text-black uppercase tracking-widest px-6">Submissions</th>
                      <th className="py-4 text-right text-[14px] font-bold text-black uppercase tracking-widest px-6">Regular QC Score</th>
                      <th className="py-4 text-right text-[14px] font-bold text-black uppercase tracking-widest px-6 rounded-r-xl">Rework QC Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRecords.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-5 text-[16px] font-bold text-black px-6">{r.date}</td>
                        <td className="py-5 text-[16px] font-normal text-black px-6">{r.agentName}</td>
                        <td className="py-5 px-6">
                           <span className="text-[14px] font-bold bg-indigo-50 text-[#4f46e5] px-3 py-1 rounded-md uppercase tracking-tighter">{r.projectName}</span>
                        </td>
                        <td className="py-5 text-center px-6">
                          <span className="bg-slate-50 text-black font-bold px-2 py-0.5 rounded text-[15px]">1</span>
                        </td>
                        <td className="py-5 text-right px-6">
                          <span className={`text-[17px] font-normal ${r.score < 90 ? 'text-[#ef4444]' : 'text-black'}`}>{r.score}%</span>
                        </td>
                        <td className="py-5 text-right px-6">
                          <span className="text-[17px] font-normal text-[#10b981]">{r.reworkScore !== undefined ? `${r.reworkScore}%` : '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-10">
                 <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                 <h3 className="text-[15px] font-bold uppercase tracking-widest text-black">Active Agent Distribution per Project</h3>
              </div>
              
              <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="w-[340px] h-[340px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distributionData} innerRadius={85} outerRadius={125} paddingAngle={8} dataKey="value">
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     {distributionData.length > 0 && (
                       <span className="text-[17px] font-bold text-[#4f46e5] uppercase tracking-tighter text-center px-4">
                         Project Split
                       </span>
                     )}
                  </div>
                </div>

                <div className="flex-1 w-full">
                   <div className="border border-slate-100 rounded-3xl overflow-hidden">
                     <table className="w-full text-[16px]">
                       <thead>
                          <tr className="text-left bg-slate-50/50">
                            <th className="px-8 py-5 font-bold text-black uppercase tracking-widest text-[14px]">Project Name</th>
                            <th className="px-8 py-5 font-bold text-black uppercase tracking-widest text-center text-[14px]">Active Agents</th>
                            <th className="px-8 py-5 font-bold text-black uppercase tracking-widest text-right text-[14px]">Agent Names</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {distributionData.map((d, i) => (
                           <tr key={i} className="group hover:bg-slate-50/20 transition-colors">
                             <td className="px-8 py-6 font-normal text-black">
                                <div className="flex items-center gap-3">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                                  {d.name}
                                </div>
                             </td>
                             <td className="px-8 py-6 text-center">
                                <span className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg font-normal text-black text-[15px]">{d.value}</span>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <div className="flex flex-wrap justify-end gap-2">
                                   {d.agents.map(name => (
                                     <span key={name} className="bg-indigo-50/50 text-[#4f46e5] px-3 py-1 rounded-md text-[14px] font-normal uppercase tracking-tighter">{name}</span>
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
          </>
        )}
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
  <div className={`bg-white p-7 rounded-[2.2rem] border-l-[6px] ${color} shadow-sm flex items-center justify-between hover:shadow-xl transition-all duration-300 group`}>
    <div>
      <h4 className="text-[14px] font-bold text-black uppercase tracking-[0.2em] mb-1.5">{title}</h4>
      <p className="text-[41px] font-normal text-black tracking-tighter">{value}</p>
    </div>
    <div className="w-13 h-13 bg-slate-50 rounded-2xl flex items-center justify-center text-[#4f46e5] text-[25px] group-hover:bg-[#4f46e5] group-hover:text-white transition-colors duration-300">
      <i className={`bi ${icon}`}></i>
    </div>
  </div>
);

const ChartBox = ({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col">
    <div className="flex items-center gap-2.5 mb-10">
      <i className={`bi ${icon} text-[#4f46e5] text-[23px]`}></i>
      <h3 className="text-[15px] font-bold uppercase tracking-[0.2em] text-black">{title}</h3>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const Legend = () => (
  <div className="flex items-center justify-center gap-8 mt-10">
    {Object.entries(LEGEND_COLORS).map(([label, color]) => (
      <div key={label} className="flex items-center gap-2.5">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-[15px] font-bold text-black uppercase tracking-widest">{label}</span>
      </div>
    ))}
  </div>
);

export default Dashboard;
