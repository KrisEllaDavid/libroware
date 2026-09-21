import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import UserActivity from "./UserActivity";
import UserBorrows from "./UserBorrows";
import BorrowStatistics from "./BorrowStatistics";
import UserBookView from "./UserBookView";
import UserReservations from "./UserReservations";
import UserFines from "./UserFines";
import { GET_USER_FINES } from "../../graphql/queries";
import {
  Button,
  Card,
  CardBody,
  ErrorState,
  PageHeader,
  ShelfBand,
  StatCard,
  StatSkeleton,
  TabItem,
  Tabs,
  Tag,
} from "../ui";
import { Link } from "react-router-dom";

// GraphQL queries
const GET_USER_BORROWS = gql`
  query GetUserBorrows($userId: ID!) {
    userBorrows(userId: $userId) {
      id
      book {
        id
        title
        isbn
        coverImage
        authors {
          name
        }
        categories {
          name
        }
      }
      borrowedAt
      dueDate
      returnedAt
      status
    }
  }
`;

// Types for user statistics
interface UserStats {
  totalBorrows: number;
  activeBorrows: number;
  overdueBorrows: number;
  returnedBooks: number;
  favoriteCategory: string | null;
}

// Define tabs
enum Tab {
  DASHBOARD    = "dashboard",
  MY_BOOKS     = "my-books",
  MY_REQUESTS  = "my-requests",
  RESERVATIONS = "reservations",
  MY_FINES     = "my-fines",
  BROWSE_BOOKS = "browse-books",
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t }    = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [userStats, setUserStats] = useState<UserStats>({
    totalBorrows: 0,
    activeBorrows: 0,
    overdueBorrows: 0,
    returnedBooks: 0,
    favoriteCategory: null,
  });

  // Query borrows for this user
  const {
    data: borrowsData,
    loading: borrowsLoading,
    error: borrowsError,
    refetch,
  } = useQuery(GET_USER_BORROWS, {
    variables: { userId: user?.id },
    skip: !user?.id,
    fetchPolicy: "network-only",
  });

  // Query fines for this user (used for the dashboard summary card)
  const { data: finesData } = useQuery(GET_USER_FINES, {
    variables: { userId: user?.id, take: 100 },
    skip: !user?.id,
    fetchPolicy: "network-only",
  });
  const outstandingFines: number = (finesData?.userFines ?? [])
    .filter((f: any) => !f.waived && !f.paidAt)
    .reduce((s: number, f: any) => s + f.amount, 0);

  // Process borrow data to calculate statistics
  useEffect(() => {
    if (borrowsData?.userBorrows) {
      const borrows = borrowsData.userBorrows;

      // Count active and overdue borrows
      const activeBorrows = borrows.filter(
        (b: any) => b.status === "BORROWED" && !b.returnedAt
      ).length;
      const overdueBorrows = borrows.filter(
        (b: any) => b.status === "OVERDUE"
      ).length;
      const returnedBooks = borrows.filter((b: any) => b.returnedAt).length;

      // Determine favorite category (most frequently borrowed category)
      const categoryMap = new Map<string, number>();

      borrows.forEach((borrow: any) => {
        if (borrow.book?.categories?.length > 0) {
          borrow.book.categories.forEach((category: any) => {
            if (category?.name) {
              categoryMap.set(
                category.name,
                (categoryMap.get(category.name) || 0) + 1
              );
            }
          });
        }
      });

      // Find the most frequent category
      let favoriteCategory = null;
      let maxCount = 0;

      categoryMap.forEach((count, category) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteCategory = category;
        }
      });

      setUserStats({
        totalBorrows: borrows.length,
        activeBorrows,
        overdueBorrows,
        returnedBooks,
        favoriteCategory,
      });
    }
  }, [borrowsData]);

  // Format borrows data for BorrowStatistics component
  const getFormattedBorrows = () => {
    if (!borrowsData?.userBorrows) return [];

    return borrowsData.userBorrows.map((borrow: any) => ({
      id: borrow.id,
      borrowDate: borrow.borrowedAt,
      returnDate: borrow.returnedAt,
      book: {
        id: borrow.book.id,
        title: borrow.book.title,
        categories: borrow.book.categories,
      },
    }));
  };

  // Format borrows data for UserBorrows component
  const getFormattedUserBorrows = () => {
    if (!borrowsData?.userBorrows) return [];

    return borrowsData.userBorrows.map((borrow: any) => ({
      id: borrow.id,
      book: {
        id: borrow.book.id,
        title: borrow.book.title,
        isbn: borrow.book.isbn,
        authors: borrow.book.authors,
        coverImage: borrow.book.coverImage,
      },
      borrowedAt: borrow.borrowedAt,
      dueDate: borrow.dueDate,
      returnedAt: borrow.returnedAt,
      status: borrow.status,
    }));
  };

  // Handle tab change
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return (
          <div className="space-y-6">
            {/*
              Four figures that answer "where do I stand": what I've borrowed
              in total, what's late, what I've given back, what I owe. Overdue
              and fines turn red only when they are non-zero, so a member in
              good standing sees a calm screen.
            */}
            {borrowsLoading ? (
              <StatSkeleton count={4} />
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                  icon="books"
                  tone="brand"
                  label={t('userDashboard.totalBorrows', 'Total borrows')}
                  value={userStats.totalBorrows}
                />
                <StatCard
                  icon="clock"
                  tone={userStats.overdueBorrows > 0 ? 'danger' : 'neutral'}
                  label={t('dashboard.overdue', 'Overdue')}
                  value={userStats.overdueBorrows}
                  sub={
                    userStats.overdueBorrows > 0
                      ? t('userDashboard.overdueHint', 'Return these to stop fines accruing.')
                      : t('userDashboard.allOnTime', 'Nothing late.')
                  }
                />
                <StatCard
                  icon="checkCircle"
                  tone="info"
                  label={t('userDashboard.returned', 'Returned')}
                  value={userStats.returnedBooks}
                />
                <StatCard
                  icon="coins"
                  tone={outstandingFines > 0 ? 'danger' : 'brand'}
                  label={t('userDashboard.outstandingFines')}
                  value={`${outstandingFines.toLocaleString()} F`}
                  sub={
                    outstandingFines > 0
                      ? t('userFines.payInPersonNote')
                      : t('userDashboard.noFines', 'Nothing owed.')
                  }
                />
              </div>
            )}

            {userStats.favoriteCategory && (
              <Card>
                <CardBody className="flex flex-wrap items-center gap-3 py-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('userDashboard.favoriteCategory', 'You read most in')}
                  </span>
                  <Tag tone="brand" icon="tag">{userStats.favoriteCategory}</Tag>
                </CardBody>
              </Card>
            )}

            <BorrowStatistics borrows={getFormattedBorrows()} />
          </div>
        );

      case Tab.MY_BOOKS:
        return (
          <div>
            <UserBorrows
              userId={user?.id || ""}
              borrows={getFormattedUserBorrows()}
              loading={borrowsLoading}
              error={borrowsError}
              refetch={refetch}
            />
          </div>
        );

      case Tab.MY_REQUESTS:
        return <UserActivity embedded />;

      case Tab.RESERVATIONS:
        return <UserReservations />;

      case Tab.MY_FINES:
        return <UserFines userId={user?.id || ""} />;

      case Tab.BROWSE_BOOKS:
        return <UserBookView embedded />;

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="app-shell page">
        <ErrorState
          title={t('userDashboard.signInRequired', 'You need to be signed in')}
          message={t(
            'userDashboard.signInHint',
            'Sign in to see your loans, reservations and fines.'
          )}
        />
      </div>
    );
  }

  const tabs: TabItem[] = [
    { id: Tab.DASHBOARD,    label: t('userDashboard.tabs.dashboard'),    icon: 'chart' },
    { id: Tab.MY_BOOKS,     label: t('userDashboard.tabs.myBooks'),      icon: 'books',    count: userStats.activeBorrows },
    { id: Tab.MY_REQUESTS,  label: t('userDashboard.tabs.myRequests'),   icon: 'history' },
    { id: Tab.RESERVATIONS, label: t('userDashboard.tabs.reservations'), icon: 'bookmark' },
    { id: Tab.MY_FINES,     label: t('userDashboard.tabs.myFines'),      icon: 'coins' },
    { id: Tab.BROWSE_BOOKS, label: t('userDashboard.tabs.browse'),       icon: 'search' },
  ];

  return (
    <div className="app-shell pb-10 pt-6 sm:pt-8">
      {/*
        A welcome band rather than a bare H1. The member dashboard is the first
        thing a student sees after signing in, and a line of text on grey gave
        the product no face at all. The shelf artwork is decorative and is
        masked out below `sm`, where the space belongs to the greeting.
      */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-emerald-800 px-5 py-6 text-white sm:mb-8 sm:px-8 sm:py-8 dark:bg-emerald-900">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-25 sm:block"
          aria-hidden="true"
        >
          <ShelfBand className="h-full w-full" />
        </div>

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
            {t('userDashboard.title')}
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('userDashboard.greeting', {
              name: user.firstName,
              defaultValue: `Welcome back, ${user.firstName}`,
            })}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-100/90">
            {userStats.overdueBorrows > 0
              ? t('userDashboard.greetingOverdue', {
                  count: userStats.overdueBorrows,
                  defaultValue: `You have ${userStats.overdueBorrows} book(s) past their due date.`,
                })
              : userStats.activeBorrows > 0
              ? t('userDashboard.greetingActive', {
                  count: userStats.activeBorrows,
                  defaultValue: `You have ${userStats.activeBorrows} book(s) on loan.`,
                })
              : t('userDashboard.greetingIdle', 'Nothing on loan — the catalogue is open.')}
          </p>

          <Link to="/books" className="mt-4 inline-block">
            <Button
              variant="secondary"
              icon="search"
              className="border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20 dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              {t('browseBooks.title')}
            </Button>
          </Link>
        </div>
      </div>

      <Tabs
        items={tabs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as Tab)}
        sticky
        className="mb-6 sm:mb-8"
      />

      <div key={activeTab} className="animate-fade-in">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default UserDashboard;
