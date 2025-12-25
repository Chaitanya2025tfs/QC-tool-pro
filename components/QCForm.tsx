
import React, { useState, useEffect, useMemo } from 'react';
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
    time: { hr: '12', min: '00', period: 'PM' },
    timeSlot: '12 PM',
    tlName: TEAM_LEADERS[0],
    agentName: AGENTS[0],
    qcCheckerName: user.name || QC_CHECKERS[0],
    projectName: PROJECTS[0],
    taskName: '',
    score: 100,
    isRework: false,
    notes: '',
    noWork: false,
    manualQC: false,
    manualErrors: [],
    manualFeedback: '',
    samples: [],
    samplingRange: { start: '', end: '' }
  });

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

  const aggregateScore = useMemo(() => {
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
    } else {
        // If unchecking clean, score remains 100 unless errors are re-added
        sample.score = 100;
    }
    newSamples[sampleIdx] = sample;
    setFormData({ ...formData, samples: newSamples });
  };

  const generateSampling = () => {
    const { start, end } = formData.samplingRange || { start: '', end: '' };
    if (!start || !end) return;

    const sNum = parseInt(start);
    const eNum = parseInt(end);
    
    if (isNaN(sNum) || isNaN(eNum)) return;

    const count = Math.abs(eNum - sNum) + 1;
    const sampleSize = Math.ceil(count * 0.1);
    const indices = new Set<number>();
    
    while (indices.size < Math.min(sampleSize, count)) {
      indices.add(Math.floor(Math.random() * count) + Math.min(sNum, eNum));
    }

    const generatedSamples: SampleResult[] = Array.from(indices).sort((a, b) => a - b).map(idx => ({
      sampleId: idx.toString(),
      errors: [],
      isClean: true,
      score: 100
    }));

    setFormData({ ...formData, samples: generatedSamples });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.notes && !formData.noWork) {
      alert("Comment section is mandatory!");
      return;
    }
    const finalRecord = {
      ...formData,
      score: aggregateScore,
      reworkScore: formData.isRework ? aggregateScore : undefined,
      createdAt: Date.now(),
    } as QCRecord;
    
    onSave(finalRecord);
  };

  return (
    <div className="max-w-6xl mx-auto my-8 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Header matching screenshot */}
      <div className="bg-[#1a2138] text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
          <h2 className="text-base font-bold uppercase tracking-wide">
            {editRecord ? 'Update Audit Entry' : 'New Audit Entry'}
          </h2>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">One Task Per Submission</span>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Row 1: Date, Time Slot, Agent Name */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Evaluation Date">
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="form-input-audit" />
          </FormField>
          <FormField label="Evaluation Time Slot">
            <select value={formData.timeSlot} onChange={e => setFormData({...formData, timeSlot: e.target.value as any})} className="form-input-audit">
              {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </FormField>
          <FormField label="Agent Name">
            <select value={formData.agentName} onChange={e => setFormData({...formData, agentName: e.target.value})} className="form-input-audit">
              {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </FormField>
        </div>

        {/* Row 2: Campaign, Task Name */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Campaign Project">
            <select value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="form-input-audit">
              {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Task / File Name">
              <input type="text" placeholder="Task Name..." value={formData.taskName} onChange={e => setFormData({...formData, taskName: e.target.value})} className="form-input-audit" />
            </FormField>
          </div>
        </div>

        {/* Row 3: Lead, QC Evaluator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Lead / Manager">
            <select value={formData.tlName} onChange={e => setFormData({...formData, tlName: e.target.value})} className="form-input-audit">
              {TEAM_LEADERS.map(tl => <option key={tl} value={tl}>{tl}</option>)}
            </select>
          </FormField>
          <FormField label="QC Evaluator">
            <select value={formData.qcCheckerName} onChange={e => setFormData({...formData, qcCheckerName: e.target.value})} className="form-input-audit">
              {QC_CHECKERS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </FormField>
        </div>

        {/* Dark Status Bar */}
        <div className="bg-[#121826] p-6 rounded-xl flex items-center gap-16 text-white">
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${formData.isRework ? 'bg-blue-600 border-blue-600' : 'border-slate-500 group-hover:border-blue-400'}`}>
              {formData.isRework && <i className="bi bi-check-lg text-white text-sm"></i>}
              <input type="checkbox" className="hidden" checked={formData.isRework} onChange={e => setFormData({...formData, isRework: e.target.checked})} />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest">Perform Rework Audit</div>
              <div className="text-[9px] text-slate-400 font-medium">Mark as corrected version</div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${formData.noWork ? 'bg-slate-400 border-slate-400' : 'border-slate-500 group-hover:border-slate-400'}`}>
              {formData.noWork && <i className="bi bi-check-lg text-white text-sm"></i>}
              <input type="checkbox" className="hidden" checked={formData.noWork} onChange={e => setFormData({...formData, noWork: e.target.checked})} />
            </div>
            <div className="text-[11px] font-black uppercase tracking-widest">No Target / Absent</div>
          </label>
        </div>

        {/* Audit Protocol & Manual Entry Section */}
        {!formData.noWork && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#4f46e5]">
              <i className="bi bi-search text-lg"></i>
              <h3 className="text-[13px] font-black uppercase tracking-widest">Audit Protocol & Manual Entry</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Range Start (e.g. 1)" 
                value={formData.samplingRange?.start}
                onChange={e => setFormData({...formData, samplingRange: { ...formData.samplingRange!, start: e.target.value }})}
                className="form-input-audit"
              />
              <input 
                type="text" 
                placeholder="Range End (e.g. 100)" 
                value={formData.samplingRange?.end}
                onChange={e => setFormData({...formData, samplingRange: { ...formData.samplingRange!, end: e.target.value }})}
                className="form-input-audit"
              />
            </div>
            
            <button 
              type="button" 
              onClick={generateSampling}
              className="w-full py-4 bg-indigo-50 border border-indigo-200 text-[#4f46e5] rounded-xl font-bold hover:bg-indigo-100 transition-all uppercase text-[11px] tracking-[0.2em] shadow-sm"
            >
              Generate 10% Samples
            </button>

            {/* Error Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-[#fafafa]">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-200">
                      <th className="px-5 py-4 text-left font-black text-slate-400 uppercase tracking-tighter w-24">Sample ID</th>
                      {ALL_ERRORS.map(err => (
                        <th key={err.label} className="px-2 py-4 text-center font-black text-slate-400 uppercase tracking-tighter leading-tight max-w-[80px]">
                          {err.shortLabel}
                        </th>
                      ))}
                      <th className="px-3 py-4 text-center font-black text-blue-500 uppercase tracking-tighter">Clean</th>
                      <th className="px-5 py-4 text-right font-black text-slate-400 uppercase tracking-tighter">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {formData.samples?.map((sample, idx) => (
                      <tr key={sample.sampleId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-black text-slate-700">{sample.sampleId}</td>
                        {ALL_ERRORS.map(err => (
                          <td key={err.label} className="px-2 py-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={sample.errors.includes(err.label)}
                              onChange={() => handleToggleSampleError(idx, err.label)}
                              className="w-4 h-4 text-blue-600 rounded cursor-pointer transition-transform active:scale-90"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={sample.isClean}
                            onChange={() => handleToggleSampleClean(idx)}
                            className="w-4 h-4 text-green-500 rounded cursor-pointer transition-transform active:scale-90"
                          />
                        </td>
                        <td className="px-5 py-4 text-right font-black text-slate-800 text-sm">
                          {sample.score}
                        </td>
                      </tr>
                    ))}
                    {(!formData.samples || formData.samples.length === 0) && (
                      <tr><td colSpan={ALL_ERRORS.length + 3} className="px-5 py-10 text-center text-slate-300 font-bold uppercase tracking-widest italic opacity-50">Generate samples to start audit</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Manual Audit Section */}
            <div className="p-8 border border-slate-200 rounded-2xl bg-white flex flex-col lg:flex-row gap-10 shadow-sm">
              <div className="flex-none">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <input type="checkbox" checked={formData.manualQC} onChange={e => setFormData({...formData, manualQC: e.target.checked})} className="w-6 h-6 rounded border-slate-300" />
                  <div>
                    <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest group-hover:text-slate-600 transition-colors">Manual Audit</div>
                    <div className="text-[9px] text-slate-500 font-medium">Track extra findings</div>
                  </div>
                </label>
              </div>

              <div className={`flex-1 grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-3 transition-opacity duration-300 ${!formData.manualQC && 'opacity-20 pointer-events-none'}`}>
                <div className="col-span-full mb-1 text-[9px] font-black uppercase text-slate-400 tracking-widest">Pick Manual Errors:</div>
                {ALL_ERRORS.map(err => (
                  <label key={err.label} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.manualErrors?.includes(err.label)}
                      onChange={() => {
                        const newErrors = formData.manualErrors?.includes(err.label)
                          ? formData.manualErrors.filter(e => e !== err.label)
                          : [...(formData.manualErrors || []), err.label];
                        setFormData({...formData, manualErrors: newErrors});
                      }}
                      className="w-3.5 h-3.5 rounded border-slate-300"
                    />
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors">{err.label}</span>
                  </label>
                ))}
              </div>

              <div className={`flex-1 ${!formData.manualQC && 'opacity-20 pointer-events-none'}`}>
                <div className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Manual Feedback:</div>
                <textarea 
                  className="w-full text-[11px] p-4 border border-slate-200 rounded-xl h-24 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none font-medium text-slate-600"
                  placeholder="Specific manual findings..."
                  value={formData.manualFeedback}
                  onChange={e => setFormData({...formData, manualFeedback: e.target.value})}
                ></textarea>
              </div>
            </div>

            {/* Task Score Box matching screenshot */}
            <div className="bg-[#121826] rounded-2xl p-6 flex items-center justify-between text-white border-l-[6px] border-[#4ade80] shadow-2xl">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Aggregate Task Score</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Avg of {formData.samples?.length || 0} data points</span>
              </div>
              <div className="text-5xl font-black text-[#4ade80] tracking-tighter">
                {aggregateScore}%
              </div>
            </div>
          </div>
        )}

        {/* Global Feedback Section */}
        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Global Coaching Feedback & Final Notes (Mandatory)</label>
          <textarea 
            className="w-full p-6 border border-slate-200 rounded-2xl h-40 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-600 shadow-sm"
            placeholder="Provide detailed evaluation notes and coaching points..."
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
          ></textarea>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-6 pt-4">
          <button 
            type="submit"
            className="flex-1 py-5 bg-[#4f46e5] text-white font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl hover:bg-[#4338ca] hover:shadow-xl hover:shadow-indigo-500/20 active:scale-[0.98] transition-all shadow-lg"
          >
            {editRecord ? 'Update Audit' : 'Submit Audit'}
          </button>
          <button 
            type="button"
            onClick={onDiscard}
            className="px-12 py-5 bg-slate-100 text-slate-800 font-black uppercase tracking-[0.2em] text-[12px] rounded-2xl hover:bg-slate-200 active:scale-[0.98] transition-all"
          >
            Discard
          </button>
        </div>
      </form>

      <style>{`
        .form-input-audit {
          @apply w-full px-5 py-4 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 shadow-sm;
        }
        input[type="checkbox"] {
          @apply cursor-pointer;
        }
      `}</style>
    </div>
  );
};

const FormField = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

export default QCForm;
