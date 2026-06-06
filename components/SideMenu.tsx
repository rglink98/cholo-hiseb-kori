
import React from 'react';
import { ActiveScreen } from '../types';
import { translate, Language } from '../translations';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeScreen: ActiveScreen;
  onScreenChange: (screen: ActiveScreen) => void;
  isAdmin: boolean;
  onLogout: () => void;
  language?: Language;
}

const SideMenu: React.FC<SideMenuProps> = ({ 
  isOpen, 
  onClose, 
  activeScreen, 
  onScreenChange, 
  isAdmin, 
  onLogout,
  language = 'bn'
}) => {
  const menuItems = [
    { id: 'home', label: translate('dashboard', language), icon: 'fa-house' },
    { id: 'profile', label: translate('profile', language), icon: 'fa-user-circle' },
    { id: 'menu', label: translate('entryForm', language), icon: 'fa-pen-to-square' },
    { id: 'history', label: translate('history', language), icon: 'fa-clock-rotate-left' },
    { id: 'docs', label: translate('docs', language), icon: 'fa-file-lines' },
    { id: 'audio_clips', label: translate('audioClips', language), icon: 'fa-microphone-lines' },
    { id: 'budget', label: translate('budget', language), icon: 'fa-chart-pie' },
    { id: 'links', label: translate('links', language), icon: 'fa-link' },
    { id: 'about', label: translate('about', language), icon: 'fa-circle-info' },
  ];

  if (isAdmin) {
    // Insert user management control at index 4 (after history)
    menuItems.splice(4, 0, { id: 'user_management', label: translate('userManagement', language), icon: 'fa-users-gear' });
  }

  const handleMenuClick = (id: ActiveScreen) => {
    onScreenChange(id);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/55 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 z-50 transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
              <i className="fas fa-layer-group"></i>
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              RJ TANCOM
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-255 cursor-pointer">
            <i className="fas fa-xmark text-xl"></i>
          </button>
        </div>

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id as ActiveScreen)}
              className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all border-0 text-left outline-none cursor-pointer ${
                activeScreen === item.id 
                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-extrabold shadow-3xs' 
                : 'text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-gray-750/55'
              }`}
            >
              <div className="w-8 flex justify-center">
                <i className={`fas ${item.icon} text-lg`}></i>
              </div>
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-4 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 rounded-2xl transition-colors font-bold border-0 text-left outline-none cursor-pointer"
          >
            <div className="w-8 flex justify-center text-red-500">
              <i className="fas fa-right-from-bracket"></i>
            </div>
            <span className="text-xs font-bold">{translate('logout', language)}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SideMenu;
