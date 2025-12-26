
import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { QCRecord, User } from '../types';
import { AGENTS, PROJECTS, TIME_SLOTS } from '../constants';

interface DashboardProps {
  user: User;
  records: QCRecord[];
}

const COLORS = {
  regular: '#6366f1',
  rework: '#10b981',
  projects: '#f43f5e',
  selection: '#f59e0b',
  slots: {
    '12 PM': '#6366f1',
    '4 PM': '#f59e0b',
    '6 PM': '#334155'
  },
  pie: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899']
};

const KPICard = ({ title, value, color, icon }: { title: string, value: string | number, color: string, icon: string }) => {
  return (
    <div className="bg-white p-5 rounded-[1.25rem] border border-slate-100 shadow-[0_5px_20px_-5px_rgba(0,0,0,0.03)] flex items-center justify-between group hover:shadow-lg transition-all duration-300 relative overflow-hidden h-24">
      <div className={`absolute left-0 top-0 w-1 h-full`} style={{ backgroundColor: color }}></div>
      <div className="flex flex-col gap-0.5">
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>
        <p className="text-[28px] font-black text-[#1a2138] tracking-tighter leading-none">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: `${color}15`, color: color }}>
         <i className={`bi ${icon} text-[18px]`}></i>
      </div>
    </div>
  );
};

