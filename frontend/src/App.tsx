import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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

// Component that conditionally renders based on auth state
const AppContent: React.FC = () => {
  const { isAuthenticated, user, isAdmin, isLibrarian } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Handler for when splash screen animation completes
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Render splash screen if needed
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} duration={5000} />;
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If user needs to change password
  if (user?.requiresPasswordChange) {
    return <UserSetupForm />;
  }

  // Determine the default redirect path based on user role
  const defaultPath = isAdmin()
    ? "/admin?tab=users"
    : isLibrarian()
    ? "/admin"
    : "/dashboard";

  // Otherwise show routes with navigation
  return (
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
              /* Redirect admins and librarians to admin panel */
              isAdmin() || isLibrarian() ? (
                <Navigate to={defaultPath} replace />
              ) : (
                <UserDashboard />
              )
            }
          />
          <Route path="/books" element={<UserBookView />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/" element={<Navigate to={defaultPath} replace />} />
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </main>
      <ToastNotification />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <AppContent />
          </div>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
