
import { QCError } from './types';

export const TEAM_LEADERS = ['Mohsin', 'Venkateshwaran'];
export const QC_CHECKERS = ['Jimil', 'Apurva', 'Mohsin', 'Venkateshwaran'];
export const AGENTS = ['Jash', 'Chaitanya', 'Priyanshu', 'Vivek', 'Manas'];
export const PROJECTS = ['Moveeasy', 'Mfund', 'Altrum'];

export const ALL_ERRORS: QCError[] = [
  { label: 'Typo / Grammar Error', shortLabel: 'TYPO / GRAMMAR ERROR', deduction: 5, category: 'FORMATTING' },
  { label: 'Incorrect Spacing', shortLabel: 'INCORRECT SPACING', deduction: 2, category: 'FORMATTING' },
  { label: 'Wrong Font / Style', shortLabel: 'WRONG FONT / STYLE', deduction: 2, category: 'FORMATTING' },
  { label: 'Process Violation', shortLabel: 'PROCESS VIOLATION', deduction: 10, category: 'ADHERENCE' },
  { label: 'Critical Data Mismatch', shortLabel: 'CRITICAL DATA MISMATCH', deduction: 0, category: 'ADHERENCE' },
  { label: 'Missed Client Instruction', shortLabel: 'MISSED CLIENT INSTRUCTION', deduction: 15, category: 'FATAL' },
  { label: 'Invalid Source Link', shortLabel: 'INVALID SOURCE LINK', deduction: 10, category: 'SOURCE' },
  { label: 'Source Date Outdated', shortLabel: 'SOURCE DATE OUTDATED', deduction: 5, category: 'SOURCE' },
];

export const TIME_SLOTS = ['12 PM', '4 PM', '6 PM'] as const;
