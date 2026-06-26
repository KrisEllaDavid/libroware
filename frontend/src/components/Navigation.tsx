import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import { useTranslation } from "react-i18next";
import { GET_UNREAD_NOTIFICATIONS_COUNT } from "../graphql/queries";

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data } = useQuery(GET_UNREAD_NOTIFICATIONS_COUNT, {
    pollInterval: 30000,
    fetchPolicy: "network-only",
  });
  const count: number = data?.unreadNotificationsCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => navigate("/notifications")}
      className="relative p-2 rounded-full text-emerald-100 hover:text-white hover:bg-emerald-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white"
      title={t('notifications.title')}
      aria-label={count > 0 ? t('notifications.unreadCount', { count }) : t('notifications.title')}
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
};

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAdmin, isLibrarian } = useAuth();
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('libroware_lang', next);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetEl = event.target as HTMLElement;
      if (
        targetEl.closest(".menu-close-button") ||
        targetEl.closest("#mobile-menu")
      ) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  const toggleMenu  = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu   = () => { setIsMenuOpen(false); document.body.classList.remove("mobile-menu-open"); };
  const openMenu    = () => { setIsMenuOpen(true); document.body.classList.add("mobile-menu-open"); };

  const closeButtonHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    document.body.classList.remove("mobile-menu-open");
  };

  const handleNavigation = (path: string) => { closeMenu(); navigate(path); };

  const dashboardLink = isAdmin()
    ? "/admin?tab=users"
    : isLibrarian()
    ? "/admin"
    : "/dashboard";

  const getAdminTabLink = (tab: string) => `/admin?tab=${tab}`;

  return (
    <>
      <nav className="bg-emerald-600 dark:bg-emerald-800 shadow-md text-white fixed top-0 left-0 right-0 z-[100]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="text-xl font-bold text-white transition-transform hover:scale-105 duration-200"
              >
                Libroware
              </Link>
            </div>

            <div className="hidden sm:flex sm:items-center space-x-2">
              <ThemeToggle />
              <NotificationBell />

              {/* Profile dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className="flex items-center max-w-xs text-sm bg-emerald-500 dark:bg-emerald-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 hover:shadow-md transform hover:scale-105"
                  id="user-menu-button"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  onClick={toggleMenu}
                >
                  <span className="sr-only">{t('nav.openUserMenu')}</span>
                  {user?.profilePicture ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={user.profilePicture}
                      alt={`${user?.firstName} ${user?.lastName}`}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-emerald-200 dark:bg-emerald-900 flex items-center justify-center text-emerald-800 dark:text-emerald-200 font-medium">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </div>
                  )}
                </button>

                <div
                  className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10 text-gray-700 dark:text-gray-200 transition-all duration-200 transform origin-top-right
                  ${isMenuOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex={-1}
                >
                  <div className="px-4 py-2 text-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
                  </div>

                  <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    {t('nav.yourProfile')}
                  </Link>
                  <Link to={dashboardLink} className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    {isAdmin() || isLibrarian() ? t('nav.libraryManagement') : t('nav.dashboard')}
                  </Link>
                  <Link to="/notifications" className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    {t('notifications.title')}
                  </Link>
                  <Link to="/about" className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    {t('nav.aboutLibroware')}
                  </Link>
                  <button
                    className="w-full text-left flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    role="menuitem" tabIndex={-1} onClick={toggleLanguage}
                  >
                    <span>{t('lang.switch')}</span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('lang.current')}</span>
                  </button>
                  <button
                    className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    role="menuitem" tabIndex={-1} onClick={() => logout()}
                  >
                    {t('nav.signOut')}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center sm:hidden gap-1">
              <ThemeToggle />
              <NotificationBell />
              {isMenuOpen ? (
                <button
                  type="button"
                  className="ml-1 inline-flex items-center justify-center p-2 rounded-md text-emerald-100 hover:text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-all duration-200 menu-close-button"
                  aria-controls="mobile-menu" aria-expanded={true} onClick={closeButtonHandler}
                >
                  <span className="sr-only">{t('nav.closeMenu')}</span>
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <span className="absolute h-0.5 w-full bg-current transform rotate-45"></span>
                    <span className="absolute h-0.5 w-full bg-current transform -rotate-45"></span>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  className="ml-1 inline-flex items-center justify-center p-2 rounded-md text-emerald-100 hover:text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-all duration-200"
                  aria-controls="mobile-menu" aria-expanded={false} onClick={openMenu}
                >
                  <span className="sr-only">{t('nav.openMenu')}</span>
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <span className="absolute h-0.5 w-full bg-current transform -translate-y-1.5"></span>
                    <span className="absolute h-0.5 w-full bg-current"></span>
                    <span className="absolute h-0.5 w-full bg-current transform translate-y-1.5"></span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`sm:hidden transition-all duration-300 ease-in-out overflow-visible z-[100] bg-emerald-600 dark:bg-emerald-800 ${
            isMenuOpen ? "menu-slide-down" : "max-h-0 opacity-0 pointer-events-none"
          }`}
          id="mobile-menu"
          aria-expanded={isMenuOpen}
        >
          <div className="container mx-auto pt-4 pb-3 border-t border-emerald-700">
            <div className="flex items-center px-4 sm:px-6 lg:px-8">
              <div className="flex-shrink-0 transform transition-all duration-300 hover:scale-105">
                {user?.profilePicture ? (
                  <img className="h-10 w-10 rounded-full object-cover" src={user.profilePicture} alt="" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-emerald-200 dark:bg-emerald-900 flex items-center justify-center text-emerald-800 dark:text-emerald-200 font-medium shadow-md">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">{user?.firstName} {user?.lastName}</div>
                <div className="text-sm font-medium text-emerald-100">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-4 sm:px-6 lg:px-8 pb-4">
              {[
                { label: t('nav.yourProfile'), path: '/profile' },
                { label: isAdmin() || isLibrarian() ? t('nav.libraryManagement') : t('nav.dashboard'), path: dashboardLink },
                { label: t('notifications.title'), path: '/notifications' },
                { label: t('nav.aboutLibroware'), path: '/about' },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  className="w-full text-left block py-2 px-3 text-base font-medium text-emerald-100 hover:text-white hover:bg-emerald-700 hover:scale-105 transform transition-all duration-200 rounded-md hover:shadow-md relative z-[101]"
                  onClick={() => handleNavigation(path)}
                  tabIndex={isMenuOpen ? 0 : -1}
                >
                  {label}
                </button>
              ))}
              <button
                className="w-full text-left flex items-center justify-between py-2 px-3 text-base font-medium text-emerald-100 hover:text-white hover:bg-emerald-700 hover:scale-105 transform transition-all duration-200 rounded-md hover:shadow-md relative z-[101]"
                onClick={toggleLanguage} tabIndex={isMenuOpen ? 0 : -1}
              >
                <span>{t('lang.switch')}</span>
                <span className="text-xs font-bold">{t('lang.current')}</span>
              </button>
              <button
                className="w-full text-left block py-2 px-3 text-base font-medium text-emerald-100 hover:text-white hover:bg-emerald-700 hover:scale-105 transform transition-all duration-200 rounded-md hover:shadow-md relative z-[101]"
                onClick={() => { closeMenu(); logout(); }}
                tabIndex={isMenuOpen ? 0 : -1}
              >
                {t('nav.signOut')}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