const ChartBox = ({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.02)] flex flex-col h-[340px]">
    <div className="flex items-center gap-2 mb-6">
      <i className={`bi ${icon} text-[#4f46e5] text-[16px]`}></i>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a2138]">{title}</h3>
    </div>
    <div className="flex-1 w-full">{children}</div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user, records }) => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedAgent, setSelectedAgent] = useState('All Active Agents');
  const [selectedProject, setSelectedProject] = useState('All Operations');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchAgent = selectedAgent === 'All Active Agents' || r.agentName === selectedAgent;
      const matchProject = selectedProject === 'All Operations' || r.projectName === selectedProject;
      const matchRole = user.role === 'AGENT' ? r.agentName === user.name : true;
      const matchDate = r.date >= startDate && r.date <= endDate;
      return matchAgent && matchProject && matchRole && matchDate;
    });
  }, [records, selectedAgent, selectedProject, user, startDate, endDate]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return { regAvg: 0, rewAvg: 0, projects: 0, agents: 0 };
    const reg = filtered.filter(r => !r.isRework && !r.noWork);
    const rew = filtered.filter(r => r.isRework);
    const regAvg = reg.length ? reg.reduce((a, b) => a + b.score, 0) / reg.length : 0;
    const rewAvg = rew.length ? rew.reduce((a, b) => a + (b.reworkScore || b.score), 0) / rew.length : 0;
    return {
      regAvg,
      rewAvg,
      projects: new Set(filtered.map(r => r.projectName)).size,
      agents: new Set(filtered.map(r => r.agentName)).size
    };
  }, [filtered]);

  // Table 1: Performance & Productivity Summary (Grouped)
  const groupedSummary = useMemo(() => {
    const map = new Map();
    filtered.forEach(r => {
      const key = `${r.date}-${r.agentName}-${r.projectName}`;
      if (!map.has(key)) {
        map.set(key, { 
          date: r.date, 
          agentName: r.agentName, 
          projectName: r.projectName, 
          submissions: 0, 
          regScores: [] as number[], 
          rewScores: [] as number[] 
        });
      }
      const item = map.get(key);
      item.submissions += 1;
      if (r.isRework) item.rewScores.push(r.reworkScore || r.score);
      else if (!r.noWork) item.regScores.push(r.score);
    });
    return Array.from(map.values()).map(item => ({
      ...item,
      regAvg: item.regScores.length ? Math.round(item.regScores.reduce((a:number, b:number)=>a+b, 0)/item.regScores.length) : '-',
      rewAvg: item.rewScores.length ? Math.round(item.rewScores.reduce((a:number, b:number)=>a+b, 0)/item.rewScores.length) : '-'
    })).sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered]);

  // Distribution Data
  const pieData = useMemo(() => {
    return PROJECTS.map(p => {
      const activeOnProject = Array.from(new Set(filtered.filter(r => r.projectName === p).map(r => r.agentName)));
      return { name: p, value: activeOnProject.length };
    }).filter(d => d.value > 0);
  }, [filtered]);

  // Trends Data
  const trendData = useMemo(() => {
    if (filtered.length === 0) return [];
    const dates = Array.from(new Set(filtered.map(r => r.date))).sort().slice(-7);
    return dates.map(d => {
      const dayRecs = filtered.filter(r => r.date === d);
      const entry: any = { date: d };
      TIME_SLOTS.forEach(slot => {
        const regularRecs = dayRecs.filter(r => r.timeSlot === slot && !r.isRework && !r.noWork);
        entry[slot] = regularRecs.length ? Math.round(regularRecs.reduce((a, b) => a + b.score, 0) / regularRecs.length) : null;
        const reworkRecs = dayRecs.filter(r => r.timeSlot === slot && r.isRework);
        entry[`${slot}_rew`] = reworkRecs.length ? Math.round(reworkRecs.reduce((a, b) => a + (b.reworkScore || b.score), 0) / reworkRecs.length) : null;
      });
      return entry;
    });
  }, [filtered]);

  const barData = useMemo(() => {
    return PROJECTS.map(p => {
      const pRecs = filtered.filter(r => r.projectName === p);
      const reg = pRecs.filter(r => !r.isRework && !r.noWork);
      const rew = pRecs.filter(r => r.isRework);
      return {
        name: p,
        reg: reg.length ? Math.round(reg.reduce((a,b)=>a+b.score,0)/reg.length) : 0,
        rew: rew.length ? Math.round(rew.reduce((a,b)=>a+(b.reworkScore||b.score),0)/rew.length) : 0
      };
    });
  }, [filtered]);

  const EmptyState = ({ message = "No Data Available" }) => (
    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
      <i className="bi bi-bar-chart text-[32px] opacity-20"></i>
      <span className="text-[10px] font-black uppercase tracking-widest">{message}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Slicer Bar */}
      <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex flex-col lg:flex-row items-center gap-6 w-full lg:w-auto">
          <div className="space-y-1 w-full lg:w-56">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">QC PERFORMANCE SLICER</span>
            <div className="relative">
               <i className="bi bi-person absolute left-3 top-1/2 -translate-y-1/2 text-[#6366f1] text-[14px]"></i>
               <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="w-full pl-9 pr-7 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[12px] font-bold text-[#1a2138] outline-none appearance-none cursor-pointer">
                <option>All Active Agents</option>
                {AGENTS.map(a => <option key={a}>{a}</option>)}
              </select>
              <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
            </div>
          </div>
          
          {/* Active Date Range Picker Container */}
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg shadow-inner">
             <div className="flex items-center gap-2 group cursor-pointer relative">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <span className="text-[12px] font-black text-slate-700 min-w-[70px] text-center">
                  {new Date(startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </span>
                <i className="bi bi-calendar3 text-slate-300 group-hover:text-indigo-500 transition-colors"></i>
             </div>
             
             <span className="text-slate-300 font-normal select-none">→</span>
             
             <div className="flex items-center gap-2 group cursor-pointer relative">
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <span className="text-[12px] font-black text-slate-700 min-w-[70px] text-center">
                   {new Date(endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </span>
                <i className="bi bi-calendar3 text-slate-300 group-hover:text-indigo-500 transition-colors"></i>
             </div>
          </div>
        </div>
        
        <div className="space-y-1 w-full lg:w-56">
           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">PROJECT FOCUS</span>
           <div className="relative">
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[12px] font-bold text-[#1a2138] outline-none appearance-none cursor-pointer">
                <option>All Operations</option>
                {PROJECTS.map(p => <option key={p}>{p}</option>)}
              </select>
              <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
           </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard title="REGULAR AVG" value={`${stats.regAvg.toFixed(1)}%`} color={COLORS.regular} icon="bi-activity" />
        <KPICard title="REWORK AVG" value={`${stats.rewAvg.toFixed(1)}%`} color={COLORS.rework} icon="bi-arrow-repeat" />
        <KPICard title="PROJECTS" value={stats.projects} color={COLORS.projects} icon="bi-stack" />
        <KPICard title="ACTIVE SELECTION" value={stats.agents} color={COLORS.selection} icon="bi-person-check" />
      </div>

      {/* 4 Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBox title="TIME SLOT TRENDS (REGULAR)" icon="bi-graph-up-arrow">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={9} dy={6} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} fontSize={9} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', fontSize: '11px' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '9px', paddingBottom: '10px' }} />
                <Line type="monotone" name="12 PM" dataKey="12 PM" stroke={COLORS.slots['12 PM']} strokeWidth={2} dot={{ r: 3, fill: 'white', stroke: COLORS.slots['12 PM'], strokeWidth: 2 }} connectNulls />
                <Line type="monotone" name="4 PM" dataKey="4 PM" stroke={COLORS.slots['4 PM']} strokeWidth={2} dot={{ r: 3, fill: 'white', stroke: COLORS.slots['4 PM'], strokeWidth: 2 }} connectNulls />
                <Line type="monotone" name="6 PM" dataKey="6 PM" stroke={COLORS.slots['6 PM']} strokeWidth={2} dot={{ r: 3, fill: 'white', stroke: COLORS.slots['6 PM'], strokeWidth: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartBox>

        <ChartBox title="TIME SLOT TRENDS (REWORK)" icon="bi-arrow-repeat">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={9} dy={6} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} fontSize={9} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', fontSize: '11px' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '9px', paddingBottom: '10px' }} />
                <Line type="monotone" name="12 PM" dataKey="12 PM_rew" stroke={COLORS.slots['12 PM']} strokeWidth={2} dot={{ r: 3, fill: 'white', stroke: COLORS.slots['12 PM'], strokeWidth: 2 }} connectNulls />
                <Line type="monotone" name="4 PM" dataKey="4 PM_rew" stroke={COLORS.slots['4 PM']} strokeWidth={2} dot={{ r: 3, fill: 'white', stroke: COLORS.slots['4 PM'], strokeWidth: 2 }} connectNulls />
                <Line type="monotone" name="6 PM" dataKey="6 PM_rew" stroke={COLORS.slots['6 PM']} strokeWidth={2} dot={{ r: 3, fill: 'white', stroke: COLORS.slots['6 PM'], strokeWidth: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartBox>

        <ChartBox title="PROJECT QC AVG PER SLOT" icon="bi-bar-chart-fill">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} fontSize={9} stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} fontSize={9} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', fontSize: '11px' }} />
                <Bar dataKey="reg" name="Regular" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartBox>

        <ChartBox title="REWORK PERFORMANCE PER SLOT" icon="bi-arrow-repeat">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} fontSize={9} stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} fontSize={9} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', fontSize: '11px' }} />
                <Bar dataKey="rew" name="Rework" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartBox>
      </div>

      {/* Summary Table: Performance & Productivity Summary */}
      <div className="bg-white p-7 rounded-[1.5rem] border border-slate-100 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.02)] min-h-[300px]">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2">
             <i className="bi bi-calendar-check text-[#4f46e5] text-[16px]"></i>
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a2138]">PERFORMANCE & PRODUCTIVITY SUMMARY</h3>
           </div>
           <span className="text-[9px] font-black text-slate-300 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">
             {groupedSummary.length} Grouped Entries
           </span>
        </div>
        
        {groupedSummary.length === 0 ? <EmptyState message="No Summary Data Available" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-slate-400 font-black uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="pb-4 px-3 text-[9px]">Date</th>
                  <th className="pb-4 px-3 text-[9px]">Agent Name</th>
                  <th className="pb-4 px-3 text-[9px]">Project</th>
                  <th className="pb-4 px-3 text-center text-[9px]">Submissions</th>
                  <th className="pb-4 px-3 text-center text-[9px] text-emerald-500">Regular QC Score</th>
                  <th className="pb-4 px-3 text-center text-[9px] text-rose-500">Rework QC Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groupedSummary.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-3 font-medium text-slate-500">{item.date}</td>
                    <td className="py-4 px-3 font-black text-[#1a2138]">{item.agentName}</td>
                    <td className="py-4 px-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md text-[10px] font-black uppercase tracking-tighter">
                        {item.projectName}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 rounded-md text-[11px] font-black text-slate-500">
                        {item.submissions}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center font-black text-emerald-500 text-[13px]">{item.regAvg}{item.regAvg !== '-' ? '%' : ''}</td>
                    <td className="py-4 px-3 text-center font-black text-rose-500 text-[13px]">{item.rewAvg}{item.rewAvg !== '-' ? '%' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Section: Active Agent Distribution Per Project */}
      <div className="bg-white p-7 rounded-[1.5rem] border border-slate-100 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.02)] min-h-[350px]">
        <div className="flex items-center gap-2 mb-8">
           <i className="bi bi-pie-chart-fill text-orange-500 text-[16px]"></i>
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a2138]">ACTIVE AGENT DISTRIBUTION PER PROJECT</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 h-[250px] flex items-center justify-center relative">
             {pieData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={6} dataKey="value">
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             ) : <EmptyState message="No Distribution" />}
             {pieData.length > 0 && (
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[14px] font-black text-indigo-500">{pieData[0]?.name.toLowerCase()} ({Math.round((pieData[0]?.value / stats.agents) * 100)}%)</span>
               </div>
             )}
          </div>
          
          <div className="lg:col-span-7">
             <div className="overflow-x-auto">
               <table className="w-full text-left text-[11px]">
                 <thead>
                    <tr className="text-slate-300 font-black uppercase tracking-widest border-b border-slate-50">
                      <th className="pb-3 px-2">Project Name</th>
                      <th className="pb-3 px-2 text-center">Active Agents</th>
                      <th className="pb-3 px-2">Agent Names</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {PROJECTS.map((p, i) => {
                      const agentsOnProject = Array.from(new Set(filtered.filter(r => r.projectName === p).map(r => r.agentName)));
                      if (agentsOnProject.length === 0) return null;
                      return (
                        <tr key={i}>
                          <td className="py-4 px-2 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.pie[i % COLORS.pie.length] }}></div>
                             <span className="font-black text-[#1a2138]">{p}</span>
                          </td>
                          <td className="py-4 px-2 text-center">
                             <span className="bg-slate-50 px-2 py-0.5 rounded text-slate-500 font-bold">{agentsOnProject.length}</span>
                          </td>
                          <td className="py-4 px-2">
                             <div className="flex flex-wrap gap-1">
                               {agentsOnProject.map(name => (
                                 <span key={name} className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded text-[9px] font-black tracking-tight uppercase">
                                   {name}
                                 </span>
                               ))}
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                    {pieData.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-10 text-center text-slate-300 font-black uppercase tracking-widest italic opacity-50">
                           No Operational Data To Distribute
                        </td>
                      </tr>
                    )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
