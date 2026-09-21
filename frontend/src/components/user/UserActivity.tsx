import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fmtShort } from "../../utils/date";
import {
  BookCover,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  StackedMeta,
  StatusTag,
  Table,
  TableMessage,
  TableSkeleton,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  Tabs,
  TR,
} from "../ui";

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

// Types
type Borrow = {
  id: string;
  book: {
    id: string;
    title: string;
    isbn: string;
    coverImage: string | null;
    authors: {
      name: string;
    }[];
    categories: {
      name: string;
    }[];
  };
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: "BORROWED" | "RETURNED" | "OVERDUE";
};

interface UserActivityProps {
  /**
   * Rendered inside the member dashboard's own tab strip, which already
   * supplies a page heading. Standalone at `/activity` it supplies its own.
   */
  embedded?: boolean;
}

/** One row of the requests table. Both tabs share it; only the dates differ. */
const BorrowRow: React.FC<{ borrow: Borrow; showReturned: boolean }> = ({
  borrow,
  showReturned,
}) => (
  <TR>
    <TD className="max-w-[20rem]">
      <div className="flex items-center gap-3">
        <div className="hidden h-14 w-10 shrink-0 overflow-hidden rounded-md shadow-xs xs:block">
          <BookCover
            title={borrow.book.title}
            src={borrow.book.coverImage}
            size="sm"
            rounded="rounded-md"
          />
        </div>
        <div className="min-w-0">
          <p className="break-words font-medium text-gray-900 dark:text-white">
            {borrow.book.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
            {borrow.book.authors.map((a) => a.name).join(", ")}
          </p>
          <StackedMeta showBelow="sm">
            {showReturned
              ? `Returned ${fmtShort(borrow.returnedAt)}`
              : `Due ${fmtShort(borrow.dueDate)}`}
          </StackedMeta>
        </div>
      </div>
    </TD>

    <TD hideBelow="md" className="whitespace-nowrap">
      {fmtShort(borrow.borrowedAt)}
    </TD>

    <TD hideBelow="sm" className="whitespace-nowrap">
      {showReturned ? fmtShort(borrow.returnedAt) : fmtShort(borrow.dueDate)}
    </TD>

    <TD align="right">
      <StatusTag
        status={showReturned ? "RETURNED" : borrow.status}
        label={showReturned ? "Completed" : "On loan"}
      />
    </TD>
  </TR>
);

const UserActivity: React.FC<UserActivityProps> = ({ embedded = false }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  // Fetch user borrows
  const { loading, error, data, refetch } = useQuery(GET_USER_BORROWS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  const borrows: Borrow[] = data?.userBorrows || [];

  // Filter borrows based on status
  const pendingBorrows = borrows.filter(
    (borrow: Borrow) => borrow.status === "BORROWED" && !borrow.returnedAt
  );

  const historyBorrows = borrows.filter(
    (borrow: Borrow) => borrow.status === "RETURNED" || borrow.returnedAt
  );

  const rows = activeTab === "pending" ? pendingBorrows : historyBorrows;
  const showReturned = activeTab === "history";

  const body = (
    <Card>
      {/* Counts sit in the tab itself rather than as a separate figure — the
          number and the thing it counts belong together. */}
      <Tabs
        className="px-5 sm:px-6"
        items={[
          { id: "pending", label: "On loan", icon: "bookmark", count: pendingBorrows.length },
          { id: "history", label: "History", icon: "history", count: historyBorrows.length },
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
      />

      <TableWrap>
        <Table>
          <THead>
            <TR className="hover:bg-transparent dark:hover:bg-transparent">
              <TH>Book</TH>
              <TH hideBelow="md">Requested</TH>
              <TH hideBelow="sm">{showReturned ? "Returned" : "Due"}</TH>
              <TH align="right">Status</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TableMessage colSpan={4}>
                <TableSkeleton rows={4} cols={3} />
              </TableMessage>
            ) : error ? (
              <TableMessage colSpan={4}>
                <ErrorState message={error.message} onRetry={() => refetch()} />
              </TableMessage>
            ) : rows.length === 0 ? (
              <TableMessage colSpan={4}>
                <EmptyState
                  icon={showReturned ? "history" : "books"}
                  title={
                    showReturned ? "No past requests" : "Nothing on loan"
                  }
                  description={
                    showReturned
                      ? "Books you've borrowed and returned will be listed here."
                      : "You don't have any books out at the moment."
                  }
                  action={
                    !showReturned ? (
                      <Link to="/books">
                        <Button variant="primary" icon="books">
                          Browse the library
                        </Button>
                      </Link>
                    ) : undefined
                  }
                />
              </TableMessage>
            ) : (
              rows.map((borrow) => (
                <BorrowRow
                  key={borrow.id}
                  borrow={borrow}
                  showReturned={showReturned}
                />
              ))
            )}
          </TBody>
        </Table>
      </TableWrap>
    </Card>
  );

  if (embedded) return body;

  return (
    <div className="app-shell page">
      <PageHeader
        icon="history"
        eyebrow="My library"
        title="Book requests"
        description="Everything you have out on loan, and everything you've returned."
        actions={
          <Link to="/books">
            <Button variant="primary" icon="books">
              Browse the library
            </Button>
          </Link>
        }
      />
      {body}
    </div>
  );
};

export default UserActivity;
