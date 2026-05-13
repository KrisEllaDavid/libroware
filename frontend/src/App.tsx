import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AdminPanel from "./components/AdminPanel";
import LoginPage from "./components/LoginPage";
import UserProfile from "./components/UserProfile";
import Navigation from "./components/Navigation";
import UserActivity from "./components/user/UserActivity";
import UserDashboard from "./components/user/UserDashboard";
import UserBookView from "./components/user/UserBookView";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import UserSetupForm from "./components/UserSetupForm";
import { ToastProvider } from "./context/ToastContext";
import ToastNotification from "./components/common/ToastNotification";
import SplashScreen from "./components/SplashScreen";
import AboutPage from "./components/AboutPage";
import ElectronSettings from "./components/ElectronSettings";
import OfflineBanner from "./components/common/OfflineBanner";
import { NetworkProvider } from "./context/NetworkContext";

// Electron: listen for navigate events from main process (e.g. open Settings)
const useElectronNav = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.onNavigate) return;
    const cleanup = api.onNavigate((route: string) => navigate(route));
    return cleanup;
  }, [navigate]);
};

// Tracks whether the splash has already played in this page session.
// Module-level so it survives component remounts without triggering the splash again.
let _splashDone = false;

// Component that conditionally renders based on auth state
const AppContent: React.FC = () => {
  const { isAuthenticated, user, isAdmin, isLibrarian } = useAuth();
  const [showSplash, setShowSplash] = useState(!_splashDone);
  useElectronNav();

  const handleSplashFinish = () => {
    _splashDone = true;
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} duration={5000} />;
  }

  const defaultPath = isAdmin()
    ? "/admin?tab=users"
    : isLibrarian()
    ? "/admin"
    : "/dashboard";

  return (
    <>
      <OfflineBanner />
      {!isAuthenticated ? (
        <LoginPage />
      ) : user?.requiresPasswordChange ? (
        <UserSetupForm />
      ) : (
        <>
          <Navigation />
          <main className="pt-20 px-4 container mx-auto">
            <Routes>
              <Route path="/admin/*" element={<AdminPanel />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/profile/:id" element={<UserProfile />} />
              <Route path="/activity" element={<UserActivity />} />
              <Route
                path="/dashboard"
                element={
                  isAdmin() || isLibrarian() ? (
                    <Navigate to={defaultPath} replace />
                  ) : (
                    <UserDashboard />
                  )
                }
              />
              <Route path="/books" element={<UserBookView />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/electron-settings" element={<ElectronSettings />} />
              <Route path="/" element={<Navigate to={defaultPath} replace />} />
              <Route path="*" element={<Navigate to={defaultPath} replace />} />
            </Routes>
          </main>
          <ToastNotification />
        </>
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NetworkProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              <AppContent />
            </div>
          </NetworkProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
