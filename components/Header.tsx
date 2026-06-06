
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  title: string;
  onMenuOpen: () => void;
  user: User;
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuOpen, user, onProfileClick }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onMenuOpen}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>
        
        <div 
          onClick={onProfileClick}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold group-hover:text-blue-600 transition-colors">{user.username}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.role === 'admin' ? 'এডমিন' : 'ব্যবহারকারী'}
            </p>
          </div>
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.username} 
              className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 group-hover:border-blue-500 transition-all"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold border-2 border-white dark:border-gray-700 group-hover:border-blue-500 transition-all">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
