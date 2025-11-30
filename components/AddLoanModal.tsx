import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createLoan } from '../services/storageService';
import { Borrower } from '../types';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddLoanModal: React.FC<AddLoanModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    idProof: '',
    phone: '',
    email: '',
    address: '',
    amount: '',
    interestRate: '', // Now captures Annual Rate
    startDate: new Date().toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const borrower: Borrower = {
      id: crypto.randomUUID(),
      name: formData.name,
      idProof: formData.idProof,
      phone: formData.phone,
      email: formData.email,
      address: formData.address
    };

    // Convert Annual Rate to Monthly Rate for storage
    // Example: 12% PA -> 1% PM
    const annualRate = parseFloat(formData.interestRate);
    const monthlyRate = annualRate / 12;

    createLoan(
      borrower,
      parseFloat(formData.amount),
      monthlyRate,
      formData.startDate
    );

    onSuccess();
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">New Loan Application</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="addLoanForm" onSubmit={handleSubmit} className="space-y-6">
            {/* Borrower Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 border-l-4 border-blue-500 pl-2">Borrower Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input required name="name" onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Amit Patel" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof (Aadhar/PAN)</label>
                  <input required name="idProof" onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ABCD12345" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input required name="phone" type="tel" onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input name="email" type="email" onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="amit@example.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea name="address" onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Full address" />
                </div>
              </div>
            </div>

            {/* Loan Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 border-l-4 border-emerald-500 pl-2">Loan Terms</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (₹)</label>
                  <input required name="amount" type="number" min="1" onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="50000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Interest Rate (%)</label>
                  <input required name="interestRate" type="number" step="0.1" min="0" onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="12.0" />
                  <p className="text-xs text-gray-500 mt-1">E.g. 12% per year = 1% per month</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input required name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" form="addLoanForm" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">
            Create Loan
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLoanModal;