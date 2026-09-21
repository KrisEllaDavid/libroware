import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import Modal from "../Modal";
import { SEARCH_MEMBERS, GET_BOOKS } from "../../graphql/queries";
import { CREATE_BORROW, APPROVE_BORROW, REJECT_BORROW } from "../../graphql/mutations";
import { useToast } from "../../context/ToastContext";
import { fmtDate, isPast, daysPast } from "../../utils/date";
import {
  BookCover,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Segmented,
  Skeleton,
  Tag,
  Table,
  TableMessage,
  TableSkeleton,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  Textarea,
  TR,
  RowActions,
  StackedMeta,
  cn,
} from "../ui";

// ── Approval requests ──────────────────────────────────────────────────────────
const GET_APPROVAL_REQUESTS = gql`
  query GetApprovalRequests {
    borrows(status: PENDING_APPROVAL) {
      id
      borrowedAt
      dueDate
      note
      status
      user { id firstName lastName email }
      book { id title isbn authors { name } coverImage }
    }
  }
`;

// ── Active borrows ─────────────────────────────────────────────────────────────
const GET_ACTIVE_BORROWS = gql`
  query GetActiveBorrows {
    borrows(status: BORROWED) {
      id
      user { id firstName lastName email }
      book { id title isbn authors { name } }
      borrowedAt
      dueDate
      status
    }
  }
`;

const GET_ALL_BORROWS = gql`
  query GetAllBorrows {
    borrows {
      id
      user { id firstName lastName email }
      book { id title isbn authors { name } }
      borrowedAt
      dueDate
      status
    }
  }
`;

const UPDATE_BORROW = gql`
  mutation UpdateBorrow($id: ID!, $input: BorrowUpdateInput!) {
    updateBorrow(id: $id, input: $input) { id status returnedAt }
  }
`;

const RETURN_BOOK = gql`
  mutation ReturnBook($id: ID!) {
    returnBook(id: $id) { id status returnedAt }
  }
`;

const EXTEND_GRACE_DAYS = [3, 7, 14];

type ApprovalBorrow = {
  id: string;
  borrowedAt: string;
  dueDate: string;
  note: string | null;
  status: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  book: { id: string; title: string; isbn: string; authors: { name: string }[]; coverImage: string | null };
};

type ActiveBorrow = {
  id: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  book: { id: string; title: string; isbn: string; authors: { name: string }[] };
  borrowedAt: string;
  dueDate: string;
  status: "BORROWED" | "RETURNED" | "OVERDUE";
};

