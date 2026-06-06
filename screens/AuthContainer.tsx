
import React, { useState } from 'react';
import { User } from '../types';
import { googleSignIn } from '../googleAuth';
import { translate } from '../translations';

interface AuthContainerProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ users, onLogin, onRegister }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // Fallback state for local offline login (crucial for local testing in cases where popups are blocked)
  const [showLocalBypass, setShowLocalBypass] = useState(false);
  const [localUsername, setLocalUsername] = useState('');
  const [localPassword, setLocalPassword] = useState('');

  const currentLang = 'bn'; // Default language for login screen

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (!result) {
        throw new Error('গুগল লগইন সম্পূর্ণ হতে পারেনি। আবার চেষ্টা করুন।');
      }

      const { user } = result;
      const userEmail = user.email || '';

      // Find if user already exists
      const foundUser = users.find(u => u.email?.toLowerCase() === userEmail.toLowerCase() || u.username.toLowerCase() === userEmail.toLowerCase());

      if (foundUser) {
        if (foundUser.status === 'approved') {
          onLogin(foundUser);
        } else {
          setPendingUser(foundUser);
          setError('পেন্ডিং রিকোয়েস্ট: আপনার অ্যাকাউন্টটি এখনো এডমিন দ্বারা অনুমোদিত হয়নি।');
        }
      } else {
        // Create new user automatically from Google Profile
        // Google Email "rglink98@gmail.com" is set as Approved Creator/Admin automatically
        const isDefaultAdmin = 
          userEmail.toLowerCase() === 'rglink98@gmail.com' || 
          users.length === 0 || 
          (users.length === 1 && users[0].id === 'admin-1'); // If Database is empty/clean

        const namePrefix = user.displayName || userEmail.split('@')[0];

        const newUser: User = {
          id: 'google-' + user.uid.slice(0, 8),
          username: namePrefix,
          email: userEmail,
          status: isDefaultAdmin ? 'approved' : 'pending',
          role: isDefaultAdmin ? 'admin' : 'user',
          preferences: {
            theme: 'light',
            language: 'bn'
          }
        };

        onRegister(newUser);

        if (isDefaultAdmin) {
          onLogin(newUser);
        } else {
          setPendingUser(newUser);
          setError('আপনার অ্যাকাউন্ট তৈরি হয়েছে। এটি বর্তমানে "অপেক্ষাধীন" রয়েছে। এডমিন অনুমোদন করলে প্রবেশ করতে পারবেন।');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'গুগল সাইন-ইন সংযোগ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalBypassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find(u => u.username === localUsername && u.password === localPassword);
    if (user) {
      if (user.status === 'approved') {
        onLogin(user);
      } else {
        setError('পাসওয়ার্ড সঠিক কিন্তু আপনার প্রোফাইলটি এখনো অনুমোদিত হয়নি।');
      }
    } else {
      setError('ভুল এডমিন ইউজারনেম অথবা পাসওয়ার্ড রিকভারি।');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-800 font-sans select-none">
      <div className="max-w-md w-full animate-fadeIn">
        <div className="text-center mb-10 space-y-3">
          {/* Logo container */}
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl mx-auto flex items-center justify-center text-white text-4xl shadow-2xl transition-transform hover:scale-105 duration-300">
            <i className="fas fa-layer-group"></i>
          </div>
          <h1 className="text-4xl font-black text-white tracking-widest uppercase">RJ TANCOM</h1>
          <p className="text-blue-100 text-base font-semibold opacity-85">অর্গানাইজেশন ড্যাশবোর্ড ও ডিজিটাল খতিয়ান</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl space-y-8 border border-white/10">
          
          <div className="text-center space-y-2">
            <h2 className="text-xl font-extrabold text-gray-800 dark:text-white">
              {pendingUser ? 'অনুমোদনের অপেক্ষা' : 'সরাসরি জিমেইল দিয়ে প্রবেশ'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-300 font-medium">
              {pendingUser ? 'আপনার প্রোফাইল অনুমোদনের জন্য জমা আছে' : 'কোড কপি-পেস্ট করা বা ওটিপি পাওয়ার ঝামেলা ছাড়াই নিরাপদ প্রবেশ'}
            </p>
          </div>

          {/* Pending Screen */}
          {pendingUser ? (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="p-5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 rounded-2xl border border-amber-200/50 text-xs leading-relaxed font-bold space-y-3">
                <p>⚠️ {translate('pendingApprovalMsg', currentLang)}</p>
                <div className="bg-amber-100/40 dark:bg-amber-900/30 p-2.5 rounded-xl font-mono text-[11px] text-left">
                  <div>নাম: {pendingUser.username}</div>
                  <div>ইমেইল: {pendingUser.email}</div>
                  <div>অবস্থা: {pendingUser.status.toUpperCase()} (পেন্ডিং)</div>
                </div>
              </div>
              <button 
                onClick={() => setPendingUser(null)}
                className="w-full py-3.5 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-bold rounded-2xl transition-all text-xs cursor-pointer"
              >
                অন্য জিমেইল দিয়ে চেষ্টা করুন
              </button>
            </div>
          ) : (
            /* Normal Google Login Screen */
            <div className="space-y-6">
              
              <button 
                onClick={handleGoogleLogin} 
                disabled={loading}
                className="w-full py-4 px-6 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center space-x-3 transform transition-all active:scale-[0.98] cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-gray-500 font-bold">{translate('loading', currentLang)}</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <polygon fill="#F4B400" points="12.24,10.285 22.091,10.285 22.091,14.28 12.24,14.28" />
                      <path fill="#F4B400" d="M12,24 C18.159,24 23.365,19.261 23.945,13.235 L12.24,13.235 L12.24,10.285 L23.945,10.285 C23.951,10.155 24,10.024 24,9.889 C24,4.427 18.627,0 12,0 C5.373,0 0,5.373 0,12 C0,18.627 5.373,24 12,24 Z" />
                      <path fill="#0F9D58" d="M11.956,23.945 C5.352,23.945 0,18.593 0,11.989 C0,5.385 5.352,0.033 11.956,0.033 C18.236,0.033 23.398,4.898 23.931,11.12 L22.091,11.12 C21.56,6.32 17.185,2.56 11.956,2.56 C6.746,2.56 2.518,6.788 2.518,11.989 C2.518,17.19 6.746,21.418 11.956,21.418 C17.065,21.418 21.365,17.811 22.05,13.2 L23.935,13.2 C23.328,19.349 18.188,23.945 11.956,23.945 Z" />
                      <path fill="#4285F4" d="M11.956,2.56 L11.956,11.12 L20.516,11.12 C20.516,11.412 20.548,11.704 20.548,11.989 C20.548,16.732 17.332,20.694 12.827,21.326 L12.827,11.989 L22.05,11.989 C21.985,12.398 21.932,12.801 21.859,13.2 C21.144,17.108 17.653,19.945 13.565,19.945 C8.932,19.945 5.176,16.189 5.176,11.556 C5.176,6.923 8.932,3.167 13.565,3.167 C17.388,3.167 20.655,5.719 21.602,9.2 L23.447,9.2 C22.404,4.686 18.375,1.12 13.565,1.12 C7.458,1.12 2.518,6.06 2.518,12.167 C2.518,18.274 7.458,23.214 13.565,23.214 C19.348,23.214 24.238,18.736 24.787,13.08 C24.843,12.502 24.873,11.917 24.873,11.326 L12.956,11.326" />
                      <path fill="#EA4335" d="M12.065,2.067 C17.294,2.067 21.637,5.7 22.308,10.603 L24.167,10.603 C23.468,4.721 18.293,0.12 12.065,0.12 C5.438,0.12 0.055,5.503 0.055,12.13 C0.055,12.428 0.071,12.727 0.103,13.023 L1.942,13.023 C1.915,12.727 1.9,12.43 1.9,12.13 C1.9,6.518 6.453,1.965 12.065,1.965" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-150 font-black">{translate('googleLoginBtn', currentLang)}</span>
                  </>
                )}
              </button>

              {/* Dynamic Error */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-500 p-4 rounded-xl text-xs font-bold leading-relaxed flex items-start space-x-2.5 border border-red-200/40">
                  <i className="fas fa-circle-exclamation text-base mt-0.5 flex-shrink-0"></i>
                  <p>{error}</p>
                </div>
              )}

              <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 font-semibold uppercase">
                <i className="fas fa-lock text-[10px]"></i>
                <span>SSL এনক্রিপ্টেড সিকিউর সেশন</span>
              </div>
            </div>
          )}

          {/* Collapsible Local Recovery Panel (Invisible unless clicked, perfect for preview reliability) */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-750">
            <button 
              type="button"
              onClick={() => setShowLocalBypass(!showLocalBypass)}
              className="text-[10px] text-gray-400 hover:text-indigo-500 font-black uppercase text-center w-full block tracking-widest outline-none cursor-pointer"
            >
              🛠️ {showLocalBypass ? 'অফলাইন লগইন প্যানেল লুকান' : 'অফলাইন বাটন ও পাসওয়ার্ড প্যানেল'}
            </button>
            
            {showLocalBypass && (
              <form onSubmit={handleLocalBypassSubmit} className="mt-4 space-y-3.5 p-4 bg-gray-50 dark:bg-gray-750/30 rounded-2xl animate-fadeIn text-left">
                <p className="text-[10px] font-bold text-gray-400">গুগল পপআপে সমস্যা হলে অফলাইন ব্যাকআপ হিসেবে ব্যবহারযোগ্য:</p>
                
                <input 
                  type="text"
                  placeholder="ইউজারনেম (যেমন: admin)"
                  value={localUsername}
                  onChange={(e) => setLocalUsername(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"
                />

                <input 
                  type="password"
                  placeholder="পাসওয়ার্ড (যেমন: password)"
                  value={localPassword}
                  onChange={(e) => setLocalPassword(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"
                />

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs tracking-wider transition-all cursor-pointer"
                >
                  অফলাইন ভেরিফাই করুন ⚡
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Brand note */}
        <div className="mt-8 text-center text-white/50 text-xs font-semibold uppercase tracking-wide">
          <p>&copy; ২০২৬ RJ TANCOM SYSTEM. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
