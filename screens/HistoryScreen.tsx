import React, { useState, useMemo } from 'react';
import { Income, Expense, Dues, Post, User } from '../types';

interface HistoryScreenProps {
  incomes: Income[];
  expenses: Expense[];
  dues: Dues[];
  posts: Post[];
  isAdmin: boolean;
  currentUser: User;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ incomes, expenses, dues, posts, isAdmin, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'dues' | 'post'>('transactions');

  // Sorting configurations for each of the tabs
  const [txSort, setTxSort] = useState<{ key: 'date' | 'item' | 'amount'; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc'
  });
  const [duesSort, setDuesSort] = useState<{ key: 'debtorName' | 'amount'; direction: 'asc' | 'desc' }>({
    key: 'debtorName',
    direction: 'asc'
  });
  const [postSort, setPostSort] = useState<{ direction: 'asc' | 'desc' }>({
    direction: 'desc'
  });

  // Toggles for active sort headers
  const handleTxSort = (key: 'date' | 'item' | 'amount') => {
    if (txSort.key === key) {
      setTxSort(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
    } else {
      setTxSort({ key, direction: key === 'amount' ? 'desc' : 'asc' });
    }
  };

  const handleDuesSort = (key: 'debtorName' | 'amount') => {
    if (duesSort.key === key) {
      setDuesSort(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
    } else {
      setDuesSort({ key, direction: 'asc' });
    }
  };

  // Helper function for locale-aware and robust dynamic comparison
  const compareValues = (a: any, b: any, direction: 'asc' | 'desc') => {
    if (typeof a === 'string' && typeof b === 'string') {
      return direction === 'asc' 
        ? a.localeCompare(b, 'bn-BD') 
        : b.localeCompare(a, 'bn-BD');
    }
    
    if (a < b) return direction === 'asc' ? -1 : 1;
    if (a > b) return direction === 'asc' ? 1 : -1;
    return 0;
  };

  // Memoized lists processed through sorting algorithms
  const sortedTransactions = useMemo(() => {
    const list = [
      ...incomes.map(i => ({ ...i, txType: 'income' as const })),
      ...expenses.map(e => ({ ...e, txType: 'expense' as const }))
    ];

    return list.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (txSort.key === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      } else if (txSort.key === 'amount') {
        valA = a.amount;
        valB = b.amount;
      } else {
        valA = a.item || '';
        valB = b.item || '';
      }

      return compareValues(valA, valB, txSort.direction);
    });
  }, [incomes, expenses, txSort]);

  const sortedDues = useMemo(() => {
    const list = [...dues];
    return list.sort((a, b) => {
      const valA = duesSort.key === 'amount' ? a.amount : a.debtorName;
      const valB = duesSort.key === 'amount' ? b.amount : b.debtorName;
      return compareValues(valA, valB, duesSort.direction);
    });
  }, [dues, duesSort]);

  const sortedPosts = useMemo(() => {
    const list = [...posts];
    return list.sort((a, b) => {
      const valA = new Date(a.date).getTime();
      const valB = new Date(b.date).getTime();
      return postSort.direction === 'asc' ? valA - valB : valB - valA;
    });
  }, [posts, postSort]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'transactions', label: 'লেনদেন', icon: 'fa-right-left' },
          { id: 'dues', label: 'বকেয়া', icon: 'fa-clock' },
          { id: 'post', label: 'পোস্টসমূহ', icon: 'fa-signs-post' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 px-4 min-w-[100px] rounded-xl flex items-center justify-center space-x-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <i className={`fas ${tab.icon} text-sm`}></i>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase font-black">
                  <tr>
                    {/* Date Column Header */}
                    <th 
                      onClick={() => handleTxSort('date')}
                      className="px-4 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none transition-colors w-28"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>তারিখ</span>
                        <span className={`text-xs ${txSort.key === 'date' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-300'}`}>
                          {txSort.key === 'date' ? (txSort.direction === 'asc' ? '↑' : '↓') : '⇅'}
                        </span>
                      </div>
                    </th>

                    {/* Description/Item Column Header */}
                    <th 
                      onClick={() => handleTxSort('item')}
                      className="px-4 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>ক্যাটাগরি ও বিবরণ</span>
                        <span className={`text-xs ${txSort.key === 'item' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-300'}`}>
                          {txSort.key === 'item' ? (txSort.direction === 'asc' ? '↑' : '↓') : '⇅'}
                        </span>
                      </div>
                    </th>

                    {/* Amount Column Header */}
                    <th 
                      onClick={() => handleTxSort('amount')}
                      className="px-4 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none transition-colors text-right w-36"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>পরিমাণ</span>
                        <span className={`text-xs ${txSort.key === 'amount' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-300'}`}>
                          {txSort.key === 'amount' ? (txSort.direction === 'asc' ? '↑' : '↓') : '⇅'}
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {sortedTransactions.length > 0 ? sortedTransactions.map((tx: any, idx) => (
                    <TransactionRow key={idx} tx={tx} />
                  )) : (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-gray-400 font-bold">
                        কোনো লেনদেনের তথ্য পাওয়া যায়নি
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === 'dues' && (
             <table className="w-full text-left text-xs sm:text-sm">
               <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase font-black">
                 <tr>
                   {/* Name Header */}
                   <th 
                     onClick={() => handleDuesSort('debtorName')}
                     className="px-4 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none transition-colors"
                   >
                     <div className="flex items-center gap-1.5">
                       <span>নাম</span>
                       <span className={`text-xs ${duesSort.key === 'debtorName' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-300'}`}>
                         {duesSort.key === 'debtorName' ? (duesSort.direction === 'asc' ? '↑' : '↓') : '⇅'}
                       </span>
                     </div>
                   </th>

                   {/* Amount Header */}
                   <th 
                     onClick={() => handleDuesSort('amount')}
                     className="px-4 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none transition-colors text-right"
                   >
                     <div className="flex items-center justify-end gap-1.5">
                       <span>টাকা</span>
                       <span className={`text-xs ${duesSort.key === 'amount' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-300'}`}>
                         {duesSort.key === 'amount' ? (duesSort.direction === 'asc' ? '↑' : '↓') : '⇅'}
                       </span>
                     </div>
                   </th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                 {sortedDues.length > 0 ? sortedDues.map((d, i) => (
                   <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                     <td className="px-4 py-4">
                       <p className="font-bold text-gray-800 dark:text-gray-100">{d.debtorName}</p>
                       <p className="text-[10px] text-gray-400">{d.item}</p>
                     </td>
                     <td className="px-4 py-4 text-right text-amber-600 dark:text-amber-400 font-bold">{d.amount}</td>
                   </tr>
                 )) : <tr><td colSpan={2} className="p-10 text-center text-gray-400">কোনো বকেয়া নেই</td></tr>}
               </tbody>
             </table>
          )}
          
          {activeTab === 'post' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-150 flex items-center">
                  <i className="fas fa-bullhorn mr-2.5 text-indigo-500"></i>
                  প্রতিষ্ঠানের গুরুত্বপূর্ণ পোস্ট ও আপডেটসমূহ
                </h3>
                <button
                  onClick={() => setPostSort(prev => ({ direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="fas fa-sort"></i>
                  তারিখ: {postSort.direction === 'asc' ? 'পুরনো আগে' : 'নতুন আগে'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {sortedPosts.length > 0 ? sortedPosts.map((p, i) => (
                  <div key={p.id || i} className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                    {p.image && (
                      <div className="md:w-1/3 flex-shrink-0">
                        <img 
                          src={p.image} 
                          alt={p.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-48 md:h-full max-h-56 object-cover rounded-2xl border border-gray-100 dark:border-gray-750"
                        />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400">
                            আপডেট
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            <i className="far fa-user mr-1 text-gray-300"></i> লেখক: {p.enteredBy}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            <i className="far fa-calendar mr-1 text-gray-300"></i> তারিখ: {new Date(p.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-gray-900 dark:text-white leading-snug">
                          {p.title}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-650 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {p.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800/40 flex items-center justify-center">
                      <i className="fas fa-signs-post text-2xl opacity-20"></i>
                    </div>
                    <p className="text-sm font-bold">কোনো নোটিশ বা পোস্ট পাওয়া যায়নি</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TransactionRow: React.FC<{ tx: any }> = ({ tx }) => {
  const [showReceipt, setShowReceipt] = useState(false);
  return (
    <React.Fragment>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 font-bold text-xs">
        {/* 1. DATE */}
        <td className="px-4 py-4 text-gray-500 font-mono whitespace-nowrap w-28">
          {new Date(tx.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
        </td>
        
        {/* 2. CATEGORY / DESCRIPTION */}
        <td className="px-4 py-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider text-center w-fit ${
              tx.txType === 'income' 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' 
                : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600'
            }`}>
              {tx.type || (tx.txType === 'income' ? 'আয়' : 'ব্যয়')}
            </span>
            
            <p className="text-gray-850 dark:text-gray-100 font-black">{tx.item}</p>
          </div>
          
          {tx.comment && (
            <p className="text-[11px] text-gray-400 font-normal italic mt-1 font-sans">
              "{tx.comment}"
            </p>
          )}

          <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-bold">
            <span>এন্ট্রি: {tx.enteredBy}</span>
            {tx.receiptCount > 1 && <span>• রিসিট: {tx.receiptCount}টি</span>}
            {tx.payeeName && <span>• গ্রহীতা: {tx.payeeName}</span>}
          </div>
        </td>

        {/* 3. AMOUNT & PREVIEW BUTTON */}
        <td className="px-4 py-4 text-right w-36">
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-xs sm:text-sm font-black ${
              tx.txType === 'income' ? 'text-green-600' : 'text-red-650'
            }`}>
              {tx.txType === 'income' ? '+' : '-'} {tx.amount.toLocaleString()} ৳
            </span>

            {/* Receipt preview trigger icon */}
            {tx.image ? (
              <button
                onClick={() => setShowReceipt(!showReceipt)}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold cursor-pointer transition-all"
              >
                <i className="fas fa-receipt"></i>
                {showReceipt ? 'রিসিট বন্ধ ' : 'রিসিট ছবি দেখুন'}
              </button>
            ) : null}
          </div>
        </td>
      </tr>

      {/* Collapsible Receipt Preview Block */}
      {showReceipt && tx.image && (
        <tr>
          <td colSpan={3} className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/10 border-l-2 border-indigo-500">
            <div className="space-y-4 max-w-xs text-left">
              <p className="text-xs font-black text-indigo-600 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                রিসিট / ভাউচার ফাইল ভিউয়ার:
              </p>
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white p-1">
                <img 
                  src={tx.image} 
                  alt="Attached voucher" 
                  className="max-h-64 object-contain rounded-xl w-full" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export default HistoryScreen;
