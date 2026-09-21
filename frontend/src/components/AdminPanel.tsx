import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import UserManagement from "./admin/UserManagement";
import BookManagement from "./admin/BookManagement";
import AuthorManagement from "./admin/AuthorManagement";
import CategoryManagement from "./admin/CategoryManagement";
import FinesManagement from "./admin/FinesManagement";
import DeletedRecords from "./admin/DeletedRecords";
import AuditLogViewer from "./admin/AuditLogViewer";
import AnalyticsDashboard from "./dashboard/AnalyticsDashboard";
import PendingRequests from "./admin/PendingRequests";
import BorrowHistory from "./admin/BorrowHistory";
import { useLocation, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ErrorState, TabItem, Tabs } from "./ui";

/** Guards a tab's subtree so one failing query can't blank the whole panel. */
class TabBoundary extends React.Component<
  { tab: string; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prev: { tab: string }) {
    // A new tab gets a clean slate — otherwise one broken tab wedges the panel.
    if (prev.tab !== this.props.tab && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="This section could not be loaded"
          message={this.state.error.message}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return <>{this.props.children}</>;
  }
}

const AdminPanel: React.FC = () => {
  const { isAdmin, isLibrarian } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  // If not admin or librarian, redirect to user dashboard
  if (!isAdmin() && !isLibrarian()) {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs: TabItem[] = useMemo(() => {
    const base: TabItem[] = [
      { id: "home", label: t("admin.tabs.home"), icon: "chart" },
      { id: "users", label: t("admin.tabs.users"), icon: "users" },
      { id: "books", label: t("admin.tabs.books"), icon: "books" },
      { id: "authors", label: t("admin.tabs.authors"), icon: "user" },
      { id: "categories", label: t("admin.tabs.categories"), icon: "tag" },
      { id: "pending", label: t("admin.tabs.pending"), icon: "inbox" },
      { id: "history", label: t("admin.tabs.history"), icon: "history" },
      { id: "fines", label: t("admin.tabs.fines"), icon: "coins" },
    ];
    if (isAdmin()) {
      base.push(
        { id: "deleted", label: t("admin.tabs.deleted", "Recycle bin"), icon: "trash" },
        { id: "audit", label: t("admin.tabs.audit", "Audit log"), icon: "shield" }
      );
    }
    return base;
  }, [t, isAdmin]);

  const getTabFromQueryParams = () => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || null;
  };

  const getInitialTab = () => {
    const queryTab = getTabFromQueryParams();
    if (queryTab && tabs.some((tab) => tab.id === queryTab)) return queryTab;
    return "home";
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  // Update URL when tab changes
  useEffect(() => {
    const currentQueryTab = getTabFromQueryParams();
    if (currentQueryTab !== activeTab) {
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":       return <AnalyticsDashboard />;
      case "users":      return <UserManagement />;
      case "books":      return <BookManagement />;
      case "authors":    return <AuthorManagement />;
      case "categories": return <CategoryManagement />;
      case "pending":    return <PendingRequests />;
      case "history":    return <BorrowHistory />;
      case "fines":      return <FinesManagement />;
      case "deleted":    return <DeletedRecords />;
      case "audit":      return <AuditLogViewer />;
      default:           return null;
    }
  };

  return (
    <div className="app-shell pb-10 pt-6 sm:pt-8">
      {/*
        The tab bar sticks under the fixed nav via `top-[var(--nav-h)]` rather
        than a hardcoded `top-16`, so the two can never drift apart. It also
        bleeds to the shell's gutters so the underline runs the full width of
        the content instead of stopping short of it.
      */}
      <Tabs
        items={tabs}
        active={activeTab}
        onChange={setActiveTab}
        sticky
        className="mb-6 sm:mb-8"
      />

      <TabBoundary tab={activeTab}>
        {/* Keyed so a tab switch remounts rather than reconciling a completely
            different screen into the previous one's DOM — which is what made
            the transition between tabs flash stale rows. */}
        <div key={activeTab} className="animate-fade-in">
          {renderTabContent()}
        </div>
      </TabBoundary>
    </div>
  );
};

export default AdminPanel;
