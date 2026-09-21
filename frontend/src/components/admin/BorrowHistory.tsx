import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import Pagination from '../common/Pagination';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Segmented,
  StatusTag,
  StackedMeta,
  Table,
  TableMessage,
  TableSkeleton,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '../ui';
import { fmtDate } from '../../utils/date';

const PAGE_SIZE = 25;

// GraphQL queries
const GET_BORROWS = gql`
  query GetAllBorrows($status: BorrowStatus, $skip: Int, $take: Int) {
    borrowsCount(status: $status)
    borrows(status: $status, skip: $skip, take: $take) {
      id
      user {
        id
        firstName
        lastName
        email
      }
      book {
        id
        title
        isbn
        authors {
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

// Fallback query without status filter
const GET_ALL_BORROWS = gql`
  query GetAllBorrowsNoFilter {
    borrows {
      id
      user {
        id
        firstName
        lastName
        email
      }
      book {
        id
        title
        isbn
        authors {
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

type Borrow = {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  book: {
    id: string;
    title: string;
    isbn: string;
    authors: {
      name: string;
    }[];
  };
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
};

const BorrowHistory: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'returned' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [useFallbackQuery, setUseFallbackQuery] = useState(false);
  const [page, setPage] = useState(0);

  // Get borrows based on status filter
  const status = filter === 'returned' ? 'RETURNED' :
                filter === 'active' ? 'BORROWED' : undefined;

  // Fetch borrow history with status filter
  const {
    loading: primaryLoading,
    error: primaryError,
    data: primaryData,
    refetch: primaryRefetch
  } = useQuery(GET_BORROWS, {
    variables: { status, skip: page * PAGE_SIZE, take: PAGE_SIZE },
    fetchPolicy: 'network-only',
    skip: useFallbackQuery
  });

  // Fallback query without status filter
  const { 
    loading: fallbackLoading, 
    error: fallbackError, 
    data: fallbackData,
    refetch: fallbackRefetch
  } = useQuery(GET_ALL_BORROWS, {
    fetchPolicy: 'network-only',
    skip: !useFallbackQuery
  });

  // Determine loading, error and data states
  const loading = useFallbackQuery ? fallbackLoading : primaryLoading;
  const error = useFallbackQuery ? fallbackError : primaryError;
  const data = useFallbackQuery ? fallbackData : primaryData;
  
  // Update borrows state when data changes
  useEffect(() => {
    if (data && data.borrows) {
      let filteredData = [...data.borrows];
      
      // If using fallback query, filter the data based on the selected filter
      if (useFallbackQuery && status) {
        filteredData = data.borrows.filter((borrow: Borrow) => borrow.status === status);
      }
      
      setBorrows(filteredData);
    }
  }, [data, useFallbackQuery, status]);
  
  const formatDate = fmtDate;
  
  // Filter borrows based on search term
  const getFilteredBorrows = () => {
    if (!borrows) return [];
    
    return borrows.filter((borrow: Borrow) => {
      const matchesSearch = searchTerm === '' || 
        borrow.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const filteredBorrows = getFilteredBorrows();
  
  const renderContent = () => {
    try {
      if (loading || fallbackLoading) {
        return (
          <TableWrap>
            <Table>
              <TBody>
                <TableMessage colSpan={6}>
                  <TableSkeleton rows={8} cols={5} />
                </TableMessage>
              </TBody>
            </Table>
          </TableWrap>
        );
      }

      if (error || fallbackError) {
        const currentError = error || fallbackError;
        return (
          <ErrorState
            title="Could not load borrow history"
            message={currentError?.message || "Failed to load borrow history."}
            onRetry={() => (useFallbackQuery ? fallbackRefetch() : primaryRefetch())}
          />
        );
      }

      const filteredBorrows = getFilteredBorrows();

      if (filteredBorrows.length === 0) {
        return (
          <EmptyState
            icon="history"
            title="No borrow records"
            description={
              searchTerm
                ? `Nothing matches "${searchTerm}". Try a member's name or a title.`
                : filter !== 'all'
                ? `No ${filter === 'active' ? 'active' : 'returned'} borrows in this period.`
                : 'Borrowing activity will appear here once books start circulating.'
            }
            action={
              searchTerm ? (
                <Button variant="secondary" icon="close" onClick={() => setSearchTerm('')}>
                  Clear search
                </Button>
              ) : filter !== 'all' ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFilter('all');
                    setPage(0);
                  }}
                >
                  Show all borrows
                </Button>
              ) : undefined
            }
          />
        );
      }

      return (
        <TableWrap>
          <Table>
            <THead>
              <TR className="hover:bg-transparent dark:hover:bg-transparent">
                <TH>Book</TH>
                <TH hideBelow="md">Member</TH>
                <TH hideBelow="lg">Borrowed</TH>
                <TH hideBelow="sm">Due</TH>
                <TH hideBelow="lg">Returned</TH>
                <TH align="right">Status</TH>
              </TR>
            </THead>
            <TBody>
              {filteredBorrows.map((borrow: Borrow) => (
                <TR key={borrow.id}>
                  <TD className="max-w-[20rem]">
                    <p className="break-words font-medium text-gray-900 dark:text-white">
                      {borrow.book.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                      {borrow.book.authors.map((author) => author.name).join(', ')}
                    </p>
                    <StackedMeta showBelow="md">
                      {borrow.user.firstName} {borrow.user.lastName}
                    </StackedMeta>
                    <StackedMeta showBelow="sm" label="Due">
                      {formatDate(borrow.dueDate)}
                    </StackedMeta>
                  </TD>

                  <TD hideBelow="md" className="max-w-[14rem]">
                    <p className="truncate font-medium text-gray-800 dark:text-gray-100">
                      {borrow.user.firstName} {borrow.user.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {borrow.user.email}
                    </p>
                  </TD>

                  <TD hideBelow="lg" className="whitespace-nowrap">
                    {formatDate(borrow.borrowedAt)}
                  </TD>

                  <TD hideBelow="sm" className="whitespace-nowrap">
                    {formatDate(borrow.dueDate)}
                  </TD>

                  <TD hideBelow="lg" className="whitespace-nowrap">
                    {/* An em-dash rather than an empty cell: a blank reads as a
                        rendering fault, a dash reads as "not yet returned". */}
                    {borrow.returnedAt ? formatDate(borrow.returnedAt) : (
                      <span className="text-gray-400" aria-label="Not returned">—</span>
                    )}
                  </TD>

                  <TD align="right">
                    <StatusTag
                      status={borrow.status}
                      label={
                        borrow.status === 'RETURNED'
                          ? 'Returned'
                          : borrow.status === 'OVERDUE'
                          ? 'Overdue'
                          : 'On loan'
                      }
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      );
    } catch (err) {
      console.error('Unexpected error in renderContent:', err);
      return (
        <ErrorState
          title="Unexpected error"
          message="Something went wrong while displaying borrow history."
          onRetry={() => window.location.reload()}
          retryLabel="Reload"
        />
      );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon="history"
        eyebrow="Circulation"
        title="Borrow history"
        description="Every loan the library has issued, past and present."
      />

      <Card>
        <CardHeader
          title="Records"
          description={`${(primaryData?.borrowsCount ?? filteredBorrows.length).toLocaleString()} records`}
          actions={
            <>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
                placeholder="Search books or members"
                wrapperClassName="sm:w-64"
              />
              <Segmented
                value={filter}
                onChange={(v) => {
                  setFilter(v as typeof filter);
                  setPage(0);
                }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'returned', label: 'Returned' },
                ]}
              />
            </>
          }
        />

        {renderContent()}

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={primaryData?.borrowsCount ?? 0}
          onPage={(p) => setPage(p)}
        />
      </Card>
    </div>
  );
};

export default BorrowHistory;