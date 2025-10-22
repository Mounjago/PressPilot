import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items - STYLE PROFESSIONNEL SANS ICÔNES
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Artistes',
      href: '/artists',
      current: location.pathname.startsWith('/artists')
    },
    {
      name: 'Contacts',
      href: '/contacts',
      current: location.pathname === '/contacts'
    },
    {
      name: 'Phoning',
      href: '/phoning',
      current: location.pathname === '/phoning'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      current: location.pathname.startsWith('/analytics')
    }
  ];

  // User info (normalement récupéré du context/state)
  const user = {
    name: 'John Doe',
    email: 'john@presspilot.com',
    avatar: null
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Navigation item component
  const NavigationItem = ({ item }) => {
    const baseClasses = "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
    const activeClasses = item.current
      ? "bg-blue-100 text-blue-700"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

    return (
      <Link
        to={item.href}
        className={`${baseClasses} ${activeClasses}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {item.name}
      </Link>
    );
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo et navigation principale */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-gray-900">
                PressPilot
              </Link>
            </div>

            {/* Navigation desktop */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {navigationItems.map((item) => (
                <NavigationItem key={item.name} item={item} />
              ))}
            </div>
          </div>

          {/* Actions droite */}
          <div className="flex items-center">
            {/* Barre de recherche */}
            <div className="hidden md:block mr-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-64 pl-3 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>


            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center text-sm rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Menu utilisateur</span>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {user.name.charAt(0)}
                  </div>
                </button>
              </div>

              {/* Dropdown menu */}
              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                  >
                    <div className="py-1">
                      <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Profil
                      </button>
                      <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Paramètres
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="sr-only">Menu principal</span>
<span className="text-sm font-medium">{isMobileMenuOpen ? 'Fermer' : 'Menu'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Barre de recherche mobile */}
              <div className="px-3 py-2">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Navigation items */}
              {navigationItems.map((item) => (
                <NavigationItem key={item.name} item={item} />
              ))}

              {/* User menu mobile */}
              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="flex items-center px-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {user.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.name}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button className="flex w-full items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                    Profil
                  </button>
                  <button className="flex w-full items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                    Paramètres
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;