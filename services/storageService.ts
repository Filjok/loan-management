import { Loan, LoanStatus, Payment, Borrower } from '../types';

const STORAGE_KEY = 'lendwise_loans_v1';

export const getLoans = (): Loan[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLoans = (loans: Loan[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
};

export const getLoanById = (id: string): Loan | undefined => {
  const loans = getLoans();
  return loans.find((l) => l.id === id);
};

export const createLoan = (
  borrower: Borrower,
  amount: number,
  interestRate: number,
  startDate: string
): Loan => {
  const loans = getLoans();
  const newLoan: Loan = {
    id: crypto.randomUUID(),
    borrower,
    principalAmount: amount,
    interestRate,
    startDate,
    lastPaymentDate: startDate,
    status: LoanStatus.ACTIVE,
    currentBalance: amount,
    payments: [],
  };
  loans.push(newLoan);
  saveLoans(loans);
  return newLoan;
};

export const addPayment = (loanId: string, amountPaid: number, date: string, note?: string): Loan => {
  const loans = getLoans();
  const loanIndex = loans.findIndex((l) => l.id === loanId);
  
  if (loanIndex === -1) throw new Error('Loan not found');
  
  const loan = loans[loanIndex];
  
  // Calculate Interest logic (Diminishing Balance based on Days Elapsed)
  // We calculate interest from the last payment date (or start date) to the current payment date
  const lastDate = loan.lastPaymentDate ? new Date(loan.lastPaymentDate) : new Date(loan.startDate);
  const paymentDate = new Date(date);

  // Validate dates
  if (paymentDate < lastDate) {
    // In a real app we might throw, but here we just clamp to 0 days to prevent math errors
    // or we could throw an error. Let's warn in console and proceed with 0 days.
    console.warn("Payment date is before last payment date. Assuming 0 days interest.");
  }

  // Calculate days elapsed
  const diffTime = Math.max(0, paymentDate.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Daily Interest Rate = (Monthly Rate / 100) / 30
  // This is a standard approximation.
  const dailyRate = (loan.interestRate / 100) / 30;
  
  const interestAccrued = loan.currentBalance * dailyRate * diffDays;
  
  // Payment logic
  let interestComponent = 0;
  let principalComponent = 0;

  // We determine how the payment is allocated for the record (Ledger)
  if (amountPaid >= interestAccrued) {
    // Pay off all accrued interest first
    interestComponent = interestAccrued;
    // Remainder goes to principal
    principalComponent = amountPaid - interestAccrued;
  } else {
    // Underpayment case: Pay what you can towards interest
    interestComponent = amountPaid;
    // Principal payment is effectively 0 (and balance will grow due to unpaid interest)
    principalComponent = 0; 
  }

  // Calculate new balance
  // Formula: NewBalance = OldBalance + InterestAccrued - AmountPaid
  // If amountPaid < interestAccrued, the unpaid interest is effectively capitalized into the balance
  let newBalance = loan.currentBalance + interestAccrued - amountPaid;

  // Rounding to 2 decimal places to avoid floating point errors
  newBalance = Math.round(newBalance * 100) / 100;

  // If tiny amount remains (e.g. < 1), just clear it to avoid infinite small balances
  if (newBalance < 1) newBalance = 0;

  const newPayment: Payment = {
    id: crypto.randomUUID(),
    loanId,
    date,
    amountPaid,
    interestComponent,
    principalComponent,
    remainingBalance: newBalance,
    note
  };

  loan.payments.push(newPayment);
  loan.currentBalance = newBalance;
  loan.lastPaymentDate = date; // Update the cursor for next interest calculation

  if (newBalance <= 0) {
    loan.status = LoanStatus.COMPLETED;
    loan.currentBalance = 0; // Ensure it's not negative
  } else {
    // Reactivate if it was somehow marked completed but balance added back (rare edge case)
    loan.status = LoanStatus.ACTIVE;
  }

  loans[loanIndex] = loan;
  saveLoans(loans);
  return loan;
};