import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import UserManagement from "./admin/UserManagement";
import BookManagement from "./admin/BookManagement";
import AuthorManagement from "./admin/AuthorManagement";
import CategoryManagement from "./admin/CategoryManagement";
import Dashboard from "./dashboard/Dashboard";
import PendingRequests from "./admin/PendingRequests";
import BorrowHistory from "./admin/BorrowHistory";
import { useLocation, Navigate } from "react-router-dom";

const AdminPanel: React.FC = () => {
  const { isAdmin, isLibrarian, user } = useAuth();
  const location = useLocation();

  // If not admin or librarian, redirect to user dashboard
  if (!isAdmin() && !isLibrarian()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Get tab from query params if available
  const getTabFromQueryParams = () => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || null;
  };

  // Determine initial active tab based on user role and query params
  const getInitialTab = () => {
    const queryTab = getTabFromQueryParams();

    // If a tab is specified in the query params, validate it
    if (queryTab) {
      // Check if the tab is valid
      if (
        [
          "home",
          "users",
          "books",
          "authors",
          "categories",
          "pending",
          "history",
        ].includes(queryTab)
      ) {
        return queryTab;
      }
    }

    // Default tab is home
    return "home";
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  // Update URL when tab changes
  useEffect(() => {
    // Only update URL if the tab is different from what's in the query params
    const currentQueryTab = getTabFromQueryParams();
    if (currentQueryTab !== activeTab) {
      // Update URL without using navigate
      const searchParams = new URLSearchParams(location.search);
      searchParams.set("tab", activeTab);
      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      window.history.pushState({ path: newUrl }, "", newUrl);
    }
  }, [activeTab, location.search]);

  // Check query params when location changes
  useEffect(() => {
    const queryTab = getTabFromQueryParams();
    if (queryTab && queryTab !== activeTab) {
      setActiveTab(getInitialTab());
    }
  }, [location.search]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Render tab button with appropriate styling
  const renderTabButton = (tab: string, label: string) => {
    return (
      <button
        key={tab}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
          activeTab === tab
            ? "bg-emerald-600 text-white shadow-md"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        onClick={() => handleTabChange(tab)}
      >
        {label}
      </button>
    );
  };

  const renderTabContent = () => {
    // Apply transition classes based on direction
    const transitionClass = `transform transition-all duration-300 ${
      activeTab === "right" ? "translate-x-0" : "-translate-x-0"
    }`;

    // Add error catching wrapper for tab content
    try {
      switch (activeTab) {
        case "home":
          return (
            <div className={transitionClass}>
              <Dashboard />
            </div>
          );
        case "users":
          return (
            <div className={transitionClass}>
              <UserManagement />
            </div>
          );
        case "books":
          return (
            <div className={transitionClass}>
              <BookManagement
                onAuthorCreate={() => handleTabChange("authors")}
                onCategoryCreate={() => handleTabChange("categories")}
              />
            </div>
          );
        case "authors":
          return (
            <div className={transitionClass}>
              <AuthorManagement />
            </div>
          );
        case "categories":
          return (
            <div className={transitionClass}>
              <CategoryManagement />
            </div>
          );
        case "pending":
          return (
            <div className={transitionClass}>
              <PendingRequests />
            </div>
          );
        case "history":
          return (
            <div className={transitionClass}>
              <BorrowHistory />
            </div>
          );
        default:
          return null;
      }
    } catch (error) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
            Error loading tab content
          </h3>
          <p className="mt-2 text-red-700 dark:text-red-300">
            There was an error rendering this tab. Please try again or select a
            different tab.
          </p>
          <pre className="mt-4 p-3 bg-red-100 dark:bg-red-800/30 rounded overflow-auto text-xs">
            {error instanceof Error ? error.message : "Unknown error"}
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Make the tabs stick to the top of the viewport when scrolling, accounting for the main nav */}
      <div className="sticky top-16 z-50 bg-white dark:bg-gray-900 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 shadow-md transition-all duration-200">
        <div className="flex overflow-x-auto space-x-2">
          {renderTabButton("home", "Dashboard")}
          {renderTabButton("users", "Users")}
          {renderTabButton("books", "Books")}
          {renderTabButton("authors", "Authors")}
          {renderTabButton("categories", "Categories")}
          {renderTabButton("pending", "Pending Requests")}
          {renderTabButton("history", "Borrow History")}
        </div>
      </div>

      {/* Add padding to prevent content from showing under the fixed tabs */}
      <div className="mt-6">{renderTabContent()}</div>
    </div>
  );
};

export default AdminPanel;
