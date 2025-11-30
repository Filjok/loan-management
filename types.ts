export interface Borrower {
  id: string;
  name: string;
  idProof: string; // e.g., SSN, Driving License ID
  phone: string;
  email: string;
  address: string;
}

export interface Payment {
  id: string;
  loanId: string;
  date: string; // ISO String
  amountPaid: number;
  interestComponent: number;
  principalComponent: number;
  remainingBalance: number;
  note?: string;
}

export enum LoanStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  DEFAULTED = 'Defaulted',
}

export interface Loan {
  id: string;
  borrower: Borrower;
  principalAmount: number;
  interestRate: number; // Monthly percentage
  startDate: string;
  lastPaymentDate?: string; // Track the date up to which interest has been calculated
  status: LoanStatus;
  currentBalance: number; // Cache current balance for quick access
  payments: Payment[];
}

export interface LoanAnalysis {
  summary: string;
  projectedFinishDate?: string;
  financialHealth: 'Good' | 'Fair' | 'Critical';
  advice: string[];
}