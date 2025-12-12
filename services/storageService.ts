import { Loan, LoanStatus, Payment, Borrower } from '../types';
import { supabase } from '../supabase';

// The DB uses a normalized schema: `borrowers`, `loans` (with borrower_id), and `payments`.
// These helpers map rows to the app's `Loan` shape and perform the required multi-table operations.

const mapLoanRowToLoan = (row: any, borrower?: any, payments: any[] = []): Loan => {
  const mapBorrowerRow = (b: any) => {
    if (!b) return undefined;
    return {
      id: String(b.id),
      name: b.name ?? '',
      idProof: b.id_proof ?? b.idProof ?? '',
      phone: b.phone ?? '',
      email: b.email ?? '',
      address: b.address ?? '',
    } as Borrower;
  };

  const mappedBorrower = borrower ? mapBorrowerRow(borrower) : mapBorrowerRow({ id: row.borrower_id });

  return {
    id: String(row.id),
    borrower: mappedBorrower as Borrower,
    principalAmount: Number(row.principal_amount),
    interestRate: Number(row.interest_rate),
    startDate: row.start_date ? new Date(row.start_date).toISOString() : '',
    lastPaymentDate: row.last_payment_date ? new Date(row.last_payment_date).toISOString() : undefined,
    status: row.status as LoanStatus,
    currentBalance: Number(row.current_balance),
    payments: (payments || []).map((p) => ({
      id: String(p.id),
      loanId: String(p.loan_id),
      date: p.date ? new Date(p.date).toISOString() : '',
      amountPaid: Number(p.amount_paid),
      interestComponent: Number(p.interest_component),
      principalComponent: Number(p.principal_component),
      remainingBalance: Number(p.remaining_balance),
      note: p.note || undefined,
    })),
  };
};

export const getLoans = async (): Promise<Loan[]> => {
  const { data: loansRows, error: loansError } = await supabase.from('loans').select('*').order('created_at', { ascending: false });
  if (loansError) throw loansError;
  const loans = (loansRows as any[]) || [];

  if (loans.length === 0) return [];

  const borrowerIds = Array.from(new Set(loans.map((l) => l.borrower_id).filter(Boolean)));
  const { data: borrowersRows } = await supabase.from('borrowers').select('*').in('id', borrowerIds);
  const borrowers = (borrowersRows as any[]) || [];

  const loanIds = loans.map((l) => l.id);
  const { data: paymentsRows } = await supabase.from('payments').select('*').in('loan_id', loanIds).order('date', { ascending: true });
  const payments = (paymentsRows as any[]) || [];

  return loans.map((row) => {
    const borrower = borrowers.find((b) => String(b.id) === String(row.borrower_id));
    const loanPayments = payments.filter((p) => String(p.loan_id) === String(row.id));
    return mapLoanRowToLoan(row, borrower, loanPayments);
  });
};

export const saveLoans = async (_loans: Loan[]) => {
  // Not implemented for normalized schema.
  // Use per-entity functions (createLoan, addPayment, updateLoan) for safety.
  throw new Error('saveLoans is not supported with normalized DB. Use createLoan / addPayment / updateLoan instead.');
};

export const getLoanById = async (id: string): Promise<Loan | null> => {
  const { data: loanRow, error: loanError } = await supabase.from('loans').select('*').eq('id', id).maybeSingle();
  if (loanError) throw loanError;
  if (!loanRow) return null;

  const { data: borrowerRow } = await supabase.from('borrowers').select('*').eq('id', loanRow.borrower_id).maybeSingle();
  const { data: paymentsRows } = await supabase.from('payments').select('*').eq('loan_id', id).order('date', { ascending: true });

  return mapLoanRowToLoan(loanRow, borrowerRow as any, (paymentsRows as any[]) || []);
};

export const createLoan = async (
  borrower: Borrower,
  amount: number,
  interestRate: number,
  startDate: string
): Promise<Loan> => {
  // Insert or upsert borrower (map camelCase -> snake_case for DB)
  const dbBorrower = {
    id: borrower.id,
    name: borrower.name,
    id_proof: borrower.idProof,
    phone: borrower.phone,
    email: borrower.email,
    address: borrower.address,
  };

  const { error: bErr } = await supabase.from('borrowers').upsert([dbBorrower]);
  if (bErr) throw bErr;

  const loanRow = {
    id: crypto.randomUUID(),
    borrower_id: borrower.id,
    principal_amount: amount,
    interest_rate: interestRate,
    start_date: startDate,
    last_payment_date: startDate,
    status: LoanStatus.ACTIVE,
    current_balance: amount,
  };

  const { data, error } = await supabase.from('loans').insert([loanRow]).select().maybeSingle();
  if (error) throw error;

  // Return complete Loan object with borrower and empty payments
  return mapLoanRowToLoan(data, borrower, []);
};

export const addPayment = async (loanId: string, amountPaid: number, date: string, note?: string): Promise<Loan> => {
  const loan = await getLoanById(loanId);
  if (!loan) throw new Error('Loan not found');

  const lastDate = loan.lastPaymentDate ? new Date(loan.lastPaymentDate) : new Date(loan.startDate);
  const paymentDate = new Date(date);

  if (paymentDate < lastDate) {
    console.warn('Payment date is before last payment date. Assuming 0 days interest.');
  }

  const diffTime = Math.max(0, paymentDate.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const dailyRate = (loan.interestRate / 100) / 30;
  const interestAccrued = loan.currentBalance * dailyRate * diffDays;

  let interestComponent = 0;
  let principalComponent = 0;

  if (amountPaid >= interestAccrued) {
    interestComponent = interestAccrued;
    principalComponent = amountPaid - interestAccrued;
  } else {
    interestComponent = amountPaid;
    principalComponent = 0;
  }

  let newBalance = loan.currentBalance + interestAccrued - amountPaid;
  newBalance = Math.round(newBalance * 100) / 100;
  if (newBalance < 1) newBalance = 0;

  const paymentRow = {
    id: crypto.randomUUID(),
    loan_id: loanId,
    date,
    amount_paid: amountPaid,
    interest_component: interestComponent,
    principal_component: principalComponent,
    remaining_balance: newBalance,
    note: note || null,
  };

  const { error: pErr } = await supabase.from('payments').insert([paymentRow]);
  if (pErr) throw pErr;

  const updatedStatus = newBalance <= 0 ? LoanStatus.COMPLETED : LoanStatus.ACTIVE;
  const { error: uErr } = await supabase.from('loans').update({ current_balance: newBalance, last_payment_date: date, status: updatedStatus }).eq('id', loanId);
  if (uErr) throw uErr;

  // Return refreshed loan
  return await getLoanById(loanId) as Loan;
};