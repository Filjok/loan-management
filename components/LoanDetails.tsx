import React, { useState, useEffect } from 'react';
import { Loan, LoanStatus, LoanAnalysis } from '../types';
import { addPayment, getLoanById } from '../services/storageService';
import { processLoanAnalysis } from '../services/geminiService';
import { ArrowLeft, User as UserIcon, Calendar, CheckCircle, Sparkles, TrendingUp, History, IndianRupee } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LoanDetailsProps {
  loanId: string;
  onBack: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

const LoanDetails: React.FC<LoanDetailsProps> = ({ loanId, onBack }) => {
  const [loan, setLoan] = useState<Loan | undefined>(undefined);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<LoanAnalysis | null>(null);

  useEffect(() => {
    const data = getLoanById(loanId);
    setLoan(data);
  }, [loanId]);

  if (!loan) return <div className="p-10 text-center">Loading...</div>;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    // Check if date is valid relative to last payment
    const lastDate = new Date(loan.lastPaymentDate || loan.startDate);
    const payDate = new Date(date);
    if (payDate < lastDate) {
        alert("Payment date cannot be before the last payment date.");
        return;
    }

    const updatedLoan = addPayment(loan.id, parseFloat(amount), date);
    setLoan({ ...updatedLoan }); // Force refresh
    setAmount('');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await processLoanAnalysis(loan);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Prepare chart data
  const chartData = loan.payments.map((p, index) => ({
    name: `Pay ${index + 1}`,
    Principal: parseFloat(p.principalComponent.toFixed(2)),
    Interest: parseFloat(p.interestComponent.toFixed(2)),
    Balance: parseFloat(p.remainingBalance.toFixed(2))
  }));

  // Calculate Expected Interest dynamically based on date input
  const lastDate = new Date(loan.lastPaymentDate || loan.startDate);
  const currentDate = new Date(date);
  const diffTime = Math.max(0, currentDate.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const dailyRate = (loan.interestRate / 100) / 30;
  const expectedInterest = loan.currentBalance * dailyRate * diffDays;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft size={20} className="mr-1" /> Back to Dashboard
      </button>

      {/* Header Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Borrower Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
             <div>
                <h2 className="text-2xl font-bold text-gray-900">{loan.borrower.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{loan.borrower.address}</p>
             </div>
             <div className="bg-gray-100 p-2 rounded-lg">
                <UserAvatar initials={loan.borrower.name.substring(0, 2).toUpperCase()} />
             </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">ID Proof</span>
                <span className="font-medium">{loan.borrower.idProof}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{loan.borrower.phone}</span>
            </div>
          </div>
        </div>

        {/* Loan Stats */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <IndianRupee size={100} />
            </div>
            <p className="text-slate-400 text-sm uppercase font-semibold">Current Outstanding</p>
            <h1 className="text-4xl font-bold mt-2">{formatCurrency(loan.currentBalance)}</h1>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-slate-400 text-xs">Principal</p>
                    <p className="font-medium">{formatCurrency(loan.principalAmount)}</p>
                </div>
                <div>
                    <p className="text-slate-400 text-xs">Rate (Monthly)</p>
                    <p className="font-medium">{loan.interestRate.toFixed(2)}%</p>
                </div>
            </div>
        </div>

        {/* Action / Payment */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
           {loan.status === LoanStatus.ACTIVE ? (
               <form onSubmit={handlePayment} className="space-y-4">
                 <h3 className="font-bold text-gray-800 flex items-center">
                    <IndianRupee size={18} className="mr-2 text-emerald-500"/>
                    Record Payment
                 </h3>
                 <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-sm text-emerald-800">
                    <div className="flex justify-between">
                        <span>Interest for {diffDays} days:</span>
                        <span className="font-bold text-lg">{formatCurrency(expectedInterest)}</span>
                    </div>
                    <div className="text-xs text-emerald-600 mt-1">Since last payment: {lastDate.toLocaleDateString()}</div>
                 </div>
                 <div className="flex gap-2">
                    <input 
                        type="number" 
                        step="1"
                        min="1"
                        value={amount} 
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Amount (₹)" 
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <input 
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                 </div>
                 <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm">
                    Add Payment
                 </button>
               </form>
           ) : (
               <div className="h-full flex flex-col items-center justify-center text-emerald-600">
                   <CheckCircle size={48} className="mb-2" />
                   <h3 className="text-xl font-bold">Loan Completed</h3>
                   <p className="text-gray-500 text-sm text-center">This loan has been fully repaid.</p>
               </div>
           )}
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                <Sparkles className="mr-2 text-indigo-500" size={20} />
                Smart Advisor
            </h3>
            {!analysis && (
                <button 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Loan Health'}
                </button>
            )}
        </div>
        
        {analysis && (
            <div className="space-y-4 animate-in fade-in duration-500">
                <p className="text-gray-700">{analysis.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/60 p-3 rounded-lg border border-indigo-100">
                        <p className="text-xs text-indigo-500 uppercase font-bold">Financial Health</p>
                        <p className={`font-bold ${analysis.financialHealth === 'Good' ? 'text-green-600' : analysis.financialHealth === 'Fair' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {analysis.financialHealth}
                        </p>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg border border-indigo-100">
                        <p className="text-xs text-indigo-500 uppercase font-bold">Projected Finish</p>
                        <p className="font-bold text-gray-800">{analysis.projectedFinishDate || "N/A"}</p>
                    </div>
                </div>
                <div>
                    <p className="text-xs text-indigo-500 uppercase font-bold mb-2">Recommendations</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {analysis.advice.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center">
                <History size={18} className="mr-2 text-gray-500"/> Payment History
            </h3>
          </div>
          <div className="flex-1 overflow-auto max-h-[400px]">
            {loan.payments.length === 0 ? (
                <div className="p-10 text-center text-gray-400">No payments recorded yet.</div>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3 text-right">Paid</th>
                            <th className="px-4 py-3 text-right text-gray-400">Interest</th>
                            <th className="px-4 py-3 text-right text-gray-400">Principal</th>
                            <th className="px-4 py-3 text-right font-semibold">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[...loan.payments].reverse().map(payment => (
                            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">{new Date(payment.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-right font-medium text-emerald-600">+{formatCurrency(payment.amountPaid)}</td>
                                <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(payment.interestComponent)}</td>
                                <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(payment.principalComponent)}</td>
                                <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(payment.remainingBalance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                 <TrendingUp size={18} className="mr-2 text-gray-500"/>
                 Balance Trend
             </h3>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 10}} />
                        <YAxis tick={{fontSize: 10}} />
                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="Interest" stackId="a" fill="#94a3b8" name="Interest Paid" />
                        <Bar dataKey="Principal" stackId="a" fill="#3b82f6" name="Principal Paid" />
                    </BarChart>
                </ResponsiveContainer>
             </div>
             <p className="text-xs text-gray-400 mt-2 text-center">Blue indicates principal reduction portion of payment.</p>
        </div>
      </div>
    </div>
  );
};

const UserAvatar = ({initials}: {initials: string}) => (
    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
        {initials}
    </div>
);

export default LoanDetails;