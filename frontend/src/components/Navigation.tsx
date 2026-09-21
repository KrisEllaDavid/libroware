import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import { useTranslation } from "react-i18next";
import { GET_UNREAD_NOTIFICATIONS_COUNT } from "../graphql/queries";
import { Avatar, Icon, IconName, cn } from "./ui";

/* ── Notification bell ────────────────────────────────────────────────────── */

const NotificationBell: React.FC<{ onNavigate?: () => void }> = ({
  onNavigate,
}) => {
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
      onClick={() => {
        onNavigate?.();
        navigate("/notifications");
      }}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-emerald-50 transition-all duration-200 ease-soft hover:bg-white/10 active:scale-95"
      title={t("notifications.title")}
      aria-label={
        count > 0
          ? t("notifications.unreadCount", { count })
          : t("notifications.title")
      }
    >
      <Icon name="bell" size={19} />
      {count > 0 && (
        // Square-ish counter rather than a round dot: it has to hold "99+"
        // without the glyph crowding the edges.
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-md border border-emerald-600 bg-amber-400 px-1 text-[0.5625rem] font-bold leading-none tabular-nums text-amber-950 dark:border-emerald-800">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
};

/* ── Navigation ───────────────────────────────────────────────────────────── */

interface NavLinkDef {
  label: string;
  path: string;
  icon: IconName;
  /** Path prefixes that should also light this item up. */
  match?: string[];
}

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout, isAdmin, isLibrarian } = useAuth();
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);

  const staff = isAdmin() || isLibrarian();
  const dashboardLink = isAdmin()
    ? "/admin?tab=users"
    : isLibrarian()
    ? "/admin"
    : "/dashboard";

  // The primary destinations, surfaced as real links rather than buried in a
  // dropdown. Previously the only way to reach any page was through the avatar
  // menu, which gave no sense of where you were in the product.
  const primaryLinks: NavLinkDef[] = staff
    ? [
        { label: t("nav.libraryManagement"), path: dashboardLink, icon: "grid", match: ["/admin"] },
        { label: t("browseBooks.title"), path: "/books", icon: "books" },
        { label: t("notifications.title"), path: "/notifications", icon: "bell" },
      ]
    : [
        { label: t("nav.dashboard"), path: "/dashboard", icon: "grid" },
        { label: t("browseBooks.title"), path: "/books", icon: "books" },
        { label: t("userDashboard.tabs.myRequests"), path: "/activity", icon: "history" },
      ];

  const isCurrent = (link: NavLinkDef) => {
    const base = link.path.split("?")[0];
    const here = location.pathname;
    if (link.match) return link.match.some((m) => here.startsWith(m));
    return here === base || here.startsWith(`${base}/`);
  };

  const toggleLanguage = () => {
    const next = i18n.language === "en" ? "fr" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("libroware_lang", next);
  };

  // Close the profile dropdown on an outside click.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Any navigation dismisses both menus.
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    document.body.classList.remove("mobile-menu-open");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      document.body.classList.remove("mobile-menu-open");
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  // The drawer locks the page behind it; make sure the lock can't outlive it.
  useEffect(
    () => () => document.body.classList.remove("mobile-menu-open"),
    []
  );

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.classList.remove("mobile-menu-open");
  };

  const openMenu = () => {
    setIsMenuOpen(true);
    document.body.classList.add("mobile-menu-open");
  };

  const handleNavigation = (path: string) => {
    closeMenu();
    navigate(path);
  };

  const menuLinks: NavLinkDef[] = [
    ...primaryLinks,
    { label: t("nav.yourProfile"), path: "/profile", icon: "user" },
    { label: t("nav.aboutLibroware"), path: "/about", icon: "info" },
  ];

  return (
    <>
      {/* Keyboard users land here first. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-emerald-700 focus:shadow-lg dark:focus:bg-gray-800 dark:focus:text-emerald-300"
      >
        {t("nav.skipToContent", "Skip to content")}
      </a>

      <nav
        className="fixed inset-x-0 top-0 z-nav h-16 border-b border-emerald-700/60 bg-emerald-700 text-white shadow-sm dark:border-emerald-950 dark:bg-emerald-900"
        aria-label={t("nav.primary", "Primary")}
      >
        <div className="mx-auto flex h-full max-w-shell items-center gap-2 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            to={dashboardLink}
            className="group flex shrink-0 items-center gap-2.5 rounded-lg py-1 pr-2 transition-opacity duration-200 hover:opacity-90"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-transform duration-250 ease-spring group-hover:scale-105">
              <Icon name="books" size={19} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              {t("app.name", "Libroware")}
            </span>
          </Link>

          {/* Primary destinations — desktop */}
          <div className="ml-4 hidden items-center gap-1 lg:flex">
            {primaryLinks.map((link) => {
              const current = isCurrent(link);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-soft",
                    current
                      ? "bg-white/20 text-white"
                      : "text-emerald-50/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon name={link.icon} size={17} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />

            {/* Profile menu — desktop */}
            <div className="relative hidden sm:block" ref={profileRef}>
              <button
                type="button"
                className="ml-1 flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors duration-200 hover:bg-white/10"
                id="user-menu-button"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                onClick={() => setIsProfileOpen((v) => !v)}
              >
                <span className="sr-only">{t("nav.openUserMenu")}</span>
                <Avatar
                  src={user?.profilePicture}
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size="sm"
                  ring
                />
                <Icon
                  name="chevronDown"
                  size={15}
                  className={cn(
                    "text-emerald-100 transition-transform duration-250 ease-spring",
                    isProfileOpen && "rotate-180"
                  )}
                />
              </button>

              <div
                className={cn(
                  "absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-700 shadow-xl transition-all duration-200 ease-spring dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
                  isProfileOpen
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-95 opacity-0"
                )}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
              >
                <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <Avatar
                    src={user?.profilePicture}
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="p-1.5">
                  <MenuLink to="/profile" icon="user" label={t("nav.yourProfile")} />
                  <MenuLink
                    to={dashboardLink}
                    icon="grid"
                    label={staff ? t("nav.libraryManagement") : t("nav.dashboard")}
                  />
                  <MenuLink
                    to="/notifications"
                    icon="bell"
                    label={t("notifications.title")}
                  />
                  <MenuLink
                    to="/about"
                    icon="info"
                    label={t("nav.aboutLibroware")}
                  />
                </div>

                <div className="border-t border-gray-200 p-1.5 dark:border-gray-700">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleLanguage}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Icon name="globe" size={17} className="text-gray-400" />
                    <span className="flex-1 text-left">{t("lang.switch")}</span>
                    <span className="text-2xs font-bold uppercase text-gray-500 dark:text-gray-400">
                      {t("lang.current")}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors duration-150 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    <Icon name="logout" size={17} />
                    {t("nav.signOut")}
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer trigger — mobile. The two bars morph into an X rather
                than swapping icons, so the control reads as one object. */}
            <button
              type="button"
              className="ml-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-emerald-50 transition-all duration-200 hover:bg-white/10 active:scale-95 sm:hidden"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              onClick={() => (isMenuOpen ? closeMenu() : openMenu())}
            >
              <span className="relative block h-4 w-5">
                <span
                  className={cn(
                    "absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-spring",
                    isMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0.5"
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-spring",
                    isMenuOpen
                      ? "top-1/2 -translate-y-1/2 -rotate-45"
                      : "bottom-0.5"
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ───────────────────────────────────────────────────
          A panel sliding in from the edge, not a section pushing the page
          down. Pushing content reflows the whole document on a device that
          can least afford it, and loses the user's scroll position. */}
      <div
        className={cn(
          "fixed inset-0 z-drawer bg-gray-900/40 transition-opacity duration-300 sm:hidden",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <aside
        id="mobile-menu"
        aria-hidden={!isMenuOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-drawer flex w-[min(20rem,85vw)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-spring dark:bg-gray-900 sm:hidden",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 border-b border-gray-200 bg-emerald-700 px-5 py-4 text-white dark:border-gray-800 dark:bg-emerald-900">
          <Avatar
            src={user?.profilePicture}
            firstName={user?.firstName}
            lastName={user?.lastName}
            size="md"
            ring
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-emerald-100">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            aria-label={t("nav.closeMenu")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-50 transition-colors hover:bg-white/20"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {menuLinks.map((link) => {
              const current = isCurrent(link);
              return (
                <li key={link.path}>
                  <button
                    type="button"
                    tabIndex={isMenuOpen ? 0 : -1}
                    aria-current={current ? "page" : undefined}
                    onClick={() => handleNavigation(link.path)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                      current
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon
                      name={link.icon}
                      size={18}
                      className={
                        current
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-gray-400"
                      }
                    />
                    {link.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="safe-bottom space-y-0.5 border-t border-gray-200 p-3 dark:border-gray-800">
          <button
            type="button"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={toggleLanguage}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Icon name="globe" size={18} className="text-gray-400" />
            <span className="flex-1 text-left">{t("lang.switch")}</span>
            <span className="text-2xs font-bold uppercase text-gray-500 dark:text-gray-400">
              {t("lang.current")}
            </span>
          </button>
          <button
            type="button"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={() => {
              closeMenu();
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <Icon name="logout" size={18} />
            {t("nav.signOut")}
          </button>
        </div>
      </aside>
    </>
  );
};

const MenuLink: React.FC<{ to: string; icon: IconName; label: string }> = ({
  to,
  icon,
  label,
}) => (
  <Link
    to={to}
    role="menuitem"
    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700"
  >
    <Icon name={icon} size={17} className="text-gray-400" />
    {label}
  </Link>
);

export default Navigation;
