import React from 'react';
import { Loan, LoanStatus } from '../types';
import { ArrowRight, User, Calendar, IndianRupee } from 'lucide-react';

interface LoanCardProps {
  loan: Loan;
  onClick: (id: string) => void;
}

const LoanCard: React.FC<LoanCardProps> = ({ loan, onClick }) => {
  const isCompleted = loan.status === LoanStatus.COMPLETED;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div 
      onClick={() => onClick(loan.id)}
      className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
    >
      {isCompleted && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">
          COMPLETED
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="max-w-[65%]">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {loan.borrower.name}
          </h3>
          <div className="flex items-center text-gray-500 text-sm mt-1">
            <User size={14} className="mr-1 shrink-0" />
            <span className="truncate">ID: {loan.borrower.idProof}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Balance</p>
          <p className={`text-xl font-bold ${isCompleted ? 'text-emerald-600' : 'text-blue-600'}`}>
            {formatCurrency(loan.currentBalance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-4">
        <div>
           <p className="text-gray-500 text-xs">Original Amount</p>
           <p className="font-medium text-gray-700 flex items-center">
             <IndianRupee size={12} className="mr-1"/> {loan.principalAmount.toLocaleString('en-IN')}
           </p>
        </div>
        <div>
           <p className="text-gray-500 text-xs">Interest Rate</p>
           <p className="font-medium text-gray-700">{loan.interestRate.toFixed(2)}% / mo</p>
        </div>
        <div>
           <p className="text-gray-500 text-xs">Start Date</p>
           <p className="font-medium text-gray-700 flex items-center">
             <Calendar size={12} className="mr-1"/> {new Date(loan.startDate).toLocaleDateString()}
           </p>
        </div>
        <div className="flex sm:justify-end items-center mt-2 sm:mt-0">
             <span className="text-blue-500 font-medium group-hover:underline flex items-center text-sm">
                Details <ArrowRight size={14} className="ml-1" />
             </span>
        </div>
      </div>
    </div>
  );
};

export default LoanCard;