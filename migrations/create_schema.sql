-- Create borrowers table
create table if not exists borrowers (
  id uuid primary key,
  name text not null,
  id_proof text,
  phone text,
  email text,
  address text,
  created_at timestamptz default now()
);

-- Loans table (if you already have it with slightly different names, you can adjust)
create table if not exists loans (
  id uuid primary key,
  borrower_id uuid references borrowers(id) on delete set null,
  principal_amount numeric not null,
  interest_rate numeric not null,
  start_date date not null,
  last_payment_date date,
  status text not null,
  current_balance numeric not null,
  created_at timestamptz default now()
);

-- Payments table
create table if not exists payments (
  id uuid primary key,
  loan_id uuid references loans(id) on delete cascade,
  date date not null,
  amount_paid numeric not null,
  interest_component numeric not null,
  principal_component numeric not null,
  remaining_balance numeric not null,
  note text,
  created_at timestamptz default now()
);

-- Indexes for faster lookups
create index if not exists idx_loans_borrower on loans(borrower_id);
create index if not exists idx_payments_loan on payments(loan_id);