// ── Approval section ──────────────────────────────────────────────────────────
const ApprovalSection: React.FC<{ onRefetchActive: () => void }> = ({ onRefetchActive }) => {
  const { addToast } = useToast();
  const [rejectTarget, setRejectTarget] = useState<ApprovalBorrow | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, loading, refetch } = useQuery(GET_APPROVAL_REQUESTS, {
    fetchPolicy: 'network-only',
    pollInterval: 15000,
  });

  const [approveBorrow, { loading: approveLoading }] = useMutation(APPROVE_BORROW, {
    onCompleted: (d) => {
      addToast(`"${d.approveBorrow.book.title}" approved for ${d.approveBorrow.user.firstName} ${d.approveBorrow.user.lastName}`, 'success');
      refetch();
      onRefetchActive();
    },
    onError: (e) => addToast(e.message, 'error'),
  });

  const [rejectBorrow, { loading: rejectLoading }] = useMutation(REJECT_BORROW, {
    onCompleted: () => {
      addToast('Request rejected', 'info');
      setRejectTarget(null);
      setRejectReason('');
      refetch();
      onRefetchActive();
    },
    onError: (e) => addToast(e.message, 'error'),
  });

  const formatDate = fmtDate;

  const requests: ApprovalBorrow[] = data?.borrows || [];

  if (loading && requests.length === 0) {
    return (
      <Card>
        <div className="space-y-3 p-5 sm:p-6">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  if (requests.length === 0) return null;

  return (
    <>
      {/*
        The approval queue is work waiting on a librarian, so it leads the page
        and carries an amber left edge — the only element on the screen that
        does, which is what makes it read as "handle me first" without needing
        a banner.
      */}
      <Card className="overflow-hidden border-l-4 border-l-amber-500">
        <CardHeader
          title="Awaiting approval"
          description={`${requests.length} request${requests.length === 1 ? "" : "s"} from members`}
        />

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {requests.map((req) => (
            <div key={req.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md shadow-xs">
                <BookCover title={req.book.title} src={req.book.coverImage} size="sm" rounded="rounded-md" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                  {req.book.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                  {req.book.authors.map((a) => a.name).join(', ')}
                </p>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {req.user.firstName} {req.user.lastName}
                  </span>{' '}
                  · {req.user.email}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  Requested {formatDate(req.borrowedAt)} · due {formatDate(req.dueDate)}
                </p>
                {req.note && (
                  /* The member's own words, set apart by a rule rather than
                     italics so a long note stays readable. */
                  <p className="mt-2 border-l-2 border-gray-200 pl-2.5 text-xs leading-relaxed text-gray-500 dark:border-gray-700 dark:text-gray-400 line-clamp-3">
                    {req.note}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon="check"
                  onClick={() => approveBorrow({ variables: { id: req.id } })}
                  disabled={approveLoading}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  icon="close"
                  onClick={() => { setRejectTarget(req); setRejectReason(''); }}
                  disabled={approveLoading}
                  className="text-red-600 hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={!!rejectTarget}
        title="Reject Borrow Request"
        confirmText={rejectLoading ? 'Rejecting…' : 'Reject Request'}
        cancelText="Cancel"
        onConfirm={() => {
          if (!rejectTarget) return;
          rejectBorrow({ variables: { id: rejectTarget.id, reason: rejectReason.trim() || undefined } });
        }}
        onCancel={() => { setRejectTarget(null); setRejectReason(''); }}
        type="warning"
        showToast={false}
      >
        {rejectTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Reject the request for{' '}
              <span className="font-medium text-gray-900 dark:text-white">"{rejectTarget.book.title}"</span>{' '}
              by{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {rejectTarget.user.firstName} {rejectTarget.user.lastName}
              </span>
              ? The book will be made available again.
            </p>
            <Textarea
              label="Reason"
              hint="Optional. The member sees this on their request."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Reserved for another member, account on hold"
            />
          </div>
        )}
      </Modal>
    </>
  );
};

// ── Active borrows section ─────────────────────────────────────────────────────
const PendingRequests: React.FC = () => {
  const [selectedBorrow, setSelectedBorrow] = useState<ActiveBorrow | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendDays, setExtendDays] = useState<number>(EXTEND_GRACE_DAYS[0]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<{ id: string; firstName: string; lastName: string; email: string; overdueBorrowCount: number; outstandingFines: number } | null>(null);
  const [bookSearch, setBookSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<{ id: string; title: string; available: number } | null>(null);
  const [checkoutDays, setCheckoutDays] = useState<number>(14);
  const [searchTerm, setSearchTerm] = useState("");
  const [borrows, setBorrows] = useState<ActiveBorrow[]>([]);
  const [useFallbackQuery, setUseFallbackQuery] = useState(false);
  const { addToast } = useToast();

  // Primary: only BORROWED status
  const {
    loading: primaryLoading,
    error: primaryError,
    data: primaryData,
    refetch: primaryRefetch,
  } = useQuery(GET_ACTIVE_BORROWS, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
    skip: useFallbackQuery,
  });

  // Fallback: all borrows
  const {
    loading: fallbackLoading,
    error: fallbackError,
    data: fallbackData,
    refetch: fallbackRefetch,
  } = useQuery(GET_ALL_BORROWS, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
    skip: !useFallbackQuery,
  });

  useEffect(() => {
    if (primaryError && !useFallbackQuery) {
      setUseFallbackQuery(true);
    }
  }, [primaryError, useFallbackQuery]);

  const loading = useFallbackQuery ? fallbackLoading : primaryLoading;
  const error = useFallbackQuery ? fallbackError : primaryError;
  const data = useFallbackQuery ? fallbackData : primaryData;
  const refetch = useFallbackQuery ? fallbackRefetch : primaryRefetch;

  useEffect(() => {
    if (data?.borrows) {
      const filtered = useFallbackQuery
        ? data.borrows.filter((b: ActiveBorrow) => b.status === "BORROWED" || b.status === "OVERDUE")
        : data.borrows;
      setBorrows(filtered);
    }
  }, [data, useFallbackQuery]);

  const [returnBook, { loading: returnLoading }] = useMutation(RETURN_BOOK, {
    onCompleted: () => {
      setIsReturnModalOpen(false);
      setSelectedBorrow(null);
      refetch();
    },
    onError: (e) => addToast(e.message, 'error'),
  });

  const { data: memberResults } = useQuery(SEARCH_MEMBERS, {
    variables: { search: memberSearch, take: 8 },
    skip: memberSearch.trim().length < 2,
    fetchPolicy: "network-only",
  });

  const { data: bookResults } = useQuery(GET_BOOKS, {
    variables: { searchTitle: bookSearch, take: 8 },
    skip: bookSearch.trim().length < 2,
    fetchPolicy: "network-only",
  });

  const [createBorrow, { loading: checkoutLoading }] = useMutation(CREATE_BORROW, {
    onCompleted: (d) => {
      addToast(`"${d.createBorrow.book.title}" checked out successfully`, "success");
      resetCheckout();
      refetch();
    },
    onError: (e) => addToast(`Failed to check out book: ${e.message}`, "error"),
  });

  const [extendBorrow, { loading: extendLoading }] = useMutation(UPDATE_BORROW, {
    onCompleted: () => {
      addToast("Due date extended", "success");
      setIsExtendModalOpen(false);
      setSelectedBorrow(null);
      refetch();
    },
    onError: (e) => addToast(`Failed to extend due date: ${e.message}`, "error"),
  });

  const handleReturn = (borrow: ActiveBorrow) => { setSelectedBorrow(borrow); setIsReturnModalOpen(true); };
  const confirmReturn = () => { if (selectedBorrow) returnBook({ variables: { id: selectedBorrow.id } }); };

  const handleExtend = (borrow: ActiveBorrow) => { setSelectedBorrow(borrow); setExtendDays(EXTEND_GRACE_DAYS[0]); setIsExtendModalOpen(true); };
  const confirmExtend = () => {
    if (!selectedBorrow) return;
    const base = isOverdue(selectedBorrow.dueDate) ? new Date() : new Date(selectedBorrow.dueDate);
    const newDueDate = new Date(base);
    newDueDate.setDate(newDueDate.getDate() + extendDays);
    extendBorrow({ variables: { id: selectedBorrow.id, input: { dueDate: newDueDate.toISOString() } } });
  };

  const resetCheckout = () => {
    setIsCheckoutModalOpen(false);
    setMemberSearch(""); setSelectedMember(null);
    setBookSearch(""); setSelectedBook(null);
    setCheckoutDays(14);
  };

  const confirmCheckout = () => {
    if (!selectedMember || !selectedBook) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + checkoutDays);
    createBorrow({ variables: { input: { userId: selectedMember.id, bookId: selectedBook.id, dueDate: dueDate.toISOString() } } });
  };

  const formatDate = fmtDate;
  const isOverdue = isPast;
  const daysOverdue = daysPast;

  const filteredBorrows = (borrows || [])
    .filter((b) =>
      searchTerm === '' ||
      b.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aDays = daysOverdue(a.dueDate);
      const bDays = daysOverdue(b.dueDate);
      if (aDays !== bDays) return bDays - aDays;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const renderContent = () => {
    if (error) {
      return (
        <ErrorState
          title="Could not load active borrows"
          message={error.message}
          onRetry={() => {
            if (!useFallbackQuery) setUseFallbackQuery(true);
            else refetch();
          }}
        />
      );
    }

    if (loading) {
      return (
        <TableWrap>
          <Table>
            <TBody>
              <TableMessage colSpan={6}>
                <TableSkeleton rows={6} cols={4} />
              </TableMessage>
            </TBody>
          </Table>
        </TableWrap>
      );
    }

    if (filteredBorrows.length === 0) {
      return (
        <EmptyState
          icon="checkCircle"
          title={searchTerm ? "No matching borrows" : "Nothing is out on loan"}
          description={
            searchTerm
              ? `Nothing matches "${searchTerm}".`
              : "Every copy is back on the shelf."
          }
          action={
            searchTerm ? (
              <Button variant="secondary" icon="close" onClick={() => setSearchTerm("")}>
                Clear search
              </Button>
            ) : (
              <Button variant="primary" icon="arrowRight" onClick={() => setIsCheckoutModalOpen(true)}>
                Check out a book
              </Button>
            )
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
              <TH hideBelow="sm">Status</TH>
              <TH align="right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filteredBorrows.map((borrow) => {
              const late = isOverdue(borrow.dueDate);
              const lateBy = daysOverdue(borrow.dueDate);
              return (
                <TR key={borrow.id}>
                  <TD className="max-w-[20rem]">
                    <p className="break-words font-medium text-gray-900 dark:text-white">
                      {borrow.book.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                      {borrow.book.authors.map((a) => a.name).join(", ")}
                    </p>
                    <StackedMeta showBelow="md">
                      {borrow.user.firstName} {borrow.user.lastName}
                    </StackedMeta>
                    <StackedMeta showBelow="sm" label="Due">
                      {formatDate(borrow.dueDate)}
                      {late && ` — ${lateBy}d overdue`}
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

                  <TD hideBelow="lg" className="whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {formatDate(borrow.borrowedAt)}
                  </TD>

                  <TD hideBelow="sm" className="whitespace-nowrap">
                    <span
                      className={cn(
                        late
                          ? "font-medium text-red-600 dark:text-red-400"
                          : "text-gray-600 dark:text-gray-300"
                      )}
                    >
                      {formatDate(borrow.dueDate)}
                    </span>
                    {late && (
                      <p className="mt-0.5 text-2xs text-red-500">{lateBy} days late</p>
                    )}
                  </TD>

                  <TD hideBelow="sm">
                    <Tag tone={late ? "danger" : "brand"} dot>
                      {late ? "Overdue" : "On loan"}
                    </Tag>
                  </TD>

                  <TD align="right">
                    <RowActions className="gap-2">
                      <Button size="sm" icon="calendar" onClick={() => handleExtend(borrow)}>
                        Extend
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        icon="check"
                        onClick={() => handleReturn(borrow)}
                        disabled={returnLoading}
                      >
                        Return
                      </Button>
                    </RowActions>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </TableWrap>
    );
  };

  const overdueCount = filteredBorrows.filter((b) => isOverdue(b.dueDate)).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon="inbox"
        eyebrow="Circulation"
        title="Borrowing"
        description="Requests waiting on approval, and everything currently out on loan."
        actions={
          <Button variant="primary" icon="arrowRight" onClick={() => setIsCheckoutModalOpen(true)}>
            Check out a book
          </Button>
        }
      />

      <ApprovalSection onRefetchActive={() => refetch()} />

      <Card>
        <CardHeader
          title="Active borrows"
          description={
            overdueCount > 0
              ? `${filteredBorrows.length} on loan · ${overdueCount} overdue`
              : `${filteredBorrows.length} on loan`
          }
          actions={
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
              placeholder="Search books or members"
              wrapperClassName="sm:w-72"
            />
          }
        />
        {renderContent()}
      </Card>

      {/* Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        title="Return Book"
        message={`Are you sure you want to mark "${selectedBorrow?.book.title}" as returned by ${selectedBorrow?.user.firstName} ${selectedBorrow?.user.lastName}?`}
        confirmText={returnLoading ? "Processing..." : "Return Book"}
        cancelText="Cancel"
        onConfirm={confirmReturn}
        onCancel={() => setIsReturnModalOpen(false)}
        type="warning"
      />

      {/* Extend Due Date Modal */}
      <Modal
        isOpen={isExtendModalOpen}
        title="Extend Due Date"
        confirmText={extendLoading ? "Saving..." : "Extend"}
        cancelText="Cancel"
        onConfirm={confirmExtend}
        onCancel={() => setIsExtendModalOpen(false)}
        type="form"
        showToast={false}
      >
        {selectedBorrow && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Extend <span className="font-medium">{selectedBorrow.book.title}</span> for{" "}
              <span className="font-medium">{selectedBorrow.user.firstName} {selectedBorrow.user.lastName}</span>
              {" "}— currently due {formatDate(selectedBorrow.dueDate)}
              {isOverdue(selectedBorrow.dueDate) && ` (${daysOverdue(selectedBorrow.dueDate)}d overdue)`}.
            </p>
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300">
                Extend by
              </p>
              <Segmented
                value={String(extendDays)}
                onChange={(v) => setExtendDays(Number(v))}
                options={EXTEND_GRACE_DAYS.map((d) => ({ value: String(d), label: `+${d} days` }))}
              />
            </div>
            <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
              New due date:{" "}
              {formatDate((() => {
                const base = isOverdue(selectedBorrow.dueDate) ? new Date() : new Date(selectedBorrow.dueDate);
                const d = new Date(base);
                d.setDate(d.getDate() + extendDays);
                return d.toISOString();
              })())}
            </p>
          </div>
        )}
      </Modal>

      {/* Front-desk Checkout Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        title="Check Out Book"
        confirmText={checkoutLoading ? "Checking out..." : "Check Out"}
        cancelText="Cancel"
        onConfirm={confirmCheckout}
        onCancel={resetCheckout}
        type="form"
        showToast={false}
        size="lg"
      >
        <div className="space-y-5">
          {/* Step 1 — member. A chosen member collapses to a summary card so
              the modal reads as a filled-in form, not two live search boxes. */}
          <div>
            <p className="mb-1.5 text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300">
              Member
            </p>
            {selectedMember ? (
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 dark:border-gray-700 dark:bg-gray-800/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-gray-900 dark:text-white">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </p>
                  <p className="break-all text-xs text-gray-500 dark:text-gray-400">
                    {selectedMember.email}
                  </p>
                  {(selectedMember.overdueBorrowCount > 0 || selectedMember.outstandingFines > 0) && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedMember.overdueBorrowCount > 0 && (
                        <Tag tone="danger" size="sm" icon="clock">
                          {selectedMember.overdueBorrowCount} overdue
                        </Tag>
                      )}
                      {selectedMember.outstandingFines > 0 && (
                        <Tag tone="warning" size="sm" icon="coins">
                          {selectedMember.outstandingFines.toLocaleString()} FCFA owed
                        </Tag>
                      )}
                    </div>
                  )}
                </div>
                <Button size="sm" onClick={() => setSelectedMember(null)} className="shrink-0 self-start sm:self-auto">
                  Change
                </Button>
              </div>
            ) : (
              <>
                <SearchInput
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  onClear={() => setMemberSearch("")}
                  placeholder="Search by name or email"
                />
                {memberResults?.users?.length > 0 && (
                  <ul className="mt-2 max-h-44 divide-y divide-gray-100 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
                    {memberResults.users.map((u: any) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedMember(u)}
                          className="w-full px-3.5 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <span className="block text-sm text-gray-900 dark:text-white">
                            {u.firstName} {u.lastName}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {u.email}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* Step 2 — title */}
          <div>
            <p className="mb-1.5 text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300">
              Book
            </p>
            {selectedBook ? (
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 dark:border-gray-700 dark:bg-gray-800/60 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 break-words text-sm font-medium text-gray-900 dark:text-white">
                  {selectedBook.title}
                </p>
                <Button size="sm" onClick={() => setSelectedBook(null)} className="shrink-0 self-start sm:self-auto">
                  Change
                </Button>
              </div>
            ) : (
              <>
                <SearchInput
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  onClear={() => setBookSearch("")}
                  placeholder="Search by title"
                />
                {bookResults?.books?.length > 0 && (
                  <ul className="mt-2 max-h-44 divide-y divide-gray-100 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
                    {bookResults.books.map((b: any) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          disabled={b.available <= 0}
                          onClick={() => setSelectedBook(b)}
                          className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
                        >
                          <span className="min-w-0 truncate text-sm text-gray-900 dark:text-white">
                            {b.title}
                          </span>
                          <Tag tone={b.available > 0 ? "neutral" : "danger"} size="sm">
                            {b.available > 0 ? `${b.available} free` : "None free"}
                          </Tag>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* Step 3 — loan period */}
          <div>
            <p className="mb-1.5 text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300">
              Loan period
            </p>
            <Segmented
              value={String(checkoutDays)}
              onChange={(v) => setCheckoutDays(Number(v))}
              options={[7, 14, 21, 30].map((d) => ({ value: String(d), label: `${d} days` }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingRequests;
