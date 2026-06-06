
import React, { useState } from 'react';
import { LinkItem } from '../types';

interface LinksScreenProps {
  links: LinkItem[];
  onAddLink: (link: { title: string; url: string }) => void;
  isAdmin: boolean;
}

const LinksScreen: React.FC<LinksScreenProps> = ({ links, onAddLink, isAdmin }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && url) {
      onAddLink({ title, url });
      setTitle('');
      setUrl('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">দরকারি লিংক সমূহ</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">দ্রুত অ্যাক্সেসের জন্য অফিসিয়াল বা প্রয়োজনীয় লিংকগুলো এখানে পাবেন</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all font-bold"
          >
            <i className={`fas ${showAddForm ? 'fa-minus' : 'fa-plus'}`}></i>
            <span className="hidden sm:inline">{showAddForm ? 'ফর্ম লুকান' : 'নতুন যোগ করুন'}</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-2 border-blue-500 animate-slideDown grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-gray-400">লিংক টাইটেল</label>
            <input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="যেমনঃ মুভি সার্ভার"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-gray-400">ইউআরএল (URL)</label>
            <input 
              required
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-mono" 
              placeholder="https://example.com"
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">জমা দিন</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((link) => (
          <a 
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center"
          >
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
              <i className="fas fa-link"></i>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-bold group-hover:text-blue-600 transition-colors">{link.title}</h3>
              <p className="text-xs text-gray-400 truncate max-w-[200px] font-mono">{link.url}</p>
            </div>
            <div className="ml-auto text-gray-300 group-hover:text-blue-500 transition-colors">
              <i className="fas fa-external-link-alt"></i>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default LinksScreen;
