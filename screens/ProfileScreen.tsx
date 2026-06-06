
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Settings, 
  Database, 
  ArrowUpRight, 
  ArrowDownRight, 
  CalendarCheck, 
  Clock, 
  Globe, 
  Moon, 
  Sun,
  Edit2,
  Check,
  X,
  Sliders,
  Plus,
  Trash2,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { User, Income, Expense, Post, Dues } from '../types';

interface ProfileScreenProps {
  user: User;
  incomes: Income[];
  expenses: Expense[];
  posts: Post[];
  dues: Dues[];
  onUpdateProfile: (user: User) => void;
  incomeCategories: string[];
  expenseCategories: string[];
  onAddIncomeCategory: (cat: string) => void;
  onDeleteIncomeCategory: (cat: string) => void;
  onAddExpenseCategory: (cat: string) => void;
  onDeleteExpenseCategory: (cat: string) => void;
  onDeleteIncome: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteDues: (id: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  user, 
  incomes, 
  expenses, 
  posts, 
  dues,
  onUpdateProfile,
  incomeCategories,
  expenseCategories,
  onAddIncomeCategory,
  onDeleteIncomeCategory,
  onAddExpenseCategory,
  onDeleteExpenseCategory,
  onDeleteIncome,
  onDeleteExpense,
  onDeleteDues
}) => {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState(user.email || '');
  const isEn = user.preferences?.language === 'en';

  const userStats = useMemo(() => {
    const userIncomes = incomes.filter(i => i.enteredBy === user.username);
    const userExpenses = expenses.filter(e => e.enteredBy === user.username);
    const userPosts = posts.filter(p => p.enteredBy === user.username);
    const userDues = dues.filter(d => d.enteredBy === user.username);

    const totalIncome = userIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = userExpenses.reduce((sum, e) => sum + e.amount, 0);

    const recentActivity = [
      ...userIncomes.map(i => ({ id: `income-${i.id}`, item: i.item, amount: i.amount, date: i.date, type: 'Income', icon: ArrowUpRight, color: 'text-green-500', bg: 'bg-green-500/10' })),
      ...userExpenses.map(e => ({ id: `expense-${e.id}`, item: e.item, amount: e.amount, date: e.date, type: 'Expense', icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-500/10' })),
      ...userDues.map(d => ({ id: `dues-${d.id}`, item: d.item, amount: d.amount, date: d.dueDate, type: 'Dues', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' }))
    ]
      .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
      .slice(0, 8);

    return {
      totalIncome,
      totalExpense,
      totalEntries: userIncomes.length + userExpenses.length + userPosts.length + userDues.length,
      postsCount: userPosts.length,
      recentActivity
    };
  }, [user, incomes, expenses, posts, dues]);

  const handleSaveEmail = () => {
    onUpdateProfile({ ...user, email: editedEmail });
    setIsEditingEmail(false);
  };

  const handlePreferenceToggle = (type: 'theme' | 'language') => {
    const newPrefs = { ...user.preferences };
    if (type === 'theme') {
      newPrefs.theme = user.preferences?.theme === 'dark' ? 'light' : 'dark';
      // Apply theme change
      if (newPrefs.theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
    } else {
      newPrefs.language = user.preferences?.language === 'en' ? 'bn' : 'en';
    }
    onUpdateProfile({ ...user, preferences: newPrefs });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20 pt-4">
      {/* 1. Identity Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.07]">
            <UserIcon size={200} />
        </div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="relative group">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.username} 
                className="w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl border-4 border-indigo-600 dark:border-indigo-400"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl shadow-indigo-200 dark:shadow-none">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            
            {user.avatar && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(isEn ? 'Remove profile picture?' : 'প্রোফাইল ছবি ডিলিট করবেন?')) {
                    onUpdateProfile({ ...user, avatar: undefined });
                  }
                }}
                className="absolute top-0 right-0 p-1.5 bg-red-650 hover:bg-red-700 text-white rounded-full transition-transform hover:scale-110 shadow-md cursor-pointer z-20"
                title={isEn ? "Remove photo" : "ছবি ডিলিট করুন"}
              >
                <X size={12} />
              </button>
            )}

            <label className="absolute inset-x-0 bottom-0 bg-black/50 hover:bg-black/70 rounded-b-[2.5rem] py-1.5 flex items-center justify-center cursor-pointer transition-all">
              <span className="text-[10px] text-white font-bold text-center tracking-wide">
                {isEn ? 'Upload' : 'আপলোড'}
              </span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      alert(isEn ? 'Max file size is 2MB!' : 'ফাইলের সাইজ সর্বোচ্চ ২ মেগাবাইট হতে হবে!');
                      return;
                    }
                    const rd = new FileReader();
                    rd.onloadend = () => {
                      onUpdateProfile({ ...user, avatar: rd.result as string });
                    };
                    rd.readAsDataURL(file);
                  }
                }}
                className="hidden" 
              />
            </label>
            <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full flex items-center justify-center text-white">
                <ShieldCheck size={20} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {user.username}
                </h1>
                <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest ${
                  user.role === 'admin' 
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                }`}>
                  {user.role === 'admin' ? 'এডমিন' : 'ইউজার'}
                </span>
              </div>
              <p className="text-gray-400 font-medium mt-1 uppercase text-xs tracking-widest">
                  আইডি: {user.id.slice(0, 8)}
              </p>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-300">
                    <Mail size={18} className="text-indigo-500" />
                    {isEditingEmail ? (
                        <div className="flex items-center gap-2">
                            <input 
                                type="email" 
                                value={editedEmail}
                                onChange={(e) => setEditedEmail(e.target.value)}
                                className="bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                autoFocus
                            />
                            <button onClick={handleSaveEmail} className="p-1 hover:text-green-500 transition-colors">
                                <Check size={16} />
                            </button>
                            <button onClick={() => setIsEditingEmail(false)} className="p-1 hover:text-red-500 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group">
                            <span className="font-medium">{user.email || 'ইমেইল যোগ করুন'}</span>
                            <button 
                                onClick={() => setIsEditingEmail(true)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-500 transition-all"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <Globe size={18} className="text-blue-400" />
                    <span>ভাষা: {user.preferences?.language === 'en' ? 'English' : 'বাংলা'}</span>
                </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard delay={0.1} icon={Database} label="মোট এন্ট্রি" value={userStats.totalEntries} color="indigo" />
        <StatCard delay={0.2} icon={ArrowUpRight} label="আমার আয়" value={`${userStats.totalIncome} ৳`} color="green" />
        <StatCard delay={0.3} icon={ArrowDownRight} label="আমার খরচ" value={`${userStats.totalExpense} ৳`} color="red" />
        <StatCard delay={0.4} icon={Activity} label="পোস্ট সংখ্যা" value={userStats.postsCount} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Preferences Section */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1 space-y-4"
        >
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                        <Settings size={20} />
                    </div>
                    <h3 className="font-bold text-lg dark:text-white">সেটিংস</h3>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => handlePreferenceToggle('theme')}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            {user.preferences?.theme === 'dark' ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-amber-500" />}
                            <span className="font-semibold text-gray-700 dark:text-gray-200">ডার্ক মোড</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${user.preferences?.theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${user.preferences?.theme === 'dark' ? 'left-6' : 'left-1'}`}></div>
                        </div>
                    </button>

                    <button 
                         onClick={() => handlePreferenceToggle('language')}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Globe size={18} className="text-indigo-500" />
                            <span className="font-semibold text-gray-700 dark:text-gray-200">ভাষা</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-300 px-3 py-1 rounded-lg uppercase">
                            {user.preferences?.language === 'en' ? 'EN' : 'BN'}
                        </span>
                    </button>
                    
                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 mt-4">
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                            আপনি যেভাবে ডাটাবেস দেখতে চান তা এখানে সেটআপ করতে পারেন।
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>

        {/* 4. Activity Log */}
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
        >
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                            <Activity size={20} />
                        </div>
                        <h3 className="font-bold text-lg dark:text-white">সাম্প্রতিক কার্যক্রম</h3>
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">সর্বশেষ ৮টি</span>
                </div>

                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    <AnimatePresence mode="popLayout">
                        {userStats.recentActivity.length > 0 ? userStats.recentActivity.map((act: any, idx) => (
                            <motion.div 
                                key={act.id} 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${act.bg} ${act.color}`}>
                                        <act.icon size={22} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{act.item}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md ${act.bg} ${act.color}`}>
                                                {act.type === 'Income' ? 'আয়' : act.type === 'Expense' ? 'ব্যয়' : 'বকেয়া'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                                                <CalendarCheck size={10} />
                                                {new Date(act.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className={`font-black text-lg ${act.color}`}>
                                        {act.type === 'Income' ? '+' : '-'} {act.amount.toLocaleString()} ৳
                                    </p>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                                    <Activity size={32} className="opacity-20" />
                                </div>
                                <p className="text-sm font-medium">এখনও কোনো কার্যক্রম নেই</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
      </div>

      {/* 5. Custom Entry Form Control & Management Center */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-8 text-left"
      >
        <div className="border-b border-gray-50 dark:border-gray-700 pb-5">
          <h3 className="text-2xl font-black text-gray-950 dark:text-white flex items-center gap-3">
            <Sliders size={26} className="text-indigo-600 animate-pulse" />
            {isEn ? 'Entry Form Manual Control Panel' : 'এন্ট্রি ফরম ম্যানুয়াল কন্ট্রোল প্যানেল'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {isEn 
              ? 'Manually customize available categories inside forms or erase invalid entries directly.'
              : 'এন্ট্রি ফরমের ভেতরের ক্যাটাগরি অপশনগুলো এখান থেকে যোগ বা ডিলিট করুন এবং যেকোনো ভুল এন্ট্রি বাতিল করুন।'
            }
          </p>
        </div>

        {/* Categories Control Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* INCOME form options control */}
          <div className="space-y-4 bg-gray-50/50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-150/40 dark:border-gray-750">
            <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center justify-between">
              <span>🟢 {isEn ? 'Income Form Categories' : 'আয় বা ইনকাম ক্যাটাগরি অপশন'}</span>
              <span className="text-[10px] text-gray-400 lowercase font-bold">{incomeCategories.length} {isEn ? 'options' : 'ক্যাটাগরি'}</span>
            </h4>

            {/* List of categories */}
            <div className="flex flex-wrap gap-2 py-2">
              {incomeCategories.map(cat => (
                <span 
                  key={cat} 
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-850 dark:text-gray-100 text-xs font-bold rounded-xl border border-gray-150 dark:border-gray-700 flex items-center gap-2 group hover:border-emerald-300 dark:hover:border-emerald-900 transition-all"
                >
                  {cat}
                  <button 
                    onClick={() => {
                      if (incomeCategories.length <= 1) {
                        alert(isEn ? 'Must keep at least 1 category!' : 'অবশ্যই অন্তত একটি ক্যাটাগরি থাকতে হবে!');
                        return;
                      }
                      onDeleteIncomeCategory(cat);
                    }}
                    className="text-gray-300 hover:text-red-500 rounded-md p-0.5 transition-colors cursor-pointer"
                    title={isEn ? "Remove category option" : "অপশনটি বাতিল করুন"}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Form to add choice */}
            <CategoryAddForm 
              placeholder={isEn ? "Add custom income type..." : "নতুন আয়ের ধরন লিখুন (যেমন: ইউটিউব স্পন্সর)..."} 
              onAdd={onAddIncomeCategory} 
              isEn={isEn}
            />
          </div>

          {/* EXPENSE form options control */}
          <div className="space-y-4 bg-gray-50/50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-150/40 dark:border-gray-750">
            <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center justify-between">
              <span>🔴 {isEn ? 'Expense Form Categories' : 'ব্যয় বা খরচ ক্যাটাগরি অপশন'}</span>
              <span className="text-[10px] text-gray-400 lowercase font-bold">{expenseCategories.length} {isEn ? 'options' : 'ক্যাটাগরি'}</span>
            </h4>

            {/* List of categories */}
            <div className="flex flex-wrap gap-2 py-2">
              {expenseCategories.map(cat => (
                <span 
                  key={cat} 
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-850 dark:text-gray-100 text-xs font-bold rounded-xl border border-gray-150 dark:border-gray-700 flex items-center gap-2 group hover:border-rose-300 dark:hover:border-rose-900 transition-all"
                >
                  {cat}
                  <button 
                    onClick={() => {
                      if (expenseCategories.length <= 1) {
                        alert(isEn ? 'Must keep at least 1 category!' : 'অবশ্যই অন্তত একটি ক্যাটাগরি থাকতে হবে!');
                        return;
                      }
                      onDeleteExpenseCategory(cat);
                    }}
                    className="text-gray-300 hover:text-red-500 rounded-md p-0.5 transition-colors cursor-pointer"
                    title={isEn ? "Remove category option" : "অপশনটি বাতিল করুন"}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Form to add choice */}
            <CategoryAddForm 
              placeholder={isEn ? "Add custom expense type..." : "নতুন খরচের ধরন লিখুন (যেমন: অতিথি আপ্যায়ন)..."} 
              onAdd={onAddExpenseCategory} 
              isEn={isEn}
            />
          </div>

        </div>

        {/* Database entry live correction ledger */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-750">
          <h4 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider">
            {isEn ? '📋 Real-Time Database Entry Manager' : '📋 ডাটাবেস এন্ট্রি লাইভ মডারেটর (ম্যানুয়াল বাতিল)'}
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed pr-6">
            {isEn 
              ? 'Erase any specific transaction entry instantly. This is logged immediately.'
              : 'যেকোনো ভুল লেনদেন ডাটাবেস থেকে ডিলিট বা বাতিল করতে ডিলিট আইকনে ক্লিক করুন। এটি তাৎক্ষণিকভাবে হিসাব সংশোধন করবে।'
            }
          </p>

          <LiveDbModerator 
            incomes={incomes} 
            expenses={expenses} 
            dues={dues} 
            onDeleteIncome={onDeleteIncome} 
            onDeleteExpense={onDeleteExpense} 
            onDeleteDues={onDeleteDues} 
            isEn={isEn} 
          />
        </div>

      </motion.div>
    </div>
  );
};

const CategoryAddForm: React.FC<{ placeholder: string; onAdd: (v: string) => void; isEn: boolean }> = ({ placeholder, onAdd, isEn }) => {
  const [val, setVal] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;
    onAdd(val.trim());
    setVal('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2.5">
      <input 
        type="text" 
        placeholder={placeholder} 
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="flex-grow text-xs px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
      />
      <button 
        type="submit" 
        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer whitespace-nowrap"
      >
        <Plus size={13} className="mr-1" />
        {isEn ? 'Add' : 'যোগ করুন'}
      </button>
    </form>
  );
};

const LiveDbModerator: React.FC<{
  incomes: Income[];
  expenses: Expense[];
  dues: Dues[];
  onDeleteIncome: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteDues: (id: string) => void;
  isEn: boolean;
}> = ({ incomes, expenses, dues, onDeleteIncome, onDeleteExpense, onDeleteDues, isEn }) => {
  const [tab, setTab] = useState<'income' | 'expense' | 'dues'>('income');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    if (tab === 'income') {
      return incomes.filter(i => i.item.toLowerCase().includes(query.toLowerCase()) || i.type.toLowerCase().includes(query.toLowerCase()));
    } else if (tab === 'expense') {
      return expenses.filter(e => e.item.toLowerCase().includes(query.toLowerCase()) || e.type.toLowerCase().includes(query.toLowerCase()) || e.payeeName.toLowerCase().includes(query.toLowerCase()));
    } else {
      return dues.filter(d => d.debtorName.toLowerCase().includes(query.toLowerCase()) || d.item.toLowerCase().includes(query.toLowerCase()));
    }
  }, [tab, query, incomes, expenses, dues]);

  return (
    <div className="space-y-4 border border-gray-150 dark:border-gray-750 rounded-2xl overflow-hidden bg-white dark:bg-gray-800">
      
      {/* Control row */}
      <div className="p-4 bg-gray-50/50 dark:bg-gray-750/30 border-b border-gray-150 dark:border-gray-750 flex flex-col md:flex-row gap-3 justify-between items-center">
        
        {/* Toggle navigation */}
        <div className="flex border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-850 rounded-xl overflow-x-auto">
          {[
            { id: 'income', label: isEn ? 'Income' : 'আয় এন্ট্রি' },
            { id: 'expense', label: isEn ? 'Expense' : 'ব্যয় এন্ট্রি' },
            { id: 'dues', label: isEn ? 'Dues' : 'বকেয়া পাওনা' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id as any); setQuery(''); }}
              className={`text-xs font-black px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                tab === t.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-750 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Input database manager search */}
        <input 
          placeholder={isEn ? "Search entries..." : "অনুসন্ধান করুন (যেমন: বিবরণ, ক্যাটাগরি)..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:w-60 text-xs px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none font-bold"
        />
      </div>

      {/* Grid records lists */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/50 dark:bg-gray-750/10 text-gray-500 uppercase font-black border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3">{isEn ? 'Date' : 'তারিখ'}</th>
              <th className="px-4 py-3">{isEn ? 'Category' : 'ধরণ/শ্রেণী'}</th>
              <th className="px-4 py-3">{isEn ? 'Item/Details' : 'আইটেম বিবরণ'}</th>
              <th className="px-4 py-3 text-right">{isEn ? 'Amount' : 'পরিমাণ'}</th>
              <th className="px-4 py-3 text-center">{isEn ? 'Action' : 'বাতিল করুন'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-bold">
            {list.length > 0 ? list.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono">
                  {new Date(item.date || item.dueDate).toLocaleDateString('bn-BD')}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded ${
                    tab === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : tab === 'expense' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                  }`}>
                    {item.type || (isEn ? 'Dues' : 'বকেয়া')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-900 dark:text-gray-100">{item.item || (isEn ? 'Debtor Name: ' : 'দেনাদার: ') + item.debtorName}</p>
                  {item.comment && <p className="text-[10px] text-gray-400 font-normal line-clamp-1 italic">"{item.comment}"</p>}
                </td>
                <td className={`px-4 py-3 text-right font-black ${
                  tab === 'income' ? 'text-green-600' : tab === 'expense' ? 'text-red-650' : 'text-amber-600'
                }`}>
                  {item.amount.toLocaleString()} ৳
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => {
                      if (window.confirm(isEn ? 'Delete this entry from ledger database?' : 'আপনি কি নিশ্চিত এই এন্ট্রিটি চিরতরে বাতিল করতে চান?')) {
                        if (tab === 'income') onDeleteIncome(item.id);
                        else if (tab === 'expense') onDeleteExpense(item.id);
                        else onDeleteDues(item.id);
                      }
                    }}
                    className="p-1 px-2.5 text-xs bg-red-50 dark:bg-red-950/20 text-red-650 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all font-black cursor-pointer"
                  >
                    <Trash2 size={13} className="inline mr-1" />
                    {isEn ? 'Delete' : 'বাতিল'}
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 font-semibold text-xs">
                  {isEn ? 'No direct matches found.' : 'কোন রেকর্ড খুঁজে পাওয়া যায়নি।'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ 
    icon: any; 
    label: string; 
    value: string | number; 
    color: string;
    delay: number;
}> = ({ icon: Icon, label, value, color, delay }) => {
    const colors: any = {
        indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 bg-indigo-500 border-indigo-100 dark:border-indigo-900/50 shadow-indigo-100 dark:shadow-none',
        green: 'text-green-600 bg-green-50 dark:bg-green-900/30 bg-green-500 border-green-100 dark:border-green-900/50 shadow-green-100 dark:shadow-none',
        red: 'text-red-600 bg-red-50 dark:bg-red-900/30 bg-red-500 border-red-100 dark:border-red-900/50 shadow-red-100 dark:shadow-none',
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 bg-blue-500 border-blue-100 dark:border-blue-900/50 shadow-blue-100 dark:shadow-none'
    };

    const colorScheme = colors[color].split(' ');

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.4 }}
            className={`p-6 rounded-[2rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${colorScheme.find((c: string) => c.startsWith('bg-') && !c.includes('/'))} mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black tracking-tight dark:text-white">{value}</p>
        </motion.div>
    );
};

export default ProfileScreen;
