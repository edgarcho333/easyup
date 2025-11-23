
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import { Button } from '../ui/Button';
import { X, FileText, BarChart, DollarSign, Download } from 'lucide-react';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'performance' | 'financial'>('monthly');
  const [dateRange, setDateRange] = useState('this_month');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  const handleGenerate = async () => {
    if (!user?.currentOrganization) return;
    
    setIsLoading(true);
    try {
      await analyticsService.generateReport(
        user.currentOrganization.id,
        user.id,
        { type: reportType, format, dateRange }
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to generate report");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">Generate Report</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-3">
             <label className="text-sm font-medium text-slate-700">Report Type</label>
             <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setReportType('monthly')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${reportType === 'monthly' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  Monthly Summary
                </button>
                <button 
                  onClick={() => setReportType('performance')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${reportType === 'performance' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <BarChart className="h-6 w-6 mb-2" />
                  Team Performance
                </button>
                <button 
                  onClick={() => setReportType('financial')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${reportType === 'financial' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <DollarSign className="h-6 w-6 mb-2" />
                  Financial
                </button>
             </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-700">Date Range</label>
             <select 
               className="w-full rounded-md border border-slate-300 p-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none"
               value={dateRange}
               onChange={e => setDateRange(e.target.value)}
             >
               <option value="this_month">This Month</option>
               <option value="last_month">Last Month</option>
               <option value="this_quarter">This Quarter</option>
               <option value="year_to_date">Year to Date</option>
             </select>
          </div>

          {/* Format */}
          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-700">Format</label>
             <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" name="format" checked={format === 'pdf'} onChange={() => setFormat('pdf')} className="text-primary-600 focus:ring-primary-500" />
                  PDF Document
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" name="format" checked={format === 'excel'} onChange={() => setFormat('excel')} className="text-primary-600 focus:ring-primary-500" />
                  Excel Spreadsheet
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" name="format" checked={format === 'csv'} onChange={() => setFormat('csv')} className="text-primary-600 focus:ring-primary-500" />
                  CSV Data
                </label>
             </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
             <Button variant="ghost" onClick={onClose}>Cancel</Button>
             <Button onClick={handleGenerate} isLoading={isLoading}>
               <Download className="h-4 w-4 mr-2" /> Generate Report
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};