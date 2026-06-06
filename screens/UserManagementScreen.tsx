
import React, { useState } from 'react';
import { User } from '../types';
import { translate } from '../translations';
import { Trash2, Shield, UserPlus, Mail, CheckCircle2, XCircle, Users } from 'lucide-react';

interface UserManagementScreenProps {
  users: User[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onChangeRole: (id: string, role: 'admin' | 'user') => void;
  onAddManualUser: (user: User) => void;
  currentUser: User;
}

const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ 
  users, 
  onApprove, 
  onReject, 
  onDelete, 
  onChangeRole,
  onAddManualUser,
  currentUser
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentLang = currentUser.preferences?.language || 'bn';

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!newUsername.trim() || !newEmail.trim()) {
      setErrorMsg('ইউজারনেম এবং জিমেইল ইমেইল প্রদান করুন।');
      return;
    }

    if (!newEmail.includes('@')) {
      setErrorMsg('সঠিক ইমেইল ঠিকানা প্রদান করুন (যেমন: user@gmail.com)।');
      return;
    }

    // Check if email already exists
    const duplicate = users.find(u => u.email?.toLowerCase() === newEmail.trim().toLowerCase());
    if (duplicate) {
      setErrorMsg('এই ইমেইলটি দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট রেজিস্টার্ড রয়েছে!');
      return;
    }

    const newManualUser: User = {
      id: 'manual-' + Date.now().toString(36),
      username: newUsername.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      status: 'approved', // Pre-approved directly by Admin!
      preferences: {
        theme: 'light',
        language: 'bn'
      }
    };

    onAddManualUser(newManualUser);
    setNewUsername('');
    setNewEmail('');
    setNewRole('user');
    setSuccessMsg('ম্যানুয়ালি নতুন ইউজার যুক্ত করা হয়েছে! তিনি এখন সরাসরি ওয়ান-ক্লিক জিমেইল দ্বারা প্রবেশ করতে পারবেন।');
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto pb-20 font-sans">
      
      {/* 1. Add User Manually Form */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
        <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
          <UserPlus size={22} />
          <h2 className="text-xl font-extrabold">ম্যানুয়ালি প্রি-অ্যাপ্রুভড সদস্য যুক্ত করুন</h2>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          যাদেরকে যুক্ত করবেন, তারা এই ইমেইল জিমেইল অ্যাকাউন্টটি দিয়ে সরাসরি ওয়ান-ক্লিক লগইন করে সিস্টেমে প্রবেশ করতে পারবেন। কোনো আলাদা অনুমোদনের প্রয়োজন হবে না।
        </p>

        <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">নাম / ইউজারনেম</label>
            <input 
              type="text" 
              placeholder="যেমন: আরজে তানজিম"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full text-xs p-3.5 bg-gray-50 dark:bg-gray-750 rounded-xl outline-none border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">জিমেইল ইমেইল (Gmail Address)</label>
            <input 
              type="email" 
              placeholder=" যেমন: rj.tancom@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full text-xs p-3.5 bg-gray-50 dark:bg-gray-750 rounded-xl outline-none border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">রোল / ক্যাটাগরি</label>
            <div className="flex space-x-2">
              <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                className="flex-1 text-xs p-3.5 bg-gray-50 dark:bg-gray-750 rounded-xl outline-none border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                <option value="user">সাধারণ ব্যবহারকারী (User)</option>
                <option value="admin">সুপার এডমিন (Admin)</option>
              </select>
              <button 
                type="submit"
                className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                যোগ করুন
              </button>
            </div>
          </div>
        </form>

        {successMsg && (
          <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-4 rounded-xl text-xs font-bold border border-green-100/50 flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 size={16} />
            <p>{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs font-bold border border-red-100/50 flex items-center space-x-2 animate-fadeIn">
            <XCircle size={16} />
            <p>{errorMsg}</p>
          </div>
        )}
      </section>

      {/* 2. Pending Approval Section */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3 text-amber-500">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-550 flex items-center justify-center">
            <i className="fas fa-user-clock text-lg"></i>
          </div>
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-white">অনুমোদনের অপেক্ষায় ({pendingUsers.length})</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingUsers.length > 0 ? pendingUsers.map(user => (
            <div key={user.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border-2 border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-full flex items-center justify-center font-black text-xl">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-extrabold text-gray-800 dark:text-gray-100">{user.username}</p>
                  <p className="text-[11px] font-bold text-gray-400 font-mono mt-0.5">{user.email || 'কোনো ইমেইল নেই'}</p>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-wider mt-1">কানেকশন পেন্ডিং</p>
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <button 
                  onClick={() => onApprove(user.id)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  অনুমোদন দিন
                </button>
                <button 
                  onClick={() => onReject(user.id)}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-500 dark:text-gray-300 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </div>
          )) : (
            <div className="md:col-span-2 py-10 text-center bg-gray-100/30 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-400 font-bold text-xs">নতুন কোনো পেন্ডিং রিকোয়েস্ট নেই</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Approved Users List */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
          <Users size={22} />
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-white">অনুমোদিত ব্যবহারকারী তালিকা ({approvedUsers.length})</h2>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left font-sans">
            <thead className="bg-gray-50 dark:bg-gray-750/50 text-gray-500 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">সদস্যের নাম ও মেইল</th>
                <th className="px-6 py-4">রোল / ক্যাটাগরি</th>
                <th className="px-6 py-4">স্ট্যাটাস</th>
                <th className="px-6 py-4 text-center">ম্যানুয়াল কন্ট্রোল</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {approvedUsers.map(user => {
                const isSelf = user.id === currentUser.id;
                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-gray-800 dark:text-gray-100">
                            {user.username} {isSelf && <span className="text-[10px] text-gray-400 italic">(আপনি)</span>}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono font-medium mt-0.5">{user.email || 'কোনো ইমেইল নেই'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Shield className={`w-3.5 h-3.5 ${user.role === 'admin' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <select
                          disabled={isSelf}
                          value={user.role}
                          onChange={(e) => onChangeRole(user.id, e.target.value as 'admin' | 'user')}
                          className="text-xs font-bold border-none bg-transparent dark:text-gray-200 outline-none p-1 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <option value="user">ব্যবহারকারী (User)</option>
                          <option value="admin">সুপার এডমিন (Admin)</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        disabled={isSelf}
                        onClick={() => {
                          if (window.confirm(`আপনি কি নিশ্চিতভাবে এই অ্যাকাউন্টটি (${user.username}) বাতিল/ডিলিট করতে চান?`)) {
                            onDelete(user.id);
                          }
                        }}
                        className={`p-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors inline-flex items-center justify-center cursor-pointer ${isSelf ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title="রিমুভ করুন"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {approvedUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-400 font-medium text-xs">
                    বর্তমানে কোনো অনুমোদিত ব্যবহারকারী নেই
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default UserManagementScreen;
