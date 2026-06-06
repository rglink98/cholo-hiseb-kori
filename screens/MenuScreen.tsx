import React, { useState, useEffect } from 'react';
import { TransactionType, User } from '../types';

interface MenuScreenProps {
  onAddTransaction: (type: TransactionType, data: any) => void;
  currentUser: User;
  incomeCategories: string[];
  expenseCategories: string[];
}

const MenuScreen: React.FC<MenuScreenProps> = ({ 
  onAddTransaction, 
  currentUser,
  incomeCategories,
  expenseCategories
}) => {
  const [activeForm, setActiveForm] = useState<TransactionType | null>(null);

  const menuItems: { id: TransactionType; label: string; icon: string; color: string; desc: string }[] = [
    { id: 'income', label: 'আয় বা ইনকাম', icon: 'fa-circle-plus', color: 'bg-green-500', desc: 'অফিসের সকল আয়ের হিসাব লিখুন' },
    { id: 'expense', label: 'খরচ বা ব্যয়', icon: 'fa-circle-minus', color: 'bg-red-500', desc: 'দৈনন্দিন খরচের বিবরণ জমা দিন' },
    { id: 'post', label: 'নতুন পোস্ট', icon: 'fa-paper-plane', color: 'bg-indigo-500', desc: 'গুরুত্বপূর্ণ নোটিশ বা আপডেট পোস্ট করুন' },
    { id: 'dues', label: 'বকেয়া বা পাওনা', icon: 'fa-file-invoice-dollar', color: 'bg-amber-500', desc: 'বকেয়া লেনদেনের হিসাব রাখুন' },
  ];

  if (activeForm) {
    return (
      <div className="animate-slideUp">
        <button 
          onClick={() => setActiveForm(null)}
          className="mb-6 flex items-center text-gray-500 hover:text-blue-600 font-bold transition-colors cursor-pointer"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          মেনুতে ফিরে যান
        </button>
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold flex items-center">
              <i className={`fas ${menuItems.find(i => i.id === activeForm)?.icon} mr-3 text-blue-500`}></i>
              {menuItems.find(i => i.id === activeForm)?.label} এন্ট্রি ফরম
            </h2>
          </div>
          <div className="p-8">
            <TransactionForm 
              type={activeForm} 
              onSubmit={(data) => {
                onAddTransaction(activeForm, data);
                setActiveForm(null);
              }}
              username={currentUser.username}
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveForm(item.id)}
          className="group flex items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all text-left cursor-pointer"
        >
          <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center text-white text-2xl shadow-lg transition-transform group-hover:scale-110`}>
            <i className={`fas ${item.icon}`}></i>
          </div>
          <div className="ml-6 flex-grow">
            <h3 className="text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors">{item.label}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
          </div>
          <div className="text-gray-300 group-hover:text-blue-500 transition-colors">
            <i className="fas fa-chevron-right"></i>
          </div>
        </button>
      ))}
    </div>
  );
};

const TransactionForm: React.FC<{ 
  type: TransactionType; 
  onSubmit: (data: any) => void; 
  username: string;
  incomeCategories: string[];
  expenseCategories: string[];
}> = ({ type, onSubmit, username, incomeCategories, expenseCategories }) => {
  const [formData, setFormData] = useState<any>({
    name: username,
    type: '',
    item: '',
    amount: '',
    comment: '',
    receiptCount: 1,
    payeeName: '',
    debtorName: '',
    title: '',
    content: '',
    image: '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  // Pre-load type select dropdown default value on render
  useEffect(() => {
    if (type === 'income') {
      setFormData((prev: any) => ({ ...prev, type: incomeCategories[0] || '' }));
    } else if (type === 'expense') {
      setFormData((prev: any) => ({ ...prev, type: expenseCategories[0] || '' }));
    }
  }, [type, incomeCategories, expenseCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('ছবির সাইজ ৩ মেগাবাইটের বেশি হওয়া যাবে না।');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev: any) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processedData = { ...formData };
    if (type === 'post') {
      onSubmit({
        title: formData.title,
        content: formData.content,
        image: formData.image,
      });
      return;
    }
    if (processedData.amount) processedData.amount = parseFloat(processedData.amount);
    if (processedData.receiptCount) processedData.receiptCount = parseInt(processedData.receiptCount);
    onSubmit(processedData);
  };

  return (
    <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
      {/* 1. Post Fields */}
      {type === 'post' && (
        <>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">পোস্টের টাইটেল</label>
            <input 
              name="title" 
              required 
              value={formData.title} 
              onChange={handleChange} 
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
              placeholder="পোস্টের আকর্ষনীয় শিরোনাম দিন..." 
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">বিস্তারিত বিবরণ</label>
            <textarea 
              name="content" 
              required 
              rows={5} 
              value={formData.content} 
              onChange={handleChange} 
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
              placeholder="বিস্তারিত বা কোনো নোটিশ থাকলে এখানে লিখুন..." 
            />
          </div>
        </>
      )}

      {/* 2. Common Transaction Fields */}
      {(type === 'income' || type === 'expense' || type === 'dues') && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">লেনদেনের আইটেম / বিবরণ</label>
            <input name="item" required value={formData.item} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-bold" placeholder="কি বাবদ?" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">টাকার পরিমাণ</label>
            <input name="amount" type="number" required value={formData.amount} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-mono font-black text-lg" placeholder="0.00" />
          </div>
        </>
      )}

      {/* 3. Specific Fields */}
      {type === 'income' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">আয়ের ধরন (ক্যাটাগরি)</label>
            <select 
              name="type" 
              required 
              value={formData.type} 
              onChange={handleChange} 
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs"
            >
              {incomeCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">রিসিট সংখ্যা</label>
            <input name="receiptCount" type="number" value={formData.receiptCount} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
          </div>
        </>
      )}

      {type === 'expense' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">খরচের ধরন (ক্যাটাগরি)</label>
            <select 
              name="type" 
              required 
              value={formData.type} 
              onChange={handleChange} 
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs"
            >
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">গ্রহীতার নাম</label>
            <input name="payeeName" required value={formData.payeeName} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="কার কাছে জমা?" />
          </div>
        </>
      )}

      {type === 'dues' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">দেনাদারের নাম</label>
            <input name="debtorName" required value={formData.debtorName} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">পরিশোধের শেষ তারিখ</label>
            <input name="dueDate" type="date" required value={formData.dueDate} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold" />
          </div>
        </>
      )}

      {/* Image upload section (receipt photograph) for ALL entry forms (including Income, Expense, Post) as requested: "এন্টি ফরমে ছবি আপলোড দেওয়ার অপশন রাখবা যেন রিসিভডের ছবি তুলে আপলোড ফাইল ক্লিক করলে ছবিটি দেওয়া যায়" */}
      <div className="md:col-span-2 space-y-2">
        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">
          {type === 'post' ? 'পোস্ট ছবি বা ব্যানার' : 'রিসিট বা ভাউচারের ছবি আপলোড করুন'} (ঐচ্ছিক)
        </label>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-6 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-150/50 dark:hover:bg-gray-750 transition-all relative">
          {formData.image ? (
            <div className="relative group w-full flex flex-col items-center">
              <img src={formData.image} alt="Upload preview" className="max-h-60 object-contain rounded-xl shadow-lg border dark:border-gray-600 animate-fadeIn" />
              <button
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, image: '' }))}
                className="absolute top-2 right-2 p-2.5 bg-red-650 hover:bg-red-700 text-white rounded-full transition-all shadow-md cursor-pointer"
              >
                <i className="fas fa-trash text-xs"></i>
              </button>
              <p className="text-[11px] text-gray-400 mt-2 font-bold">📷 ফাইল/রিসিট ইমেজটি সফলভাবে সেট করা হয়েছে।</p>
            </div>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-55 dark:bg-blue-900/40 text-blue-600 dark:text-blue-350 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <i className="fas fa-camera text-xl"></i>
              </div>
              <span className="text-xs font-black text-gray-700 dark:text-gray-200">মোবাইল ক্যামেরা দিয়ে রিসিভডের ছবি তুলুন অথবা ফাইল আপলোড করুন</span>
              <span className="text-[10px] text-gray-400 mt-1 font-mono">JPG, PNG, WEBP (সর্বোচ্চ ৩ মেগাবাইট)</span>
              <input
                type="file"
                accept="image/*"
                capture="environment" // Permits direct photo snapping on compatible phones
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Comment/Footer Fields (Excluding Post Type) */}
      {type !== 'post' && (
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">মন্তব্য (ঐচ্ছিক)</label>
          <textarea name="comment" rows={3} value={formData.comment} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-bold" placeholder="অতিরিক্ত তথ্য থাকলে লিখুন..."></textarea>
        </div>
      )}

      <div className="md:col-span-2 pt-4">
        <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/20 transform transition-all active:scale-[0.98] cursor-pointer">
          {type === 'post' ? 'পোস্ট করুন' : 'তথ্য জমা দিন'} <i className="fas fa-paper-plane ml-2"></i>
        </button>
      </div>
    </form>
  );
};

export default MenuScreen;
