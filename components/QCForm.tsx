
import React, { useState, useEffect, useRef } from 'react';
import { QCRecord, User, SampleResult, QCError } from '../types';
import { TEAM_LEADERS, QC_CHECKERS, AGENTS, PROJECTS, ALL_ERRORS, TIME_SLOTS } from '../constants';

interface QCFormProps {
  user: User;
  onSave: (record: QCRecord) => Promise<void>;
  editRecord?: QCRecord;
  onDiscard: () => void;
}

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const QCForm: React.FC<QCFormProps> = ({ user, onSave, editRecord, onDiscard }) => {
  const [formData, setFormData] = useState<Partial<QCRecord> & { regularChecked?: boolean }>({
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString().split('T')[0],
    timeSlot: '12 PM',
    tlName: TEAM_LEADERS[0],
    agentName: '',
    qcCheckerName: user.name,
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
    samplingRange: { start: '', end: '' },
    createdAt: Date.now(),
    regularChecked: false
  });

  // Input Refs for jumping to missing fields
  const dateRef = useRef<HTMLInputElement>(null);
  const timeSlotRef = useRef<HTMLSelectElement>(null);
  const agentRef = useRef<HTMLSelectElement>(null);
  const projectRef = useRef<HTMLSelectElement>(null);
  const taskRef = useRef<HTMLInputElement>(null);
  const tlRef = useRef<HTMLSelectElement>(null);
  const qcRef = useRef<HTMLSelectElement>(null);
  const auditTypeRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editRecord) {
      setFormData({
        ...editRecord,
        regularChecked: !editRecord.isRework && !editRecord.noWork
      });
    }
  }, [editRecord]);

  const calculateFinalScore = () => {
    let baseScore = 100;
    
    // Sample deductions
    if (formData.samples && formData.samples.length > 0) {
      const avgSampleScore = formData.samples.reduce((acc, s) => acc + s.score, 0) / formData.samples.length;
      baseScore = Math.round(avgSampleScore);
    }

    // Manual deductions
    if (formData.manualQC) {
      const manualDeduction = (formData.manualErrors || []).reduce((acc, label) => {
        const err = ALL_ERRORS.find(e => e.label === label);
        return acc + (err?.deduction || 0);
      }, 0);
      baseScore = Math.max(0, baseScore - manualDeduction);
    }

    return baseScore;
  };

  const currentScore = calculateFinalScore();

  const handleGenerateSamples = () => {
    const startStr = formData.samplingRange?.start || '';
    const endStr = formData.samplingRange?.end || '';

    const extractParts = (str: string) => {
      const match = str.match(/^(.*?)(\d+)$/);
      if (match) return { prefix: match[1], num: parseInt(match[2], 10), length: match[2].length };
      return { prefix: '', num: parseInt(str, 10), length: 0 };
    };

    const startParts = extractParts(startStr);
    const endParts = extractParts(endStr);

    if (isNaN(startParts.num) || isNaN(endParts.num) || startParts.num > endParts.num) {
      setFormError("Invalid sampling range. Please ensure start is less than end.");
      return;
    }

    setFormError(null);

    const totalInRange = endParts.num - startParts.num + 1;
    const count = Math.ceil(totalInRange * 0.1);
    
    const selectedNums = new Set<number>();
    while (selectedNums.size < Math.min(count, totalInRange)) {
      const randomNum = Math.floor(Math.random() * totalInRange) + startParts.num;
      selectedNums.add(randomNum);
    }

    const sortedNums = Array.from(selectedNums).sort((a, b) => a - b);
    
    const newSamples: SampleResult[] = sortedNums.map((num) => {
      const numStr = startParts.length > 0 ? num.toString().padStart(startParts.length, '0') : num.toString();
      const sampleId = `${startParts.prefix}${numStr}`;
      
      return {
        sampleId,
        errors: [],
        isClean: true,
        score: 100
      };
    });

    setFormData(prev => ({ ...prev, samples: newSamples }));
  };

  const toggleSampleError = (sampleIdx: number, errorLabel: string) => {
    const updatedSamples = [...(formData.samples || [])];
    const sample = updatedSamples[sampleIdx];
    const error = ALL_ERRORS.find(e => e.label === errorLabel);
    
    if (sample.errors.includes(errorLabel)) {
      sample.errors = sample.errors.filter(e => e !== errorLabel);
      sample.score += (error?.deduction || 0);
    } else {
      sample.errors.push(errorLabel);
      sample.score -= (error?.deduction || 0);
    }
    
    sample.isClean = sample.errors.length === 0;
    sample.score = Math.max(0, sample.score);
    
    setFormData(prev => ({ ...prev, samples: updatedSamples }));
  };

  const toggleManualError = (label: string) => {
    const currentErrors = formData.manualErrors || [];
    if (currentErrors.includes(label)) {
      setFormData({ ...formData, manualErrors: currentErrors.filter(e => e !== label) });
    } else {
      setFormData({ ...formData, manualErrors: [...currentErrors, label] });
    }
  };

  const scrollToField = (ref: React.RefObject<any>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (ref.current.focus) ref.current.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Manual Validation & Focusing
    if (!formData.date) {
      setFormError("Evaluation Date is required.");
      scrollToField(dateRef);
      return;
    }
    if (!formData.timeSlot) {
      setFormError("Time Slot is required.");
      scrollToField(timeSlotRef);
      return;
    }
    if (!formData.agentName) {
      setFormError("Agent Name is required.");
      scrollToField(agentRef);
      return;
    }
    if (!formData.projectName) {
      setFormError("Project Name is required.");
      scrollToField(projectRef);
      return;
    }
    if (!formData.taskName) {
      setFormError("Task / File Name is required.");
      scrollToField(taskRef);
      return;
    }
    if (!formData.tlName) {
      setFormError("Team Lead / Manager is required.");
      scrollToField(tlRef);
      return;
    }
    if (!formData.qcCheckerName) {
      setFormError("QC Evaluator name is required.");
      scrollToField(qcRef);
      return;
    }
    
    if (!formData.regularChecked && !formData.isRework && !formData.noWork) {
      setFormError("Please select an Audit Type (Regular QC, Rework, or No Target).");
      scrollToField(auditTypeRef);
      return;
    }

    if (!formData.notes || formData.notes.trim().length < 5) {
      setFormError("Global Coaching Feedback & Final Notes are mandatory and must be descriptive.");
      scrollToField(notesRef);
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    try {
      let finalId = formData.id;
      
      // LOGIC: If editing a Regular QC and checking "Rework Audit", save as a NEW record
      if (editRecord && !editRecord.isRework && formData.isRework) {
        finalId = Math.random().toString(36).substr(2, 9);
      }

      const record = { 
        ...formData, 
        id: finalId,
        score: currentScore,
        createdAt: Date.now() 
      } as QCRecord;
      
      if (formData.isRework) record.reworkScore = currentScore;
      
      await onSave(record);
    } finally {
      setIsSaving(false);
    }
  };

  const getAuditTypeLabel = () => {
    if (formData.noWork) return "NO TARGET / ABSENT";
    if (formData.isRework) return "REWORK AUDIT";
    return "REGULAR QC";
  };

  return (
    <div className="w-full space-y-6 pb-20 mx-auto">
      {formError && (
        <div className="sticky top-4 z-[100] bg-rose-600 text-white px-6 py-4 rounded-[4px] font-bold text-[16px] flex items-center justify-between shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <i className="bi bi-exclamation-triangle-fill"></i>
            {formError}
          </div>
          <button onClick={() => setFormError(null)} className="text-white/60 hover:text-white">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-[4px] shadow-sm border border-slate-300 overflow-hidden" noValidate>
        {/* Form Header */}
        <div className="bg-[#1a2138] text-white px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
            <h2 className="text-[16px] font-black uppercase tracking-widest">Fill Daily Audit</h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">One Task Per Submission</span>
        </div>

        <div className="p-10 space-y-10">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FormField label="Evaluation Date">
              <input 
                ref={dateRef}
                type="date" 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})} 
                className={`form-input-box ${!formData.date && formError ? 'border-rose-500 bg-rose-50' : ''}`} 
              />
            </FormField>
            <FormField label="Evaluation Time Slot">
              <select 
                ref={timeSlotRef}
                value={formData.timeSlot} 
                onChange={e => setFormData({...formData, timeSlot: e.target.value as any})} 
                className={`form-input-box ${!formData.timeSlot && formError ? 'border-rose-500 bg-rose-50' : ''}`}
              >
                {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Agent Name">
              <select 
                ref={agentRef}
                value={formData.agentName} 
                onChange={e => setFormData({...formData, agentName: e.target.value})} 
                className={`form-input-box ${!formData.agentName && formError ? 'border-rose-500 bg-rose-50' : ''}`}
              >
                <option value="">Choose Agent...</option>
                {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField label="Campaign Project">
              <select 
                ref={projectRef}
                value={formData.projectName} 
                onChange={e => setFormData({...formData, projectName: e.target.value})} 
                className={`form-input-box ${!formData.projectName && formError ? 'border-rose-500 bg-rose-50' : ''}`}
              >
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
            <FormField label="Task / File Name">
              <input 
                ref={taskRef}
                type="text" 
                placeholder="Enter unique task ID or name..." 
                value={formData.taskName} 
                onChange={e => setFormData({...formData, taskName: e.target.value})} 
                className={`form-input-box ${!formData.taskName && formError ? 'border-rose-500 bg-rose-50' : ''}`} 
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField label="Lead / Manager">
              <select 
                ref={tlRef}
                value={formData.tlName} 
                onChange={e => setFormData({...formData, tlName: e.target.value})} 
                className={`form-input-box ${!formData.tlName && formError ? 'border-rose-500 bg-rose-50' : ''}`}
              >
                <option value="">Select Manager...</option>
                {TEAM_LEADERS.map(tl => <option key={tl} value={tl}>{tl}</option>)}
              </select>
            </FormField>
            <FormField label="QC Evaluator">
              <select 
                ref={qcRef}
                value={formData.qcCheckerName} 
                onChange={e => setFormData({...formData, qcCheckerName: e.target.value})} 
                className={`form-input-box ${!formData.qcCheckerName && formError ? 'border-rose-500 bg-rose-50' : ''}`}
              >
                {QC_CHECKERS.map(qc => <option key={qc} value={qc}>{qc}</option>)}
              </select>
            </FormField>
          </div>

          {/* Audit Type Block */}
          <div 
            ref={auditTypeRef}
            className={`bg-[#1a2138] rounded-[4px] p-8 flex flex-wrap items-center justify-start gap-16 text-white shadow-xl transition-all ${(!formData.regularChecked && !formData.isRework && !formData.noWork && formError) ? 'ring-4 ring-rose-500' : ''}`}
          >
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={formData.regularChecked} 
                onChange={e => setFormData({...formData, regularChecked: e.target.checked, isRework: false, noWork: false})} 
                className={`w-6 h-6 rounded-[4px] border-slate-600 bg-slate-700 transition-all ${formData.regularChecked ? 'ring-2 ring-emerald-500' : ''}`} 
              />
              <div className="flex flex-col">
                <span className={`text-[14px] font-black uppercase tracking-widest ${formData.regularChecked ? 'text-emerald-400' : 'text-white'}`}>Regular QC</span>
                <span className="text-[10px] text-slate-400 font-bold">Mandatory for submission</span>
              </div>
            </label>

            <div className="hidden md:block w-[1px] h-10 bg-slate-700"></div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={formData.isRework} onChange={e => setFormData({...formData, isRework: e.target.checked, regularChecked: !e.target.checked, noWork: false})} className="w-5 h-5 rounded-[4px] border-slate-600 bg-slate-700" />
              <div>
                <span className="block text-[14px] font-black uppercase tracking-widest">Perform Rework Audit</span>
                <span className="text-[10px] text-slate-400">Mark as corrected version</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={formData.noWork} onChange={e => setFormData({...formData, noWork: e.target.checked, regularChecked: false, isRework: false})} className="w-5 h-5 rounded-[4px] border-slate-600 bg-slate-700" />
              <div>
                <span className="block text-[14px] font-black uppercase tracking-widest">No Target / Absent</span>
              </div>
            </label>
          </div>

          {/* Protocol Section with Manual QC Container */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#4f46e5]">
              <i className="bi bi-search"></i>
              <h3 className="text-[14px] font-black uppercase tracking-widest">Audit Protocol & Manual Entry</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <input type="text" placeholder="Code Start (e.g. Altrum/01)" value={formData.samplingRange?.start} onChange={e => setFormData({...formData, samplingRange: {...(formData.samplingRange || {start: '', end: ''}), start: e.target.value}})} className="form-input-box" />
              <input type="text" placeholder="Code End (e.g. Altrum/100)" value={formData.samplingRange?.end} onChange={e => setFormData({...formData, samplingRange: {...(formData.samplingRange || {start: '', end: ''}), end: e.target.value}})} className="form-input-box" />
            </div>

            <button type="button" onClick={handleGenerateSamples} className="w-full py-4 bg-indigo-50 text-[#4f46e5] border border-dashed border-indigo-200 rounded-[4px] font-black uppercase tracking-widest text-[13px] hover:bg-indigo-100 transition-all">
              Generate 10% Samples
            </button>

            {formData.samples && formData.samples.length > 0 && (
              <div className="border border-slate-200 rounded-[4px] overflow-hidden animate-in fade-in duration-500">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase tracking-widest">
                      <th className="p-4 w-32">Sample ID</th>
                      {ALL_ERRORS.map(err => (
                        <th key={err.label} className="p-4 text-center leading-tight">{err.shortLabel}</th>
                      ))}
                      <th className="p-4 text-center">Clean</th>
                      <th className="p-4 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.samples.map((sample, sIdx) => (
                      <tr key={sample.sampleId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-500">{sample.sampleId}</td>
                        {ALL_ERRORS.map(err => (
                          <td key={err.label} className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={sample.errors.includes(err.label)} 
                              onChange={() => toggleSampleError(sIdx, err.label)}
                              className="w-4 h-4 rounded-[4px] border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                        ))}
                        <td className="p-4 text-center">
                          <i className={`bi ${sample.isClean ? 'bi-check-circle-fill text-emerald-500' : 'bi-x-circle-fill text-rose-500'} text-[16px]`}></i>
                        </td>
                        <td className="p-4 text-center font-black text-[14px] text-slate-700">{sample.score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Manual QC Details Container */}
            <div className="border border-slate-200 rounded-[2.5rem] p-8 space-y-8 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-3 flex items-start gap-4 pt-4">
                  <input 
                    type="checkbox" 
                    checked={formData.manualQC} 
                    onChange={e => setFormData({...formData, manualQC: e.target.checked})}
                    className="w-6 h-6 rounded-[4px] border-slate-300 mt-1 cursor-pointer" 
                  />
                  <div>
                    <span className="block text-[14px] font-black uppercase tracking-widest text-slate-400">Manual Audit</span>
                    <span className="text-[11px] font-bold text-slate-300 uppercase">Track extra findings</span>
                  </div>
                </div>

                <div className={`md:col-span-5 space-y-4 transition-opacity ${formData.manualQC ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Pick Manual Errors:</label>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    {ALL_ERRORS.map(err => (
                      <label key={err.label} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={formData.manualErrors?.includes(err.label)}
                          onChange={() => toggleManualError(err.label)}
                          className="w-4 h-4 rounded-[4px] border-slate-300" 
                        />
                        <span className="text-[12px] font-bold text-slate-300 uppercase group-hover:text-slate-500">{err.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={`md:col-span-4 space-y-4 transition-opacity ${formData.manualQC ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Manual Feedback:</label>
                  <div className="flex items-center gap-4">
                    <textarea 
                      placeholder="Specific manual findings..."
                      value={formData.manualFeedback}
                      onChange={e => setFormData({...formData, manualFeedback: e.target.value})}
                      className="w-full h-24 p-4 bg-slate-50 border border-slate-100 rounded-[1rem] text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/10"
                    ></textarea>
                    <div className="text-[28px] font-black text-slate-200">-</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a2138] rounded-xl p-6 flex items-center justify-between mt-8">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-black text-white uppercase tracking-widest">Aggregate Task Score</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Avg of {formData.samples?.length || 0} Data Points</span>
                  </div>
                </div>
                <div className="text-[32px] font-black text-[#10b981] transition-all duration-500">{currentScore}%</div>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-4">
            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Global Coaching Feedback & Final Notes (Mandatory)</label>
            <textarea 
              ref={notesRef}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Summarize overall findings for the entire task..." 
              className={`w-full h-40 p-6 bg-white border rounded-[4px] outline-none transition-all text-[16px] font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500/10 ${(!formData.notes || formData.notes.trim().length < 5) && formError ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
            ></textarea>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button type="submit" disabled={isSaving} className="flex-1 py-5 bg-[#4f46e5] text-white rounded-[1rem] font-black uppercase tracking-[0.2em] text-[16px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
              {isSaving ? 'Processing...' : 'Submit Audit'}
            </button>
            <button type="button" onClick={onDiscard} className="px-12 py-5 bg-slate-50 text-slate-400 rounded-[1rem] font-black uppercase tracking-widest text-[16px] hover:bg-slate-100 transition-all border border-slate-100 active:scale-95">
              Discard
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Popup */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[4px] shadow-2xl border border-slate-300 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#1a2138] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-amber-500">
                    <i className="bi bi-question text-[20px] font-black text-amber-500"></i>
                  </div>
                  <h3 className="text-[18px] font-black uppercase tracking-widest">
                    Confirm Submission
                  </h3>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QC Score</span>
                  <span className={`text-[24px] font-black leading-none ${currentScore >= 90 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentScore}%
                  </span>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4 text-slate-600">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Agent Name</span>
                  <span className="text-[18px] font-bold text-black">{formData.agentName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Project Name</span>
                  <span className="text-[18px] font-bold text-black">{formData.projectName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Audit Type</span>
                  <span className={`text-[18px] font-bold ${formData.noWork ? 'text-rose-500' : formData.isRework ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {getAuditTypeLabel()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Time Slot</span>
                  <span className="text-[18px] font-bold text-[#4f46e5]">{formData.timeSlot}</span>
                </div>
              </div>
              
              <p className="text-[16px] font-bold text-slate-500 text-center pt-4">Are you sure you want to submit the QC form?</p>
              
              <div className="flex gap-4">
                <button onClick={confirmSubmit} className="flex-1 py-4 bg-[#4f46e5] text-white rounded-[4px] font-black uppercase tracking-widest text-[14px] hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                  Yes, Submit
                </button>
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[4px] font-black uppercase tracking-widest text-[14px] hover:bg-slate-200 transition-all border border-slate-200 active:scale-95">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-input-box {
          width: 100%;
          padding: 0.8rem 1.25rem;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          color: #1a2138;
          outline: none;
          transition: all 0.2s;
        }
        .form-input-box:focus {
          border-color: #4f46e5;
          background-color: white;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.05);
        }
      `}</style>
    </div>
  );
};

export default QCForm;
