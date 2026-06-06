import React, { useState, useMemo } from 'react';
import { Budget, User } from '../types';
import { 
  TrendingUp, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  PieChart, 
  DollarSign, 
  Sliders, 
  Edit, 
  FolderPlus, 
  AlertTriangle,
  Info,
  BarChart2,
  Calendar,
  RefreshCw,
  Download
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface BudgetScreenProps {
  budgets: Budget[];
  onAddBudget: (b: Omit<Budget, 'id' | 'date' | 'enteredBy'>) => void;
  onUpdateBudget: (b: Budget) => void;
  onDeleteBudget: (id: string) => void;
  currentUser: User;
  budgetCategories: string[];
  onAddBudgetCategory: (cat: string) => void;
  onDeleteBudgetCategory: (cat: string) => void;
  onClearBudgetsSpent: () => void;
  onClearAllBudgets: () => void;
}

const BudgetScreen: React.FC<BudgetScreenProps> = ({ 
  budgets, 
  onAddBudget, 
  onUpdateBudget, 
  onDeleteBudget, 
  currentUser,
  budgetCategories,
  onAddBudgetCategory,
  onDeleteBudgetCategory,
  onClearBudgetsSpent,
  onClearAllBudgets
}) => {
  const isEn = currentUser.preferences?.language === 'en';
  
  // States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryControl, setShowCategoryControl] = useState(false);
  const [showMonthRollover, setShowMonthRollover] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Add Form Attributes
  const [title, setTitle] = useState('');
  const [allocated, setAllocated] = useState('');
  const [spent, setSpent] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-stabilize initial category state when budgetCategories is loaded
  React.useEffect(() => {
    if (budgetCategories.length > 0 && !category) {
      setCategory(budgetCategories[0]);
    }
  }, [budgetCategories, category]);

  // Editing Buffer State
  const [editTitle, setEditTitle] = useState('');
  const [editAllocated, setEditAllocated] = useState('');
  const [editSpent, setEditSpent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Filtering
  const filteredBudgets = useMemo(() => {
    if (filterCategory === 'all') return budgets;
    return budgets.filter(b => b.category === filterCategory);
  }, [budgets, filterCategory]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalAllocated = filteredBudgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const totalSpent = filteredBudgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const progress = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
    return { totalAllocated, totalSpent, totalRemaining, progress };
  }, [filteredBudgets]);

  // Recharts Chart Aggregated Data
  const chartData = useMemo(() => {
    return budgetCategories.map(cat => {
      const catBudgets = budgets.filter(b => b.category === cat);
      const allocatedAmount = catBudgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
      const spentAmount = catBudgets.reduce((sum, b) => sum + b.spentAmount, 0);
      const utilization = allocatedAmount > 0 ? Math.round((spentAmount / allocatedAmount) * 100) : 0;
      return {
        name: cat,
        allocated: allocatedAmount,
        spent: spentAmount,
        utilization
      };
    }).filter(d => d.allocated > 0 || d.spent > 0); // only list categories with active allocation or spending
  }, [budgets, budgetCategories]);

  // Handle addition
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeCategory = category || budgetCategories[0];
    if (!title.trim() || !allocated) {
      alert(isEn ? 'Please fill title and allocated amount!' : 'শিরোনাম এবং বরাদ্দকৃত টাকার পরিমান আবশ্যক!');
      return;
    }
    if (!activeCategory) {
      alert(isEn ? 'Please select or add a category first!' : 'দয়া করে প্রথমে একটি ক্যাটাগরি নির্বাচন অথবা তৈরি করুন!');
      return;
    }

    onAddBudget({
      title: title.trim(),
      allocatedAmount: parseFloat(allocated) || 0,
      spentAmount: parseFloat(spent) || 0,
      category: activeCategory,
      notes: notes.trim() || undefined
    });

    // Reset Form
    setTitle('');
    setAllocated('');
    setSpent('');
    setCategory(budgetCategories[0] || '');
    setNotes('');
    setShowAddForm(false);
  };

  // Turn on edit mode for single item
  const startEdit = (b: Budget) => {
    setEditingId(b.id);
    setEditTitle(b.title);
    setEditAllocated(String(b.allocatedAmount));
    setEditSpent(String(b.spentAmount));
    setEditCategory(b.category);
    setEditNotes(b.notes || '');
  };

  // Save edit modification
  const saveEdit = (b: Budget) => {
    onUpdateBudget({
      ...b,
      title: editTitle.trim() || b.title,
      allocatedAmount: parseFloat(editAllocated) || 0,
      spentAmount: parseFloat(editSpent) || 0,
      category: editCategory || b.category,
      notes: editNotes.trim() || undefined
    });
    setEditingId(null);
  };

  // Fast manually increment or decrement spent values directly from cards
  const handleQuickSpendChange = (b: Budget, delta: number) => {
    const nextSpent = Math.max(0, b.spentAmount + delta);
    onUpdateBudget({
      ...b,
      spentAmount: nextSpent
    });
  };

  const formatNumber = (num: number) => {
    const formatted = new Intl.NumberFormat('en-US').format(num);
    if (isEn) return formatted;
    return formatted.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)]);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 text-left border border-gray-150 dark:border-gray-750 rounded-xl shadow-lg text-xs space-y-1 font-bold">
          <p className="text-gray-900 dark:text-gray-100 font-extrabold mb-1">{payload[0].payload.name}</p>
          <p className="text-teal-600 dark:text-teal-400 flex justify-between gap-4">
            <span>{isEn ? 'Allocated:' : 'বরাদ্দ:'}</span> 
            <span>{formatNumber(payload[0].value)} ৳</span>
          </p>
          <p className="text-rose-500 flex justify-between gap-4">
            <span>{isEn ? 'Spent:' : 'খরচ:'}</span> 
            <span>{formatNumber(payload[1].value)} ৳</span>
          </p>
          <p className="text-indigo-600 dark:text-indigo-400 mt-1 border-t border-gray-100 dark:border-gray-700 pt-1 flex justify-between gap-4">
            <span>{isEn ? 'Usage Ratio:' : 'ব্যবহার হার:'}</span> 
            <span>{payload[0].payload.utilization}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans pb-24 text-left">
      
      {/* Informational Hero Card */}
      <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 pointer-events-none group-hover:scale-105 transition-transform duration-500">
          <PieChart size={240} />
        </div>
        <div className="space-y-3 relative z-10">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Sliders size={32} className="text-teal-100" />
            {isEn ? 'Manual Budget Ledger' : 'ম্যানুয়াল বাজেট খতিয়ান ও ট্র্যাকার'}
          </h2>
          <p className="opacity-90 font-medium text-sm sm:text-base max-w-2xl">
            {isEn 
              ? 'This budget section is completely separate and standalone. It operates independently from your regular income/expense entry forms for direct planning.'
              : 'এই বাজেট সেকশনটি সম্পূর্ণ আলাদা ও স্বায়ত্তশাসিত। এটি সাধারণ ইনকাম বা এক্সপেন্স এন্ট্রি ফরমের সাথে কোনোভাবেই যুক্ত নয়। এখানে আপনার মনমতো বাজেট তৈরি ও ম্যানুয়ালি পরিচালনা করতে পারবেন।'
            }
          </p>
        </div>
      </div>

      {/* Aggregate Statistics Header Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-full self-start mb-4">
            {isEn ? 'Allocated Cash' : 'মোট বরাদ্দ'}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-400">{isEn ? 'Allocated Budget' : 'ডিজাইনকৃত বরাদ্দ তহবিল'}</p>
            <p className="text-2.5xl font-black text-gray-800 dark:text-gray-100 mt-1">{formatNumber(stats.totalAllocated)} ৳</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-3 py-1 rounded-full self-start mb-4">
            {isEn ? 'Spent Ledger' : 'ম্যানুয়াল খরচ'}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-400">{isEn ? 'Total Utilization' : 'উত্তোলন বা মোট খরচ'}</p>
            <p className="text-2.5xl font-black text-gray-800 dark:text-gray-100 mt-1">{formatNumber(stats.totalSpent)} ৳</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-teal-500 bg-teal-50 dark:bg-teal-950/20 px-3 py-1 rounded-full self-start mb-4">
            {isEn ? 'Balance left' : 'অবशिष्ट সঞ্চয়'}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-400">{isEn ? 'Remaining Funds' : 'বর্তমানে অবশিষ্ট খতিয়ান'}</p>
            <p className={`text-2.5xl font-black mt-1 ${stats.totalRemaining < 0 ? 'text-rose-500' : 'text-gray-800 dark:text-gray-100'}`}>
              {formatNumber(stats.totalRemaining)} ৳
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-3xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-3 py-1 rounded-full">
              {isEn ? 'Usage ratio' : 'ব্যবহার শতকরা'}
            </span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{isEn ? stats.progress : formatNumber(stats.progress)}%</span>
          </div>
          <div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden mt-1 mb-2">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${stats.progress > 100 ? 'bg-rose-500' : stats.progress > 85 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, stats.progress)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 font-bold">{isEn ? 'Overall utilization index' : 'বরাদ্দ সাপেক্ষে শতকরা ব্যবহার'}</p>
          </div>
        </div>
      </div>

      {/* Recharts 'Budget vs. Spent' Breakdown Map Visualizer */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-gray-705 pb-3 gap-2">
            <h3 className="font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-base">
              <BarChart2 className="text-teal-600 size-5" />
              {isEn ? 'Budget vs. Spent Comparison Chart' : 'বাজেট বনাম খরচ তুলনামূলক চিত্র'}
            </h3>
            <span className="text-[10px] bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-black px-3 py-1 rounded-full border border-teal-100/30 uppercase tracking-widest self-start">
              {isEn ? 'Active Categories' : 'সক্রিয় ক্যাটাগরি সমূহের চিত্র'}
            </span>
          </div>

          <div className="h-68 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: currentUser.preferences?.theme === 'dark' ? '#9ca3af' : '#4b5563', fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: currentUser.preferences?.theme === 'dark' ? '#9ca3af' : '#4b5563', fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  unit="৳"
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} />
                <Legend 
                  verticalAlign="top" 
                  height={32} 
                  iconType="circle" 
                  iconSize={6}
                  wrapperStyle={{ fontSize: 10, fontWeight: 700 }}
                />
                <Bar 
                  name={isEn ? "Allocated BDT" : "বরাদ্দকৃত বাজেট (৳)"} 
                  dataKey="allocated" 
                  fill="#0f766e" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  name={isEn ? "Spent BDT" : "ম্যানুয়ালি খরচ (৳)"} 
                  dataKey="spent" 
                  fill="#e11d48" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Control Actions Panel */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        
        {/* Category filtering tab */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs text-gray-400 font-black uppercase whitespace-nowrap">{isEn ? 'Filter Category:' : 'ক্যাটাগরি ফিল্টার:'}</label>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs font-bold p-3 bg-gray-50 dark:bg-gray-750 text-gray-800 dark:text-gray-105 border border-gray-150 dark:border-gray-750 outline-none rounded-xl cursor-pointer focus:ring-2 focus:ring-teal-500 flex-grow sm:flex-grow-0"
          >
            <option value="all">📂 {isEn ? 'All Categories' : 'সার্বিক ক্যাটাগরি'}</option>
            {budgetCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Category customized control toggle */}
          <button
            type="button"
            onClick={() => {
              setShowCategoryControl(!showCategoryControl);
              setShowMonthRollover(false);
            }}
            className="flex-grow sm:flex-grow-0 py-3 px-5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-indigo-100 dark:border-indigo-900/30"
          >
            <Sliders size={15} />
            <span>{showCategoryControl ? (isEn ? 'Close Control' : 'কন্ট্রোল বন্ধ') : (isEn ? 'Category Control' : 'ক্যাটাগরি নিয়ন্ত্রণ')}</span>
          </button>

          {/* New Month Rollover Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setShowMonthRollover(!showMonthRollover);
              setShowCategoryControl(false);
            }}
            className="flex-grow sm:flex-grow-0 py-3 px-5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-amber-100 dark:border-amber-900/30"
          >
            <Calendar size={15} />
            <span>{showMonthRollover ? (isEn ? 'Close Rollover' : 'রোলওভার বন্ধ') : (isEn ? 'New Month Option' : 'নতুন মাস আনুন')}</span>
          </button>

          {/* Add budget button */}
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-grow sm:flex-grow-0 py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            {showAddForm ? <X size={15} /> : <Plus size={15} />}
            <span>{showAddForm ? (isEn ? 'Hide Creator' : 'ফরম বন্ধ করুন') : (isEn ? 'Add New Budget Item' : 'নতুন বাজেট সংযোজন')}</span>
          </button>
        </div>
      </div>

      {/* Month Rollover Action Panel */}
      {showMonthRollover && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-amber-100 dark:border-amber-950/50 shadow-sm space-y-6 animate-slideDown text-left">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
            <h4 className="text-sm font-black text-amber-650 dark:text-amber-400 flex items-center gap-2">
              <Calendar size={18} />
              {isEn ? 'Start a New Month / Rollover Control' : 'নতুন মাসের জন্য বাজেট খাতা প্রস্তুতকরণ ও ট্রানজিশন প্যানেল'}
            </h4>
            <button 
              onClick={() => setShowMonthRollover(false)} 
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-650 animate-fadeIn"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed font-semibold">
            {isEn 
              ? 'When the month ends, you can prepare this manual ledger for the upcoming month using one of the primary workflows below. You can also export or copy your current stats for offline journaling.'
              : 'মাস শেষ হলে আপনি আগামী মাসের লেনদেনের জন্য নিচের যেকোনো একটি পদ্ধতিতে বাজেট খতিয়ানের ড্যাশবোর্ডটি রূপান্তর করতে পারবেন। দুর্ঘটনা এড়াতে পরিবর্তনের পূর্বে ব্যাকআপ তথ্য সংরক্ষণ ও পূর্বের মাসের সারাংশ পড়ার ব্যবস্থা রয়েছে।'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* Quick Actions Card 1: Reset Spent but keep Budgets */}
            <div className="bg-amber-50/30 dark:bg-amber-950/5 p-5 rounded-2xl border border-amber-100/50 dark:border-amber-900/10 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-650 flex items-center justify-center flex-shrink-0">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h5 className="text-xs font-black text-gray-800 dark:text-gray-150">
                    {isEn ? 'Option A: Reset Spent to Zero (Keep Limits)' : 'পদ্ধতি ১: খরচ ০ করে বাজেট লিমিট বজায় রাখুন'}
                  </h5>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                    {isEn ? 'Recommended: Keeps same categories & budget amounts.' : 'ইউপযুক্ত ও সহজ: বর্তমান বাজেট সেটগুলো ঠিক রেখে ব্যয় বা ইউটিলাইজেশন ০ করে নতুন মাস শুরু করা হবে।'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(isEn 
                    ? 'Are you sure you want to reset all spent amounts to zero? This action keeps your active budgets but clears their spent values to start the new month!' 
                    : 'আপনি কি নিশ্চিত যে সমস্ত বাজেট আইটেমের ম্যানুয়াল খরচ রিসেট করে ০ করতে চান? এর ফলে বাজেট লিমিট ও পরিকল্পনাগুলো আগামী মাসের জন্য হুবহু সংরক্ষিত থাকবে কিন্তু খরচ নতুন করে কাউন্ট হবে!'
                  )) {
                    onClearBudgetsSpent();
                    setShowMonthRollover(false);
                    alert(isEn ? 'Successfully reset all spent amounts to 0!' : 'সফলভাবে সমস্ত খরচ শূন্য (০) করে নতুন মাস শুরু করা হয়েছে!');
                  }
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
              >
                <RefreshCw size={14} />
                <span>{isEn ? 'Reset Spent only' : 'শুধুমাত্র ব্যয় রিসেট করুন'}</span>
              </button>
            </div>

            {/* Quick Actions Card 2: Reset All (Delete everything) */}
            <div className="bg-rose-50/30 dark:bg-rose-950/5 p-5 rounded-2xl border border-rose-100/50 dark:border-rose-900/10 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h5 className="text-xs font-black text-gray-800 dark:text-gray-150">
                    {isEn ? 'Option B: Clean Reset (Delete All Budgets)' : 'পদ্ধতি ২: বাজেট সমূহের সম্পূর্ণ খাতা মোছা'}
                  </h5>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                    {isEn ? 'Start from blank: Deletes all budgets from layout.' : 'পূর্ণ নতুনত্ব: চলমান সব বাজেট আইটেম সম্পূর্ণ ক্লিয়ার করে সম্পূর্ণ ফ্রেশ একটি নতুন তালিকা শুরু করা হবে।'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(isEn 
                    ? 'WARNING: This will permanently delete ALL active budget items from your screen! Are you sure you want to proceed?' 
                    : 'সতর্কবার্তা: এটি আপনার স্ক্রিন থেকে চলমান সমস্ত বাজেট বিবরণী স্থায়ীভাবে ডিলিট করে দেবে! আপনি কি একদম খালি ড্যাশবোর্ড নিয়ে নতুন মাস শুরু করতে চান?'
                  )) {
                    onClearAllBudgets();
                    setShowMonthRollover(false);
                    alert(isEn ? 'Successfully cleared all budget items!' : 'সফলভাবে চলমান সব বাজেট ক্লিয়ার করে নতুন মাস শুরু করা হয়েছে!');
                  }
                }}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
              >
                <Trash2 size={14} />
                <span>{isEn ? 'Clear All Budgets' : 'সম্পূর্ণ তথ্য মুছে ক্লিয়ার করুন'}</span>
              </button>
            </div>

          </div>

          {/* Quick Copyable Summary Report */}
          <div className="bg-gray-50 dark:bg-gray-750/30 p-5 rounded-2xl border border-gray-150 dark:border-gray-750 space-y-3.5 text-left text-xs text-gray-500">
            <h5 className="text-xs font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Download size={15} className="text-teal-600" />
              {isEn ? 'Previous Month Summary Report & Backup' : 'পূর্ববর্তী মাসের খতিয়ান ও রিসিট সারাংশ সংরক্ষণ'}
            </h5>
            <p className="text-[10px] text-gray-450 leading-relaxed font-semibold">
              {isEn 
                ? 'Before starting your next month, you can download a text summary log of your existing budget for bookkeeping and records.'
                : 'পরবর্তী মাসের কার্যক্রম চালু করার আগে, আপনার চলমান খতিয়ানের চূড়ান্ত হিসেবটি একটি টেক্সট ফাইল হিসেবে আপনার ডিভাইসে ডাউনলোড করে রাখতে পারেন যাতে পরবর্তীতে মেলাতে সুবিধা হয়।'
              }
            </p>

            <button
              type="button"
              onClick={() => {
                const dateStr = new Date().toLocaleDateString('bn-BD');
                let summary = isEn 
                  ? `Manual Budget Ledger Year-Month Report\nReport Created: ${new Date().toLocaleDateString()}\n=====================================\n\n`
                  : `ম্যানুয়াল বাজেট সারাংশ রিপোর্ট\nরিপোর্ট তৈরির তারিখ: ${dateStr}\n=====================================\n\n`;

                summary += isEn ? `Summary Indexes:\n----------------\n` : `সাধারণ সূচক সমূহ:\n---------------\n`;
                summary += `${isEn ? 'Total Allocated' : 'মোট বরাদ্দ'}: ${stats.totalAllocated} BDT\n`;
                summary += `${isEn ? 'Total Spent' : 'মোট খরচ'}: ${stats.totalSpent} BDT\n`;
                summary += `${isEn ? 'Remaining Funds' : 'অবशिष्ट সঞ্চয়'}: ${stats.totalRemaining} BDT\n`;
                summary += `${isEn ? 'Utilization Rate' : 'ব্যবহার হার'}: ${stats.progress}%\n\n`;

                summary += isEn ? `Itemized Budget Items Detail:\n---------------------------\n` : `আইটেমভিত্তিক বাজেট বিবরণী:\n--------------------------\n`;
                
                budgets.forEach((b, i) => {
                  summary += `${i + 1}. [${b.category}] ${b.title}\n`;
                  summary += `   - ${isEn ? 'Allocated Limit' : 'নির্ধারিত বরাদ্দ'}: ${b.allocatedAmount} BDT\n`;
                  summary += `   - ${isEn ? 'Manually Spent' : 'ব্যয় হয়েছে'}: ${b.spentAmount} BDT\n`;
                  summary += `   - ${isEn ? 'Difference' : 'পার্থক্য'}: ${b.allocatedAmount - b.spentAmount} BDT\n`;
                  if (b.notes) summary += `   - ${isEn ? 'Notes' : 'মন্তব্য'}: ${b.notes}\n`;
                  summary += `\n`;
                });

                const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = isEn ? `budget_summary_${new Date().toISOString().slice(0, 7)}.txt` : `বাজেট_সারাংশ_${new Date().toISOString().slice(0, 7)}.txt`;
                a.click();
              }}
              className="py-2.5 px-4 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/45 text-teal-600 dark:text-teal-400 font-extrabold text-[10px] rounded-xl transition-all inline-flex items-center space-x-1.5 border border-teal-150/30 cursor-pointer"
            >
              <Download size={13} />
              <span>{isEn ? 'Download bookkeeping summary report (.txt)' : 'ডাউনলোড সারাংশ ফাইল (.txt)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Double Accordion Custom Category Settings Area */}
      {showCategoryControl && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-indigo-100 dark:border-indigo-950/50 shadow-sm space-y-4 animate-slideDown">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
            <h4 className="text-sm font-black text-indigo-600 flex items-center gap-2">
              <Sliders size={18} />
              {isEn ? 'Budget Categories Settings' : 'বাজেট ক্যাটাগরি নিয়ন্ত্রণ ও কাস্টমাইজ করুন'}
            </h4>
            <button 
              onClick={() => setShowCategoryControl(false)} 
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-650"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Adding Category Form */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                {isEn ? 'Add New Budget Category' : 'নতুন বাজেট ক্যাটাগরি তৈরি'}
              </label>
              <div className="flex gap-2.5">
                <input 
                  type="text" 
                  placeholder={isEn ? "e.g., Office Tea & Refreshments" : "যেমন: অফিস উৎসব বা প্রোগ্রাম"}
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  className="flex-grow text-xs p-3.5 bg-gray-50 dark:bg-gray-750 border border-gray-150 dark:border-gray-750 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
                <button
                  onClick={() => {
                    const clean = newCategoryInput.trim();
                    if (!clean) return;
                    if (budgetCategories.includes(clean)) {
                      alert(isEn ? 'Category already exists!' : 'ক্যাটাগরি ইতিমধ্যে তালিকাভুক্ত আছে!');
                      return;
                    }
                    onAddBudgetCategory(clean);
                    setNewCategoryInput('');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 leading-normal">
                {isEn 
                  ? 'Adding a custom category allows you to select it instantly in any standalone budget creation form.'
                  : 'নতুন ক্যাটাগরি যোগ করলে তা বাজেট তৈরির ফর্মে এবং ফিল্টারিং লিস্টে সাথে সাথে যুক্ত হবে।'
                }
              </p>
            </div>

            {/* List & Deleting existing Categories */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                {isEn ? 'Active Budget Categories List' : 'বিদ্যমান বাজেট ক্যাটাগরি তালিকা'}
              </label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1.5 bg-gray-50 dark:bg-gray-750/30 rounded-2xl border border-gray-150/50 dark:border-gray-750">
                {budgetCategories.map(cat => (
                  <span 
                    key={cat}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700/80 rounded-xl font-bold text-xs"
                  >
                    <span>{cat}</span>
                    <button 
                      onClick={() => {
                        const hasBudgetWithCat = budgets.some(b => b.category === cat);
                        if (hasBudgetWithCat) {
                          if (!window.confirm(isEn 
                            ? 'Warning: This category has active budget items. Do you want to delete it anyway?' 
                            : 'সতর্কতা: এই ক্যাটাগরিতে ইতিমধ্যে বাজেট এন্ট্রি রয়েছে। আপনি কি তবুও এটি ডিলিট করতে চান?'
                          )) {
                            return;
                          }
                        }
                        onDeleteBudgetCategory(cat);
                        if (filterCategory === cat) setFilterCategory('all');
                      }}
                      className="p-0.5 hover:text-rose-500 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accordion Style Collapsible Budget Generator */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-teal-200 dark:border-teal-900/50 shadow-md space-y-5 animate-slideDown">
          <h3 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider border-b border-gray-100 dark:border-gray-750 pb-3 flex items-center gap-2">
            <Plus size={18} className="text-teal-600 animate-pulse" />
            {isEn ? 'Plan a Standalone Budget Goal' : 'সম্পূর্ণ আলাদা নতুন বাজেট খসড়া তৈরি করুন'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">{isEn ? 'Budget Title' : 'বাজেটের নাম / শিরোনাম'}</label>
              <input 
                type="text" 
                placeholder={isEn ? "e.g., Office Renovate May" : "যেমন: মে মাসের অফিস খাবার ও চা-নাস্তা খরচ"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-xs p-3.5 bg-gray-50 dark:bg-gray-750 border border-gray-150 dark:border-gray-750 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">{isEn ? 'Budget Category' : 'বাজেটের তালিকাভুক্ত ক্যাটাগরি'}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-3.5 bg-gray-50 dark:bg-gray-750 border border-gray-150 dark:border-gray-750 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold animate-fadeIn"
              >
                {budgetCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">{isEn ? 'Allocated Limit (BDT)' : 'নির্ধারিত বাজেট বা বরাদ্দকৃত টাকা (৳)'}</label>
              <input 
                type="number" 
                placeholder="0.00"
                value={allocated}
                onChange={(e) => setAllocated(e.target.value)}
                required
                className="w-full text-xs p-3.5 bg-gray-50 dark:bg-gray-750 border border-gray-150 dark:border-gray-750 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">{isEn ? 'Initial Spent Cash (Optional)' : 'প্রাথমিক ব্যয়কৃত টাকা (ঐচ্ছিক)'}</label>
              <input 
                type="number" 
                placeholder="0.00"
                value={spent}
                onChange={(e) => setSpent(e.target.value)}
                className="w-full text-xs p-3.5 bg-gray-50 dark:bg-gray-750 border border-gray-150 dark:border-gray-750 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">{isEn ? 'Additional Planning Notes' : 'পরিকল্পনা বা অতিরিক্ত মন্তব্য (ঐচ্ছিক)'}</label>
              <textarea 
                placeholder={isEn ? "Add any description regarding this allocation goal" : "এই বাজেটের জন্য নির্দিষ্ট কোনো গাইডলাইন বা অতিরিক্ত তথ্য থাকলে লিখে রাখুন..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full text-xs p-3.5 bg-gray-50 dark:bg-gray-750 border border-gray-150 dark:border-gray-750 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold resize-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs sm:text-sm tracking-wider transition-all shadow-sm cursor-pointer"
          >
            {isEn ? 'Confirm Setup Budget Goal 🌟' : 'নিশ্চিতভাবে নতুন বাজেট যোগ করুন 🌟'}
          </button>
        </form>
      )}

      {/* Grid listing the Budget Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBudgets.length > 0 ? (
          filteredBudgets.map(b => {
            const isEditing = editingId === b.id;
            const usePercent = b.allocatedAmount > 0 ? Math.round((b.spentAmount / b.allocatedAmount) * 100) : 0;
            const isOver = b.spentAmount > b.allocatedAmount;

            return (
              <div 
                key={b.id} 
                className={`bg-white dark:bg-gray-800 rounded-3xl p-6 border-2 transition-all ${
                  isOver 
                    ? 'border-rose-200 dark:border-rose-950/40 shadow-rose-50/50' 
                    : usePercent >= 85 
                      ? 'border-amber-200 dark:border-amber-950/40 shadow-amber-50/50' 
                      : 'border-gray-100 dark:border-gray-750'
                } hover:shadow-md flex flex-col justify-between space-y-5`}
              >
                
                {/* Editing panel screen inside card */}
                {isEditing ? (
                  <div className="space-y-4 text-left">
                    <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700 pb-2">
                      <span className="text-xs font-black text-teal-600 uppercase tracking-widest">{isEn ? 'Edit Mode' : 'বাজেট সম্পাদনা প্যানেল'}</span>
                      <div className="flex space-x-1.5">
                        <button onClick={() => saveEdit(b)} className="p-1 px-2.5 bg-green-500 text-white font-bold text-[10px] rounded hover:bg-green-600" title="রক্ষণ">
                          {isEn ? 'Save' : 'সংরক্ষণ'}
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 px-2.5 bg-gray-500 text-white font-bold text-[10px] rounded hover:bg-gray-650" title="বাতিল">
                          {isEn ? 'Cancel' : 'বাতিল'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase font-bold text-gray-400">{isEn ? 'Title' : 'শিরোনাম'}</label>
                        <input 
                          type="text" 
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-xs p-2 rounded bg-gray-50 dark:bg-gray-750 border-none font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[9px] uppercase font-bold text-gray-400">{isEn ? 'Allocated (Limit)' : 'বরাদ্দ টাকা'}</label>
                          <input 
                            type="number" 
                            value={editAllocated}
                            onChange={(e) => setEditAllocated(e.target.value)}
                            className="w-full text-xs p-2 rounded bg-gray-50 dark:bg-gray-750 border-none font-bold font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] uppercase font-bold text-gray-400">{isEn ? 'Spent' : 'খরচকৃত টাকা'}</label>
                          <input 
                            type="number" 
                            value={editSpent}
                            onChange={(e) => setEditSpent(e.target.value)}
                            className="w-full text-xs p-2 rounded bg-gray-50 dark:bg-gray-750 border-none font-bold font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase font-bold text-gray-400">{isEn ? 'Category' : 'ক্যাটাগরি'}</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full text-xs p-2 rounded bg-gray-50 dark:bg-gray-750 border-none font-bold"
                        >
                          {budgetCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase font-bold text-gray-400">{isEn ? 'Planning Notes' : 'পরিকল্পনা মন্তব্য'}</label>
                        <textarea 
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={2}
                          className="w-full text-xs p-2 rounded bg-gray-50 dark:bg-gray-750 border-none font-bold resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard listing screen inside card */
                  <div className="space-y-4">
                    
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-100/30">
                          {b.category}
                        </span>
                        <h4 className="text-base font-black text-gray-900 dark:text-white leading-snug line-clamp-2">
                          {b.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button 
                          onClick={() => startEdit(b)}
                          className="p-1.5 text-gray-400 hover:text-teal-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                          title="সম্পাদনা"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(isEn ? 'Are you sure you want to delete this budget?' : 'আপনি কি নিশ্চিত বাজেট অপশনটি ডিলিট করতে চান?')) {
                              onDeleteBudget(b.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                          title="স্মরণ করুন"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Indicators */}
                    <div className="space-y-1.5 bg-gray-50/50 dark:bg-gray-750/30 p-4 rounded-2xl border border-gray-100/50 dark:border-gray-750">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-gray-400">{isEn ? 'Allocation Limit/Target' : 'সর্বোচ্চ বরাদ্দকৃত সীমা'}</span>
                        <span className="text-gray-700 dark:text-gray-200">{formatNumber(b.allocatedAmount)} ৳</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-gray-400">{isEn ? 'Manually Utilized' : 'ম্যানুয়ালি খরচকৃত এন্ট্রি'}</span>
                        <span className={isOver ? 'text-rose-500' : 'text-emerald-500'}>
                          {formatNumber(b.spentAmount)} ৳ 
                          <span className="text-[10px] ml-1 opacity-70">({formatNumber(usePercent)}%)</span>
                        </span>
                      </div>

                      {/* Manual Dynamic Bar indicator */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden mt-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-rose-500' : usePercent > 85 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, usePercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Manual Increments adjustment controls */}
                    <div className="flex items-center justify-between gap-2.5">
                      <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">{isEn ? 'Manual spent adjuster' : 'ম্যানুয়াল খরচ সমন্বয়:'}</span>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => handleQuickSpendChange(b, -500)}
                          className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 rounded-lg text-[10px] font-black transition-colors"
                        >
                          - ৫০০ ৳
                        </button>
                        <button 
                          onClick={() => handleQuickSpendChange(b, -100)}
                          className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 rounded-lg text-[10px] font-black transition-colors"
                        >
                          - ১০০ ৳
                        </button>
                        <button 
                          onClick={() => handleQuickSpendChange(b, 100)}
                          className="px-2.5 py-1.5 bg-teal-50 dark:bg-teal-950/20 hover:bg-teal-100 dark:hover:bg-teal-950/40 text-teal-600 rounded-lg text-[10px] font-black transition-colors"
                        >
                          + ১০০ ৳
                        </button>
                        <button 
                          onClick={() => handleQuickSpendChange(b, 500)}
                          className="px-2.5 py-1.5 bg-teal-50 dark:bg-teal-950/20 hover:bg-teal-100 dark:hover:bg-teal-950/40 text-teal-600 rounded-lg text-[10px] font-black transition-colors"
                        >
                          + ৫০০ ৳
                        </button>
                      </div>
                    </div>

                    {/* Overlimit Warning Trigger */}
                    {isOver && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-950/30 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                        <AlertTriangle size={15} className="text-rose-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] font-bold text-rose-500 leading-normal">
                          {isEn 
                            ? `Warning: This budget allocation is over limit by ${formatNumber(b.spentAmount - b.allocatedAmount)} ৳!`
                            : `সতর্কতা: এই বাজেট বরাদ্দকৃত সীমার চেয়ে ${formatNumber(b.spentAmount - b.allocatedAmount)} ৳ অতিরিক্ত ওভারফ্লো হয়েছে!`
                          }
                        </p>
                      </div>
                    )}

                    {/* Display notes if any */}
                    {b.notes && (
                      <div className="flex items-start gap-2 text-xs text-gray-400 font-medium">
                        <Info size={13} className="mt-0.5 flex-shrink-0 text-gray-300" />
                        <p className="line-clamp-2 text-left text-[11px] font-semibold italic">"{b.notes}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer timestamp */}
                {!isEditing && (
                  <div className="border-t border-gray-100 dark:border-gray-750/50 pt-3 flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>{isEn ? `Author: ${b.enteredBy}` : `পরিকল্পক: ${b.enteredBy}`}</span>
                    <span>{new Date(b.date).toLocaleDateString('bn-BD')}</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="md:col-span-2 py-20 text-center bg-gray-100/30 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-3">
            <Sliders size={40} className="text-gray-300 stroke-1.5" />
            <p className="text-gray-400 font-bold text-xs">{isEn ? 'No Budget items found in this section!' : 'এই সেকশনে আপনার কোনো বাজেট খাতা নেই!'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetScreen;
