
import React, { useMemo, useState } from 'react';
import { Income, Expense, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { translate } from '../translations';
import { AreaChart, Calendar, Eye, FileText, TrendingUp, Wallet } from 'lucide-react';

interface HomeScreenProps {
  totals: {
    totalIncome: number;
    totalExpense: number;
    totalDues: number;
    currentCash: number;
  };
  incomes: Income[];
  expenses: Expense[];
  currentUser: User;
  onProfileClick: () => void;
}

const getYearMonth = (dateStr?: string) => {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const bnMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const enMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const formatYearMonth = (ym: string, isEn: boolean = false) => {
  const [y, m] = ym.split('-');
  const monthIdx = parseInt(m, 10) - 1;
  const monthName = isEn ? enMonths[monthIdx] : bnMonths[monthIdx];
  const yearName = isEn ? y : y.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)]);
  return `${monthName} ${yearName}`;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ totals, incomes, expenses, currentUser, onProfileClick }) => {
  const currentLang = currentUser.preferences?.language || 'bn';
  const isEn = currentLang === 'en';
  const isAdmin = currentUser.role === 'admin';

  // 1. Calculate uniquely available months in transaction history
  const availableMonths = useMemo(() => {
    const list = new Set<string>();
    
    // Always pre-include the actual current calendar month so it is initialized in the list even if empty
    const today = new Date();
    const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    list.add(currentYM);

    incomes.forEach(inc => {
      const ym = getYearMonth(inc.date);
      if (ym) list.add(ym);
    });
    expenses.forEach(exp => {
      const ym = getYearMonth(exp.date);
      if (ym) list.add(ym);
    });

    // Sort descending so newer months are on top
    return Array.from(list).sort((a, b) => b.localeCompare(a));
  }, [incomes, expenses]);

  // 2. Default state is the current calendar month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const isAllTime = selectedMonth === 'all';

  // 3. Filter data dynamically by the active month selection
  const filteredIncomes = useMemo(() => {
    if (isAllTime) return incomes;
    return incomes.filter(inc => getYearMonth(inc.date) === selectedMonth);
  }, [incomes, selectedMonth, isAllTime]);

  const filteredExpenses = useMemo(() => {
    if (isAllTime) return expenses;
    return expenses.filter(exp => getYearMonth(exp.date) === selectedMonth);
  }, [expenses, selectedMonth, isAllTime]);

  // 4. Calculate stats based strictly on selection
  const activeTotals = useMemo(() => {
    const totalIn = filteredIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalOut = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    return {
      totalIncome: totalIn,
      totalExpense: totalOut,
      totalDues: totals.totalDues, // Overdue/outstanding dues remain consistent across months for tracking
      currentCash: totalIn - totalOut
    };
  }, [filteredIncomes, filteredExpenses, totals.totalDues]);

  // 5. Custom Bulletproof BDT formating that is cross-compatible with Vercel and doesn't rely on OS languages setup
  const formatCurrency = (amount: number) => {
    const formattedNum = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    if (isEn) {
      return `৳ ${formattedNum}`;
    } else {
      const bnDigits = formattedNum.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)]);
      return `${bnDigits} ৳`;
    }
  };

  const toLocalNumbers = (num: number) => {
    if (isEn) return String(num);
    return String(num).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)]);
  };

  const chartData = [
    { name: isEn ? 'Income' : 'আয়', value: activeTotals.totalIncome, color: '#10b981' },
    { name: isEn ? 'Expense' : 'ব্যয়', value: activeTotals.totalExpense, color: '#ef4444' },
    { name: isEn ? 'Dues' : 'বকেয়া', value: activeTotals.totalDues, color: '#f59e0b' },
  ];

  const recentActivities = [...filteredIncomes, ...filteredExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fadeIn font-sans pb-20">
      
      {/* Dynamic Month/Archive Selector Header Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
          <Calendar size={20} className="stroke-2" />
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{translate('monthFilter', currentLang)}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-300 font-extrabold">
              {isAllTime 
                ? (isEn ? 'Showing All Combined Data' : 'সংস্থার শুরু থেকে অর্জিত সমস্ত বিবরণী') 
                : `${isEn ? 'Monthly Report for' : 'ফলাফল দেখাচ্ছে:'} ${formatYearMonth(selectedMonth, isEn)}`
              }
            </p>
          </div>
        </div>

        {/* Dynamic Month Selector */}
        <div className="flex items-center space-x-2.5">
          <label className="text-xs text-gray-400 font-black uppercase hidden md:inline-block">{translate('archiveSection', currentLang)}:</label>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold p-3 bg-gray-50 dark:bg-gray-750 text-gray-750 dark:text-gray-150 border border-gray-200 dark:border-gray-700 outline-none rounded-xl cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all shadow-3xs"
          >
            {availableMonths.map(ym => (
              <option key={ym} value={ym}>
                📅 {formatYearMonth(ym, isEn)} {ym === getYearMonth(new Date().toISOString()) ? `(${isEn ? 'Active' : 'চলতি মাস'})` : ''}
              </option>
            ))}
            <option value="all">📂 {translate('allMonths', currentLang)}</option>
          </select>
        </div>
      </div>

      {/* Welcome Message Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 relative overflow-hidden group">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
          <TrendingUp size={280} />
        </div>
        <div className="text-center md:text-left space-y-3 relative z-10">
          <h2 className="text-3.5xl font-black mb-2 tracking-tight">
            {translate('welcome', currentLang)}, {currentUser.username}!
          </h2>
          <p className="opacity-85 font-medium text-sm sm:text-base">
            {isAdmin ? translate('adminControlInfo', currentLang) : translate('userControlInfo', currentLang)}
          </p>
        </div>
        <button 
          onClick={onProfileClick}
          className="px-6 py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl font-bold transition-all flex items-center justify-center text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <i className="fas fa-user-circle mr-2 text-base"></i>
          {translate('profile', currentLang)}
        </button>
      </div>

      {/* Numerical Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={isAdmin ? (isEn ? "Total Income (All)" : "মোট আয় (সবাই)") : (isEn ? "My Total Income" : translate('myTotalIncome', currentLang))} 
          value={formatCurrency(activeTotals.totalIncome)} 
          icon="fa-money-bill-trend-up" 
          color="green" 
        />
        <StatCard 
          title={isAdmin ? (isEn ? "Total Expense (All)" : "মোট ব্যয় (সবাই)") : (isEn ? "My Total Expense" : translate('myTotalExpense', currentLang))} 
          value={formatCurrency(activeTotals.totalExpense)} 
          icon="fa-receipt" 
          color="red" 
        />
        <StatCard 
          title={isAdmin ? (isEn ? "Total Dues" : "মোট বকেয়া") : (isEn ? "My Dues" : translate('myTotalDues', currentLang))} 
          value={formatCurrency(activeTotals.totalDues)} 
          icon="fa-hourglass-half" 
          color="amber" 
        />
        <StatCard 
          title={isEn ? "Current Net Cash" : translate('currentCash', currentLang)} 
          value={formatCurrency(activeTotals.currentCash)} 
          icon="fa-wallet" 
          color="blue" 
        />
      </div>

      {/* Chart & Activities Layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dynamic transaction chart representation */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center text-gray-800 dark:text-gray-100">
              <i className="fas fa-chart-line mr-3 text-blue-500"></i>
              {translate('transactionAnalysis', currentLang)} {isAdmin ? translate('global', currentLang) : translate('personal', currentLang)}
            </h3>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">
              {isAllTime ? (isEn ? 'All-Time' : 'শুরু থেকে') : formatYearMonth(selectedMonth, isEn)}
            </span>
          </div>
          
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.06} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: '700' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
                    backgroundColor: '#1f2937', 
                    color: '#ffffff',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} maxBarSize={45}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Operations log */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center text-gray-800 dark:text-gray-100">
            <i className="fas fa-clock-rotate-left mr-3 text-indigo-500 animate-spin-slow"></i>
            {translate('recentTransactions', currentLang)}
          </h3>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-64 no-scrollbar">
            {recentActivities.length > 0 ? recentActivities.map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/50 dark:bg-gray-750/30 hover:bg-gray-100 dark:hover:bg-gray-750/70 transition-all">
                <div className="flex items-center space-x-3 text-left">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${'receiptCount' in tx ? 'bg-green-100 text-green-600 dark:bg-green-950/20' : 'bg-red-100 text-red-600 dark:bg-red-950/20'}`}>
                    <i className={`fas ${'receiptCount' in tx ? 'fa-arrow-up-right' : 'fa-arrow-down-right'} text-xs`}></i>
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-gray-800 dark:text-gray-100 line-clamp-1">{tx.item}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                      {isAdmin ? `By: ${tx.enteredBy}` : (isEn ? new Date(tx.date).toLocaleDateString('en-US') : new Date(tx.date).toLocaleDateString('bn-BD'))}
                    </p>
                  </div>
                </div>
                <p className={`font-black text-xs ${'receiptCount' in tx ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(tx.amount)}
                </p>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                <FileText className="w-12 h-12 text-gray-300 mb-2 stroke-1" />
                <p className="text-gray-400 text-xs font-bold">{translate('noTransactions', currentLang)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps { 
  title: string; 
  value: string; 
  icon: string; 
  color: string; 
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500 text-green-500',
    red: 'bg-red-500 text-red-500',
    amber: 'bg-amber-500 text-amber-500',
    blue: 'bg-blue-500 text-blue-500',
  };
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative group/card transition-all hover:shadow-md">
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 ${colorMap[color].split(' ')[0]} transition-transform group-hover/card:scale-125 duration-500`}></div>
      <div className="flex flex-col space-y-4 relative z-10 text-left">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-opacity-10 dark:bg-opacity-20 ${colorMap[color]}`}>
          <i className={`fas ${icon} text-lg`}></i>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-400 uppercase font-black tracking-wider leading-relaxed">{title}</p>
          <p className="text-2.5xl font-black mt-1 text-gray-800 dark:text-white tracking-widest">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
