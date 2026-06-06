
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, Income, Expense, Dues, Post, LinkItem, ActiveScreen, TransactionType, AudioClip, Budget } from './types';
import Header from './components/Header';
import SideMenu from './components/SideMenu';
import HomeScreen from './screens/HomeScreen';
import MenuScreen from './screens/MenuScreen';
import LinksScreen from './screens/LinksScreen';
import AboutScreen from './screens/AboutScreen';
import HistoryScreen from './screens/HistoryScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import AuthContainer from './screens/AuthContainer';
import ProfileScreen from './screens/ProfileScreen';
import DocsScreen from './screens/DocsScreen';
import AudioClipsScreen from './screens/AudioClipsScreen';
import BudgetScreen from './screens/BudgetScreen';

const App: React.FC = () => {
  // Restore current authentication state from localStorage to prevent session dropping on Vercel or local restarts
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rgo_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('rgo_users');
    return saved ? JSON.parse(saved) : [
      { 
        id: 'admin-1', 
        username: 'admin', 
        email: 'rglink98@gmail.com', // Preloaded creator email
        password: 'password', 
        status: 'approved', 
        role: 'admin',
        preferences: { theme: 'light', language: 'bn' }
      }
    ];
  });

  const [incomes, setIncomes] = useState<Income[]>(() => JSON.parse(localStorage.getItem('rgo_incomes') || '[]'));
  const [expenses, setExpenses] = useState<Expense[]>(() => JSON.parse(localStorage.getItem('rgo_expenses') || '[]'));
  const [dues, setDues] = useState<Dues[]>(() => JSON.parse(localStorage.getItem('rgo_dues') || '[]'));
  const [posts, setPosts] = useState<Post[]>(() => JSON.parse(localStorage.getItem('rgo_posts') || '[]'));
  const [links, setLinks] = useState<LinkItem[]>(() => JSON.parse(localStorage.getItem('rgo_links') || '[]'));
  const [audioClips, setAudioClips] = useState<AudioClip[]>(() => JSON.parse(localStorage.getItem('rgo_audioClips') || '[]'));

  // Custom Form Category options managed manually from settings
  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('rgo_income_categories');
    return saved ? JSON.parse(saved) : ['সার্ভিস', 'পণ্য বিক্রি', 'সদস্য চাঁদা', 'দান/অনুদান', 'অন্যান্য'];
  });

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('rgo_expense_categories');
    return saved ? JSON.parse(saved) : ['নাস্তা/খাবার', 'অফিস বিল', 'অফিস ভাড়া', 'যাতায়াত', 'বিজ্ঞাপন', 'অন্যান্য'];
  });

  const [budgetCategories, setBudgetCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('rgo_budget_categories');
    return saved ? JSON.parse(saved) : [
      'যাতায়াত ও ভ্রমণ বিল',
      'অফিস সজ্জা ও স্টেশনারি',
      'খাবার ও নাস্তা',
      'ইউটিলিটি ও ইন্টারনেট বিল',
      'বিজ্ঞাপন ও বিপণন',
      'প্রযুক্তি ও সফটওয়্যার',
      'জরুরি তহবিল',
      'অন্যান্য'
    ];
  });

  // Dedicated Budget state
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('rgo_budgets');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('ড্যাশবোর্ড');

  // Sync users to local persistence
  useEffect(() => {
    localStorage.setItem('rgo_users', JSON.stringify(users));
  }, [users]);

  // Sync session state to local persistence
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('rgo_current_user', JSON.stringify(currentUser));
      
      // Sync theme on document level
      const isDark = currentUser.preferences?.theme === 'dark';
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      localStorage.removeItem('rgo_current_user');
    }
  }, [currentUser]);

  // Sync transactions to persistence
  useEffect(() => {
    localStorage.setItem('rgo_incomes', JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem('rgo_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('rgo_dues', JSON.stringify(dues));
  }, [dues]);

  useEffect(() => {
    localStorage.setItem('rgo_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('rgo_links', JSON.stringify(links));
  }, [links]);

  useEffect(() => {
    localStorage.setItem('rgo_audioClips', JSON.stringify(audioClips));
  }, [audioClips]);

  // Sync custom category options and budgets
  useEffect(() => {
    localStorage.setItem('rgo_income_categories', JSON.stringify(incomeCategories));
  }, [incomeCategories]);

  useEffect(() => {
    localStorage.setItem('rgo_expense_categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem('rgo_budget_categories', JSON.stringify(budgetCategories));
  }, [budgetCategories]);

  useEffect(() => {
    localStorage.setItem('rgo_budgets', JSON.stringify(budgets));
  }, [budgets]);

  // Access rights and filtering
  const filteredData = useMemo(() => {
    if (!currentUser) return { incomes: [], expenses: [], dues: [], posts: [] };

    const isAdmin = currentUser.role === 'admin';
    const filter = <T extends { enteredBy?: string }>(list: T[]): T[] => {
      if (isAdmin) return list;
      return list.filter(item => item.enteredBy === currentUser.username);
    };

    return {
      incomes: filter(incomes),
      expenses: filter(expenses),
      dues: filter(dues),
      posts: filter(posts)
    };
  }, [incomes, expenses, dues, posts, currentUser]);

  const totals = useMemo(() => {
    const totalIncome = filteredData.incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = filteredData.expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalDues = filteredData.dues.reduce((sum, item) => sum + item.amount, 0);
    return { totalIncome, totalExpense, totalDues, currentCash: totalIncome - totalExpense };
  }, [filteredData]);

  // Update dynamic localized header title
  useEffect(() => {
    const activeLang = currentUser?.preferences?.language || 'bn';
    switch (activeScreen) {
      case 'home': setHeaderTitle(activeLang === 'en' ? 'Dashboard' : 'ড্যাশবোর্ড'); break;
      case 'menu': setHeaderTitle(activeLang === 'en' ? 'Entry Form' : 'এন্ট্রি ফরম'); break;
      case 'links': setHeaderTitle(activeLang === 'en' ? 'Useful Links' : 'লিংক সমূহ'); break;
      case 'about': setHeaderTitle(activeLang === 'en' ? 'Backup & Support' : 'ব্যাকআপ ও সাপোর্ট'); break;
      case 'history': setHeaderTitle(activeLang === 'en' ? 'Transaction History' : 'লেনদেনের ইতিহাস'); break;
      case 'user_management': setHeaderTitle(activeLang === 'en' ? 'User Control' : 'ইউজার কন্ট্রোল'); break;
      case 'profile': setHeaderTitle(activeLang === 'en' ? 'My Profile' : 'আমার প্রোফাইল'); break;
      case 'docs': setHeaderTitle(activeLang === 'en' ? 'Google Docs' : 'গুগল ডকস'); break;
      case 'audio_clips': setHeaderTitle(activeLang === 'en' ? 'Audio Clip Board' : 'অডিও ক্লিপ বোর্ড'); break;
      case 'budget': setHeaderTitle(activeLang === 'en' ? 'Manual Budget' : 'বাজেট খতিয়ান'); break;
    }
  }, [activeScreen, currentUser?.preferences?.language]);

  const handleAddTransaction = useCallback((type: TransactionType, data: any) => {
    if (!currentUser) return;
    const newId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const entryData = { ...data, id: newId, enteredBy: currentUser.username, date: new Date().toISOString() };

    switch (type) {
      case 'income': setIncomes(prev => [entryData, ...prev]); break;
      case 'expense': setExpenses(prev => [entryData, ...prev]); break;
      case 'dues': setDues(prev => [entryData, ...prev]); break;
      case 'post': setPosts(prev => [entryData, ...prev]); break;
    }
  }, [currentUser]);

  const handleUpdateProfile = useCallback((updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
  }, []);

  const handleAddAudioClip = useCallback((clipData: Omit<AudioClip, 'id' | 'date' | 'enteredBy'>) => {
    if (!currentUser) return;
    const newId = 'audio-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newClip: AudioClip = {
      ...clipData,
      id: newId,
      enteredBy: currentUser.username,
      date: new Date().toISOString()
    };
    setAudioClips(prev => [newClip, ...prev]);
  }, [currentUser]);

  const handleDeleteAudioClip = useCallback((id: string) => {
    setAudioClips(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleUpdateAudioClip = useCallback((updatedClip: AudioClip) => {
    setAudioClips(prev => prev.map(c => c.id === updatedClip.id ? updatedClip : c));
  }, []);

  const handleDeleteIncome = useCallback((id: string) => {
    setIncomes(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleDeleteDues = useCallback((id: string) => {
    setDues(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleAddBudget = useCallback((budgetData: Omit<Budget, 'id' | 'date' | 'enteredBy'>) => {
    if (!currentUser) return;
    const newBudget: Budget = {
      ...budgetData,
      id: 'bd-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      date: new Date().toISOString(),
      enteredBy: currentUser.username
    };
    setBudgets(prev => [newBudget, ...prev]);
  }, [currentUser]);

  const handleUpdateBudget = useCallback((updatedBudget: Budget) => {
    setBudgets(prev => prev.map(b => b.id === updatedBudget.id ? updatedBudget : b));
  }, []);

  const handleDeleteBudget = useCallback((id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleClearBudgetsSpent = useCallback(() => {
    setBudgets(prev => prev.map(b => ({ ...b, spentAmount: 0 })));
  }, []);

  const handleClearAllBudgets = useCallback(() => {
    setBudgets([]);
  }, []);

  const handleBackup = () => {
    const backupData = { 
      users, 
      incomes, 
      expenses, 
      dues, 
      posts, 
      links, 
      audioClips, 
      budgets, 
      incomeCategories, 
      expenseCategories,
      budgetCategories
    };
    const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rj_tancom_backup_${new Date().toLocaleDateString()}.json`;
    link.click();
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.users) setUsers(data.users);
        if (data.incomes) setIncomes(data.incomes);
        if (data.expenses) setExpenses(data.expenses);
        if (data.dues) setDues(data.dues);
        if (data.posts) setPosts(data.posts);
        if (data.links) setLinks(data.links);
        if (data.audioClips) setAudioClips(data.audioClips);
        if (data.budgets) setBudgets(data.budgets);
        if (data.incomeCategories) setIncomeCategories(data.incomeCategories);
        if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
        if (data.budgetCategories) setBudgetCategories(data.budgetCategories);
        alert('সফলভাবে ডেটা রিস্টোর করা হয়েছে!');
      } catch (err) {
        alert('ফাইলটি সঠিক নয়।');
      }
    };
    reader.readAsText(file);
  };

  if (!currentUser) {
    return <AuthContainer users={users} onLogin={setCurrentUser} onRegister={(u) => setUsers(prev => [...prev, u])} />;
  }

  const renderScreen = () => {
    const isAdmin = currentUser.role === 'admin';
    switch (activeScreen) {
      case 'home': return <HomeScreen totals={totals} incomes={filteredData.incomes} expenses={filteredData.expenses} currentUser={currentUser} onProfileClick={() => setActiveScreen('profile')} />;
      case 'menu': return (
        <MenuScreen 
          onAddTransaction={handleAddTransaction} 
          currentUser={currentUser} 
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
        />
      );
      case 'links': return <LinksScreen links={links} onAddLink={(l) => setLinks(prev => [...prev, { ...l, id: Date.now().toString() }])} isAdmin={isAdmin} />;
      case 'about': return <AboutScreen onBackup={handleBackup} onRestore={handleRestore} isAdmin={isAdmin} />;
      case 'history': return <HistoryScreen incomes={filteredData.incomes} expenses={filteredData.expenses} dues={filteredData.dues} posts={filteredData.posts} isAdmin={isAdmin} currentUser={currentUser} />;
      case 'user_management': 
        return isAdmin ? (
          <UserManagementScreen 
            users={users} 
            onApprove={(id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'approved' } : u))} 
            onReject={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
            onDelete={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
            onChangeRole={(id, role) => setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))}
            onAddManualUser={(u) => setUsers(prev => [...prev, u])}
            currentUser={currentUser}
          />
        ) : null;
      case 'profile': return (
        <ProfileScreen 
          user={currentUser} 
          incomes={incomes} 
          expenses={expenses} 
          posts={posts} 
          dues={dues} 
          onUpdateProfile={handleUpdateProfile} 
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          onAddIncomeCategory={(cat) => setIncomeCategories(prev => [...prev, cat])}
          onDeleteIncomeCategory={(cat) => setIncomeCategories(prev => prev.filter(c => c !== cat))}
          onAddExpenseCategory={(cat) => setExpenseCategories(prev => [...prev, cat])}
          onDeleteExpenseCategory={(cat) => setExpenseCategories(prev => prev.filter(c => c !== cat))}
          onDeleteIncome={handleDeleteIncome}
          onDeleteExpense={handleDeleteExpense}
          onDeleteDues={handleDeleteDues}
        />
      );
      case 'docs': return <DocsScreen currentUser={currentUser} incomes={incomes} expenses={expenses} posts={posts} dues={dues} />;
      case 'audio_clips': return <AudioClipsScreen currentUser={currentUser} audioClips={audioClips} onAddAudioClip={handleAddAudioClip} onDeleteAudioClip={handleDeleteAudioClip} onUpdateAudioClip={handleUpdateAudioClip} isAdmin={isAdmin} />;
      case 'budget': return (
        <BudgetScreen 
          budgets={budgets} 
          onAddBudget={handleAddBudget} 
          onUpdateBudget={handleUpdateBudget} 
          onDeleteBudget={handleDeleteBudget} 
          currentUser={currentUser} 
          budgetCategories={budgetCategories}
          onAddBudgetCategory={(cat) => setBudgetCategories(prev => [...prev, cat])}
          onDeleteBudgetCategory={(cat) => setBudgetCategories(prev => prev.filter(c => c !== cat))}
          onClearBudgetsSpent={handleClearBudgetsSpent}
          onClearAllBudgets={handleClearAllBudgets}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <Header title={headerTitle} onMenuOpen={() => setIsSideMenuOpen(true)} user={currentUser} onProfileClick={() => setActiveScreen('profile')} />
      <SideMenu 
        isOpen={isSideMenuOpen} 
        onClose={() => setIsSideMenuOpen(false)} 
        activeScreen={activeScreen} 
        onScreenChange={setActiveScreen} 
        isAdmin={currentUser.role === 'admin'} 
        onLogout={() => setCurrentUser(null)} 
        language={currentUser?.preferences?.language}
      />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">{renderScreen()}</main>
    </div>
  );
};

export default App;
