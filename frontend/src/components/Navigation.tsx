import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAdmin, isLibrarian } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't handle clicks if the X button was the target (it has its own handler)
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Close menu when escape key is pressed
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    console.log("Closing menu");
    setIsMenuOpen(false);
    document.body.classList.remove("mobile-menu-open");
  };

  const closeButtonHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Close button clicked with special handler");
    // Force menu to close with a slight delay to ensure state updates
    setTimeout(() => {
      setIsMenuOpen(false);
      document.body.classList.remove("mobile-menu-open");
    }, 10);
  };

  const openMenu = () => {
    setIsMenuOpen(true);
    document.body.classList.add("mobile-menu-open");
  };

  // Handle navigation with menu closing
  const handleNavigation = (path: string) => {
    closeMenu();
    // Use setTimeout to ensure menu closes before navigation
    setTimeout(() => {
      navigate(path);
    }, 50);
  };

  // Determine the dashboard link destination based on user role
  const dashboardLink = isAdmin()
    ? "/admin?tab=users" // Admin sees user management panel
    : isLibrarian()
    ? "/admin" // Librarian sees admin panel with default tab
    : "/dashboard"; // Regular user sees dashboard

  // Create direct links to admin panel tabs for easier navigation
  const getAdminTabLink = (tab: string) => {
    return `/admin?tab=${tab}`;
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const items = [
      {
        to: dashboardLink,
        label: isAdmin() || isLibrarian() ? "Admin Dashboard" : "Dashboard",
      },
      { to: "/books", label: "Books" },
    ];

    // Only show these to admins or librarians
    if (isAdmin() || isLibrarian()) {
      items.push(
        {
          to: getAdminTabLink("pending"),
          label: "Pending Requests",
        },
        {
          to: getAdminTabLink("history"),
          label: "Borrow History",
        }
      );
    }

    items.push({ to: "/activity", label: "My Activity" });
    items.push({ to: "/profile", label: "Profile" });

    return items;
  };

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

            <div className="hidden sm:flex sm:items-center space-x-4">
              <ThemeToggle />

              {/* Profile dropdown */}
              <div className="relative" ref={menuRef}>
                <div>
                  <button
                    type="button"
                    className="flex items-center max-w-xs text-sm bg-emerald-500 dark:bg-emerald-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 hover:shadow-md transform hover:scale-105"
                    id="user-menu-button"
                    aria-expanded={isMenuOpen}
                    aria-haspopup="true"
                    onClick={toggleMenu}
                  >
                    <span className="sr-only">Open user menu</span>
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
                </div>

                <div
                  className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10 text-gray-700 dark:text-gray-200 transition-all duration-200 transform origin-top-right 
                  ${
                    isMenuOpen
                      ? "scale-100 opacity-100"
                      : "scale-95 opacity-0 pointer-events-none"
                  }`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex={-1}
                >
                  <div className="px-4 py-2 text-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-0"
                  >
                    Your Profile
                  </Link>

                  <Link
                    to={dashboardLink}
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-1"
                  >
                    {isAdmin() || isLibrarian()
                      ? "Library Management"
                      : "Dashboard"}
                  </Link>

                  <Link
                    to="/about"
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-2"
                  >
                    About Libroware
                  </Link>

                  <button
                    className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-3"
                    onClick={() => logout()}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center sm:hidden">
              <ThemeToggle />
              {isMenuOpen ? (
                // X button (Close)
                <button
                  type="button"
                  className="ml-2 inline-flex items-center justify-center p-2 rounded-md text-emerald-100 hover:text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-all duration-200 menu-close-button"
                  aria-controls="mobile-menu"
                  aria-expanded={true}
                  onClick={closeButtonHandler}
                >
                  <span className="sr-only">Close main menu</span>
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <span className="absolute h-0.5 w-full bg-current transform rotate-45"></span>
                    <span className="absolute h-0.5 w-full bg-current transform -rotate-45"></span>
                  </div>
                </button>
              ) : (
                // Hamburger button (Open)
                <button
                  type="button"
                  className="ml-2 inline-flex items-center justify-center p-2 rounded-md text-emerald-100 hover:text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-all duration-200"
                  aria-controls="mobile-menu"
                  aria-expanded={false}
                  onClick={openMenu}
                >
                  <span className="sr-only">Open main menu</span>
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

        {/* Mobile menu with slide animation */}
        <div
          className={`sm:hidden transition-all duration-300 ease-in-out overflow-visible z-[100] bg-emerald-600 dark:bg-emerald-800 ${
            isMenuOpen
              ? "menu-slide-down"
              : "max-h-0 opacity-0 pointer-events-none"
          }`}
          id="mobile-menu"
          aria-expanded={isMenuOpen}
        >
          <div className="container mx-auto pt-4 pb-3 border-t border-emerald-700">
            <div className="flex items-center px-4 sm:px-6 lg:px-8">
              <div className="flex-shrink-0 transform transition-all duration-300 hover:scale-105">
                {user?.profilePicture ? (
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={user.profilePicture}
                    alt={`${user?.firstName} ${user?.lastName}`}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-emerald-200 dark:bg-emerald-900 flex items-center justify-center text-emerald-800 dark:text-emerald-200 font-medium shadow-md">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-sm font-medium text-emerald-100">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-4 sm:px-6 lg:px-8 pb-4">
              {/* Mobile menu items */}
              <button
                className="w-full text-left block py-2 px-3 text-base font-medium text-emerald-100 hover:text-white hover:bg-emerald-700 hover:scale-105 transform transition-all duration-200 rounded-md hover:shadow-md relative z-[101]"
                onClick={() => handleNavigation("/profile")}
                tabIndex={isMenuOpen ? 0 : -1}
              >
                Your Profile
              </button>
              <button
                className="w-full text-left block py-2 px-3 text-base font-medium text-emerald-100 hover:text-white hover:bg-emerald-700 hover:scale-105 transform transition-all duration-200 rounded-md hover:shadow-md relative z-[101]"
                onClick={() => handleNavigation(dashboardLink)}
                tabIndex={isMenuOpen ? 0 : -1}
              >
                {isAdmin() || isLibrarian()
                  ? "Library Management"
                  : "Dashboard"}
              </button>
              <button
                className="w-full text-left block py-2 px-3 text-base font-medium text-emerald-100 hover:text-white hover:bg-emerald-700 hover:scale-105 transform transition-all duration-200 rounded-md hover:shadow-md relative z-[101]"
                onClick={() => handleNavigation("/about")}
                tabIndex={isMenuOpen ? 0 : -1}
              >
                About Libroware
              </button>
              <button
                className="w-full text-left block py-2 px-3 text-base font-medium text-emerald-100 hover:text-white hover:bg-emerald-700 hover:scale-105 transform transition-all duration-200 rounded-md hover:shadow-md relative z-[101]"
                onClick={() => {
                  closeMenu();
                  setTimeout(() => {
                    logout();
                  }, 50);
                }}
                tabIndex={isMenuOpen ? 0 : -1}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
