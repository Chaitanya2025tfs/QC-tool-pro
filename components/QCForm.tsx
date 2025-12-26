
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QCRecord, User, SampleResult } from '../types';
import { TEAM_LEADERS, QC_CHECKERS, AGENTS, PROJECTS, ALL_ERRORS, TIME_SLOTS } from '../constants';

interface QCFormProps {
  user: User;
  onSave: (record: QCRecord) => void;
  editRecord?: QCRecord;
  onDiscard: () => void;
}

const QCForm: React.FC<QCFormProps> = ({ user, onSave, editRecord, onDiscard }) => {
  const [formData, setFormData] = useState<Partial<QCRecord>>({
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString().split('T')[0],
    timeSlot: '12 PM',
    tlName: TEAM_LEADERS[0],
    agentName: AGENTS[0],
    qcCheckerName: user.name || QC_CHECKERS[0],
    projectName: PROJECTS[0],
    taskName: '',
    score: 100,
    reworkScore: undefined,
    isRework: false,
    notes: '',
    noWork: false,
    manualQC: false,
    manualErrors: [],
    manualFeedback: '',
    samples: [],
    samplingRange: { start: '', end: '' }
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  const mainInfoRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editRecord) {
      setFormData(editRecord);
    }
  }, [editRecord]);

  const calculateSampleScore = (errors: string[]) => {
    let base = 100;
    errors.forEach(errLabel => {
      const err = ALL_ERRORS.find(e => e.label === errLabel);
      if (err) base -= err.deduction;
    });
    return Math.max(0, base);
  };

  const currentFormScore = useMemo(() => {
    if (formData.noWork) return 0;
    const scores = (formData.samples || []).map(s => s.score);
    if (formData.manualQC) scores.push(calculateSampleScore(formData.manualErrors || []));
    
    if (scores.length === 0) return 100;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [formData.samples, formData.manualQC, formData.manualErrors, formData.noWork]);

  const handleToggleSampleError = (sampleIdx: number, errorLabel: string) => {
    const newSamples = [...(formData.samples || [])];
    const sample = { ...newSamples[sampleIdx] };
    
    if (sample.errors.includes(errorLabel)) {
      sample.errors = sample.errors.filter(e => e !== errorLabel);
    } else {
      sample.errors = [...sample.errors, errorLabel];
      sample.isClean = false;
    }
    
    sample.score = calculateSampleScore(sample.errors);
    newSamples[sampleIdx] = sample;
    setFormData({ ...formData, samples: newSamples });
  };

  const handleToggleSampleClean = (sampleIdx: number) => {
    const newSamples = [...(formData.samples || [])];
    const sample = { ...newSamples[sampleIdx] };
    sample.isClean = !sample.isClean;
    if (sample.isClean) {
      sample.errors = [];
      sample.score = 100;
    }
    newSamples[sampleIdx] = sample;
    setFormData({ ...formData, samples: newSamples });
  };

  const generateSampling = () => {
    const { start, end } = formData.samplingRange || { start: '', end: '' };
    if (!start || !end) return;
    
    const startMatch = start.match(/(\d+)$/);
    const endMatch = end.match(/(\d+)$/);
    
    const sNum = parseInt(startMatch ? startMatch[0] : '0');
    const eNum = parseInt(endMatch ? endMatch[0] : '0');
    
    if (isNaN(sNum) || isNaN(eNum)) return;

    const prefixStart = startMatch ? start.substring(0, start.length - startMatch[0].length) : '';
    const range = Math.abs(eNum - sNum) + 1;
    const sampleSize = Math.ceil(range * 0.1);
    const indices = new Set<number>();
    
    const min = Math.min(sNum, eNum);

    while (indices.size < Math.min(sampleSize, range)) {
      indices.add(Math.floor(Math.random() * range) + min);
    }

    const generatedSamples: SampleResult[] = Array.from(indices).sort((a, b) => a - b).map(idx => ({
      sampleId: `${prefixStart}${idx.toString().padStart(2, '0')}`,
      errors: [],
      isClean: true,
      score: 100
    }));

    setFormData({ ...formData, samples: generatedSamples });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};

    if (!formData.taskName) newErrors.taskName = true;
    if (!formData.notes && !formData.noWork) newErrors.notes = true;
    if (!formData.tlName) newErrors.tlName = true;
    if (!formData.agentName) newErrors.agentName = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      if (newErrors.taskName || newErrors.tlName || newErrors.agentName) {
        mainInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.notes) {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    let finalScore = formData.score || 100;
    let finalReworkScore = formData.reworkScore;

    if (formData.isRework) {
      if (editRecord) finalScore = editRecord.score;
      finalReworkScore = currentFormScore;
    } else {
      finalScore = currentFormScore;
      finalReworkScore = undefined;
    }

    const finalRecord = {
      ...formData,
      score: finalScore,
      reworkScore: finalReworkScore,
      createdAt: Date.now(),
    } as QCRecord;
    
    onSave(finalRecord);
  };

  return (
    <div className="w-[85%] mx-auto my-10 bg-white rounded-[1.5rem] shadow-sm border border-slate-300 overflow-hidden font-sans">
      <div className="bg-[#111827] text-white px-10 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-3.5 h-3.5 rounded-full bg-[#10b981]"></div>
          <h2 className="text-[23px] font-normal uppercase tracking-[0.2em] mb-0">Fill Daily Audit</h2>
        </div>
        <span className="text-[16px] font-bold text-black uppercase tracking-widest bg-[#1a2138] px-4 py-2 rounded-full">One Task Per Submission</span>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        <div ref={mainInfoRef} className={`border ${Object.keys(errors).some(k => ['taskName', 'tlName', 'agentName'].includes(k)) ? 'border-rose-400 bg-rose-50/10' : 'border-slate-300'} rounded-[2.5rem] p-12 space-y-12 transition-all duration-300`}>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FormField label="EVALUATION DATE">
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="form-input-audit" />
            </FormField>
            <FormField label="EVALUATION TIME SLOT">
              <select value={formData.timeSlot} onChange={e => setFormData({...formData, timeSlot: e.target.value as any})} className="form-input-audit appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a2138%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1.5rem_center] bg-no-repeat pr-12">
                {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </FormField>
            <FormField label="AGENT NAME">
              <select 
                value={formData.agentName} 
                onChange={e => {
                  setFormData({...formData, agentName: e.target.value});
                  setErrors({...errors, agentName: false});
                }} 
                className={`form-input-audit appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a2138%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1.5rem_center] bg-no-repeat pr-12 ${errors.agentName ? 'border-rose-500 ring-2 ring-rose-500/10' : ''}`}
              >
                <option value="">Choose Agent...</option>
                {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.agentName && <span className="text-[15px] text-rose-500 font-normal uppercase ml-2">Required</span>}
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FormField label="CAMPAIGN PROJECT">
              <select value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="form-input-audit appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a2138%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1.5rem_center] bg-no-repeat pr-12">
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
            <div className="md:col-span-2">
              <FormField label="TASK / FILE NAME">
                <input 
                  type="text" 
                  placeholder="Enter unique task ID or name..." 
                  value={formData.taskName} 
                  onChange={e => {
                    setFormData({...formData, taskName: e.target.value});
                    setErrors({...errors, taskName: false});
                  }} 
                  className={`form-input-audit ${errors.taskName ? 'border-rose-500 ring-2 ring-rose-500/10' : ''}`} 
                />
                {errors.taskName && <span className="text-[15px] text-rose-500 font-normal uppercase ml-2">Task Details are mandatory!</span>}
              </FormField>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <FormField label="LEAD / MANAGER">
                <select 
                  value={formData.tlName} 
                  onChange={e => {
                    setFormData({...formData, tlName: e.target.value});
                    setErrors({...errors, tlName: false});
                  }} 
                  className={`form-input-audit appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a2138%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1.5rem_center] bg-no-repeat pr-12 ${errors.tlName ? 'border-rose-500 ring-2 ring-rose-500/10' : ''}`}
                >
                  <option value="">Select Manager...</option>
                  {TEAM_LEADERS.map(tl => <option key={tl} value={tl}>{tl}</option>)}
                </select>
                {errors.tlName && <span className="text-[15px] text-rose-500 font-normal uppercase ml-2">Required</span>}
              </FormField>
              <FormField label="QC EVALUATOR">
                <select value={formData.qcCheckerName} onChange={e => setFormData({...formData, qcCheckerName: e.target.value})} className="form-input-audit appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a2138%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1.5rem_center] bg-no-repeat pr-12 font-normal">
                  {QC_CHECKERS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </FormField>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] p-10 rounded-[1.5rem] flex items-center gap-16 text-white shadow-lg">
          <label className="flex items-center gap-5 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-7 h-7 rounded border-slate-600 bg-transparent text-indigo-500 focus:ring-indigo-500" 
              checked={formData.isRework} 
              onChange={e => setFormData({...formData, isRework: e.target.checked})} 
            />
            <div>
              <div className="text-[19px] font-normal uppercase tracking-widest text-slate-100">Perform Rework Audit</div>
              <div className="text-[15px] text-black font-bold uppercase tracking-widest">Mark as corrected version</div>
            </div>
          </label>
          <label className="flex items-center gap-5 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-7 h-7 rounded border-slate-600 bg-transparent text-indigo-500 focus:ring-indigo-500" 
              checked={formData.noWork} 
              onChange={e => {
                setFormData({...formData, noWork: e.target.checked});
                if (e.target.checked) setErrors({...errors, notes: false});
              }} 
            />
            <div className="text-[19px] font-normal uppercase tracking-widest text-slate-100">No Target / Absent</div>
          </label>
        </div>

        <div className="space-y-8">
           <div className="flex items-center gap-3 text-[#4f46e5]">
             <i className="bi bi-search text-[25px] font-normal"></i>
             <h3 className="text-[23px] font-normal uppercase tracking-widest text-black">Audit Protocol & Manual Entry</h3>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <input 
               type="text" 
               placeholder="Code Start (e.g. Altrum/01)" 
               value={formData.samplingRange?.start}
               onChange={e => setFormData({...formData, samplingRange: { ...formData.samplingRange!, start: e.target.value }})}
               className="w-full px-8 py-5 bg-[#f8fafc] border border-slate-300 rounded-[1rem] text-[21px] font-normal text-black outline-none"
             />
             <input 
               type="text" 
               placeholder="Code End (e.g. Altrum/100)" 
               value={formData.samplingRange?.end}
               onChange={e => setFormData({...formData, samplingRange: { ...formData.samplingRange!, end: e.target.value }})}
               className="w-full px-8 py-5 bg-[#f8fafc] border border-slate-300 rounded-[1rem] text-[21px] font-normal text-black outline-none"
             />
           </div>

           <button 
             type="button" 
             onClick={generateSampling}
             className="w-full py-6 bg-[#f0f2ff] border-2 border-dashed border-[#c7d2fe] text-[#4f46e5] rounded-[1.25rem] font-normal uppercase text-[20px] tracking-[0.2em] hover:bg-[#e0e7ff] transition-all"
           >
             Generate 10% Samples
           </button>
        </div>

        {!formData.noWork && (
          <div className="border border-slate-300 rounded-[1.5rem] overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[16px] border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-slate-200">
                    <th className="px-8 py-6 text-left font-bold text-black uppercase tracking-widest border-r border-slate-200 w-36">Sample ID</th>
                    {ALL_ERRORS.map(err => (
                      <th key={err.label} className="px-2 py-6 text-center font-bold text-black uppercase tracking-tighter leading-tight border-r border-slate-200 max-w-[100px]">
                        {err.shortLabel}
                      </th>
                    ))}
                    <th className="px-4 py-6 text-center font-bold text-black uppercase tracking-widest border-r border-slate-200">Clean</th>
                    <th className="px-8 py-6 text-right font-bold text-black uppercase tracking-widest">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.samples?.map((sample, idx) => (
                    <tr key={sample.sampleId} className="border-b border-slate-100">
                      <td className="px-8 py-5 font-normal text-black border-r border-slate-200">{sample.sampleId}</td>
                      {ALL_ERRORS.map(err => (
                        <td key={err.label} className="px-2 py-5 text-center border-r border-slate-200">
                          <input 
                            type="checkbox" 
                            checked={sample.errors.includes(err.label)}
                            onChange={() => handleToggleSampleError(idx, err.label)}
                            className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-5 text-center border-r border-slate-200">
                        <input 
                          type="checkbox" 
                          checked={sample.isClean}
                          onChange={() => handleToggleSampleClean(idx)}
                          className="w-5 h-5 text-emerald-500 rounded cursor-pointer"
                        />
                      </td>
                      <td className="px-8 py-5 text-right font-normal text-black text-[19px]">{sample.score}%</td>
                    </tr>
                  ))}
                  <tr className="bg-[#fafbfc]">
                    <td className="px-8 py-10 border-r border-slate-200">
                      <label className="flex items-center gap-4 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.manualQC} 
                          onChange={e => setFormData({...formData, manualQC: e.target.checked})} 
                          className="w-6 h-6 rounded border-slate-300" 
                        />
                        <div className="flex flex-col">
                          <span className="text-[17px] font-normal uppercase text-black tracking-widest">Manual Audit</span>
                          <span className="text-[15px] text-black font-bold uppercase">Track extra findings</span>
                        </div>
                      </label>
                    </td>
                    <td colSpan={ALL_ERRORS.length} className="px-8 py-10 border-r border-slate-200">
                      <div className={`grid grid-cols-2 gap-y-4 gap-x-8 transition-opacity ${!formData.manualQC && 'opacity-20 pointer-events-none'}`}>
                        {ALL_ERRORS.map(err => (
                          <label key={err.label} className="flex items-center gap-3 group cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={formData.manualErrors?.includes(err.label)}
                              onChange={() => {
                                const newErrors = formData.manualErrors?.includes(err.label)
                                  ? formData.manualErrors.filter(e => e !== err.label)
                                  : [...(formData.manualErrors || []), err.label];
                                setFormData({...formData, manualErrors: newErrors});
                              }}
                              className="w-4 h-4 rounded border-slate-300 shadow-sm"
                            />
                            <span className="text-[15px] font-bold text-black uppercase tracking-tighter group-hover:text-black transition-colors">{err.label}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td colSpan={2} className="px-8 py-10">
                       <div className={`flex flex-col gap-3 ${!formData.manualQC && 'opacity-20 pointer-events-none'}`}>
                         <span className="text-[15px] font-bold uppercase text-black tracking-widest">Manual Feedback:</span>
                         <textarea 
                           className="w-full text-[16px] p-4 bg-white border border-slate-200 rounded-xl h-24 outline-none focus:border-indigo-500 transition-all shadow-sm resize-none font-normal text-black"
                           placeholder="Specific manual findings..."
                           value={formData.manualFeedback}
                           onChange={e => setFormData({...formData, manualFeedback: e.target.value})}
                         ></textarea>
                       </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#1a2138] p-10 flex items-center justify-between text-white border-t border-slate-700">
              <div className="flex flex-col gap-2">
                <span className="text-[19px] font-normal uppercase tracking-[0.2em]">Aggregate Task Score</span>
                <span className="text-[16px] text-black font-bold uppercase tracking-widest">Avg of {formData.samples?.length || 0} data points</span>
              </div>
              <div className="text-[65px] font-normal text-[#10b981] tracking-tighter">
                {currentFormScore}%
              </div>
            </div>
          </div>
        )}

        <div ref={feedbackRef} className={`space-y-6 transition-all duration-300 ${errors.notes ? 'p-6 rounded-3xl bg-rose-50/20 border border-rose-200' : ''}`}>
          <label className={`text-[18px] font-bold uppercase tracking-widest ml-1 ${errors.notes ? 'text-rose-500' : 'text-black'}`}>Global Coaching Feedback & Final Notes (Mandatory)</label>
          <textarea 
            className={`w-full p-10 bg-white border ${errors.notes ? 'border-rose-400 focus:ring-rose-500/10' : 'border-slate-300 focus:ring-indigo-500/5'} rounded-[1.5rem] h-64 outline-none focus:ring-4 focus:border-indigo-500 transition-all text-[23px] font-normal text-black shadow-sm`}
            placeholder="Summarize overall findings for the entire task..."
            value={formData.notes}
            onChange={e => {
              setFormData({...formData, notes: e.target.value});
              setErrors({...errors, notes: false});
            }}
          ></textarea>
          {errors.notes && <p className="text-rose-500 text-[17px] font-normal uppercase tracking-widest ml-1">Comment section is mandatory!</p>}
        </div>

        <div className="flex items-center gap-10 pt-4">
          <button type="submit" className="flex-1 py-7 bg-[#4f46e5] text-white font-normal uppercase tracking-[0.4em] text-[21px] rounded-[1.25rem] hover:bg-indigo-700 shadow-2xl shadow-indigo-500/30 active:scale-[0.98] transition-all">
            Submit Audit
          </button>
          <button type="button" onClick={onDiscard} className="px-20 py-7 bg-[#f3f4f6] text-black font-normal uppercase tracking-[0.2em] text-[21px] rounded-[1.25rem] hover:bg-slate-200 transition-all">
            Discard
          </button>
        </div>
      </form>

      <style>{`
        .form-input-audit {
          width: 100%;
          padding: 1.25rem 2rem;
          background-color: white;
          border: 1px solid #cbd5e1;
          border-radius: 1.25rem;
          font-size: 1.4rem;
          font-weight: 400;
          color: #000;
          outline: none;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          cursor: pointer;
        }
        .form-input-audit:focus {
          background-color: white;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.05);
          border-color: #4f46e5;
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.5;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

const FormField = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-4">
    <label className="block text-[18px] font-bold text-black uppercase tracking-widest ml-2">{label}</label>
    {children}
  </div>
);

export default QCForm;