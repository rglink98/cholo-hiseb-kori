
import React, { useRef } from 'react';

interface AboutScreenProps {
  onBackup: () => void;
  onRestore: (file: File) => void;
  isAdmin: boolean;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ onBackup, onRestore, isAdmin }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn font-sans pb-20">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center space-y-6">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/30 mx-auto flex items-center justify-center text-white text-4xl">
          <i className="fas fa-layer-group"></i>
        </div>
        <h2 className="text-2xl font-black">RJ TANCOM ড্যাশবোর্ড v2.0</h2>
        <p className="text-gray-600 dark:text-gray-400 font-medium">নিরাপদ এবং নির্ভরযোগ্য অফিস ম্যানেজমেন্ট সিস্টেম।</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
        <h3 className="text-lg font-bold flex items-center">
          <i className="fas fa-shield-halved mr-3 text-blue-500"></i>
          ডেটা নিরাপত্তা ও ব্যাকআপ
        </h3>
        <p className="text-xs text-gray-400 font-medium leading-relaxed">আপনার সমস্ত ডাটা মেমোরিতে এবং সুরক্ষিত ক্লাউড অথেন্টিকেশনে সংরক্ষিত থাকে। কোনো কারণে ডাটা সরাতে বা ব্যাকআপ করে পিসিতে সেভ রাখতে নিচে ক্লিক করে ব্যাকআপ ফাইলটি সংরক্ষণ করুন।</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <button 
            onClick={onBackup}
            className="flex items-center justify-center space-x-3 p-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 cursor-pointer text-xs"
          >
            <i className="fas fa-download"></i>
            <span>ব্যাকআপ ডাউনলোড</span>
          </button>
          
          {isAdmin && (
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files && onRestore(e.target.files[0])}
                className="hidden" 
                accept=".json"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-3 p-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 cursor-pointer text-xs"
              >
                <i className="fas fa-upload"></i>
                <span>ব্যাকআপ আপলোড</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-gray-400 text-xs">
        <p>&copy; ২০২৬ RJ TANCOM ড্যাশবোর্ড। এই অ্যাপটি শুধুমাত্র অনুমোদিত ব্যবহারের জন্য।</p>
      </div>
    </div>
  );
};

export default AboutScreen;
