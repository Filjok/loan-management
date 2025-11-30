import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, PlusCircle, Settings, LogOut, Wallet } from 'lucide-react';
import { getLoans } from './services/storageService';
import { Loan, LoanStatus } from './types';
import LoanCard from './components/LoanCard';
import AddLoanModal from './components/AddLoanModal';
import LoanDetails from './components/LoanDetails';

// Simple nav item component
const NavItem = ({ to, icon: Icon, label, active }: any) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-1
    ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Dashboard = ({ onSelectLoan }: { onSelectLoan: (id: string) => void }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const refreshLoans = () => {
    setLoans(getLoans());
  };

  useEffect(() => {
    refreshLoans();
  }, []);

  const activeLoans = loans.filter(l => l.status === LoanStatus.ACTIVE);
  const filteredLoans = activeLoans.filter(l => 
    l.borrower.name.toLowerCase().includes(filter.toLowerCase()) || 
    l.borrower.idProof.toLowerCase().includes(filter.toLowerCase())
  );

  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.currentBalance, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
           <p className="text-gray-500 mt-1">Manage your active portfolio</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div>
                <p className="text-xs text-gray-500 uppercase">Total Outstanding</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(totalOutstanding)}</p>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div>
                 <p className="text-xs text-gray-500 uppercase">Active Loans</p>
                 <p className="text-xl font-bold text-gray-800">{activeLoans.length}</p>
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
         <input 
            type="text" 
            placeholder="Search borrowers..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg w-full sm:w-80 focus:ring-2 focus:ring-blue-500 outline-none"
         />
         <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
         >
            <PlusCircle size={18} className="mr-2" />
            New Application
         </button>
      </div>

      {/* Grid */}
      {filteredLoans.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                <Wallet className="text-gray-400" size={32} />
             </div>
             <h3 className="text-lg font-medium text-gray-900">No active loans found</h3>
             <p className="text-gray-500 max-w-sm mx-auto mt-2">Create a new loan application to get started or adjust your search.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLoans.map(loan => (
                <LoanCard key={loan.id} loan={loan} onClick={onSelectLoan} />
            ))}
          </div>
      )}

      <AddLoanModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={refreshLoans} 
      />
    </div>
  );
};

const HistoryPage = ({ onSelectLoan }: { onSelectLoan: (id: string) => void }) => {
    const [loans, setLoans] = useState<Loan[]>([]);

    useEffect(() => {
        setLoans(getLoans().filter(l => l.status === LoanStatus.COMPLETED));
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div>
                <h1 className="text-2xl font-bold text-gray-900">Loan History</h1>
                <p className="text-gray-500 mt-1">Archive of completed and closed loans.</p>
             </div>
             
             {loans.length === 0 ? (
                 <div className="bg-white p-10 rounded-2xl shadow-sm text-center text-gray-500">
                    No completed loans yet.
                 </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loans.map(loan => (
                        <LoanCard key={loan.id} loan={loan} onClick={onSelectLoan} />
                    ))}
                </div>
             )}
        </div>
    );
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white fixed h-full hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Wallet size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">LendWise</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavItem to="/" icon={LayoutDashboard} label="Active Loans" active={location.pathname === '/' || location.pathname.startsWith('/loan')} />
          <NavItem to="/history" icon={CheckSquare} label="Completed History" active={location.pathname === '/history'} />
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center space-x-3 text-slate-400 hover:text-white cursor-pointer px-4 py-2">
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

const AppContent = () => {
    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

    // If a loan is selected, we basically override the route view with the detail view
    // A more complex app would use nested routes /loan/:id, but state is simpler for this single-file output requirement structure.
    
    if (selectedLoanId) {
        return (
            <Layout>
                <LoanDetails loanId={selectedLoanId} onBack={() => setSelectedLoanId(null)} />
            </Layout>
        );
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard onSelectLoan={setSelectedLoanId} />} />
                <Route path="/history" element={<HistoryPage onSelectLoan={setSelectedLoanId} />} />
            </Routes>
        </Layout>
    );
};

const App = () => {
  return (
    <Router>
       <AppContent />
    </Router>
  );
};

export default App;