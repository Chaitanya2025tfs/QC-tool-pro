
export type Role = 'ADMIN' | 'MANAGER' | 'QC' | 'AGENT';

export interface User {
  id: string;
  name: string;
  role: Role;
  project?: string;
}

export interface QCError {
  category: string;
  label: string;
  shortLabel: string;
  deduction: number;
}

export interface SampleResult {
  sampleId: string;
  errors: string[]; // labels
  isClean: boolean;
  score: number;
}

export interface QCRecord {
  id: string;
  date: string;
  time: {
    hr: string;
    min: string;
    period: 'AM' | 'PM';
  };
  timeSlot: '12 PM' | '4 PM' | '6 PM';
  tlName: string;
  agentName: string;
  qcCheckerName: string;
  projectName: string;
  taskName: string;
  score: number; // This acts as the Regular Score
  reworkScore?: number; // This acts as the Rework Score
  isRework: boolean;
  notes: string;
  noWork: boolean;
  manualQC: boolean;
  manualErrors: string[];
  manualFeedback: string;
  samples: SampleResult[];
  samplingRange?: {
    start: string;
    end: string;
  };
  createdAt: number;
}

export interface PerformanceStats {
  avgScore: number;
  avgReworkScore: number;
  activeProjects: number;
  activeAgents: number;
}
