import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import Modal from "../Modal";
import { SEARCH_MEMBERS, GET_BOOKS } from "../../graphql/queries";
import { CREATE_BORROW, APPROVE_BORROW, REJECT_BORROW } from "../../graphql/mutations";
import { useToast } from "../../context/ToastContext";
import { fmtDate, isPast, daysPast } from "../../utils/date";

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
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 sm:rounded-md p-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-r-transparent" />
        Loading approval requests…
      </div>
    );
  }

  if (requests.length === 0) return null;

  return (
    <>
      <div className="bg-white shadow dark:bg-gray-800 dark:border dark:border-gray-700 sm:rounded-md">
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-sm flex-shrink-0">
            {requests.length}
          </span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Awaiting Approval
          </h3>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {requests.map((req) => (
            <div key={req.id} className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Book cover */}
              <div className="flex-shrink-0">
                {req.book.coverImage ? (
                  <img src={req.book.coverImage} alt={req.book.title}
                    className="h-16 w-12 object-cover rounded shadow" />
                ) : (
                  <div className="h-16 w-12 rounded shadow bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{req.book.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{req.book.authors.map((a) => a.name).join(', ')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {req.user.firstName} {req.user.lastName}
                  </span>{' '}
                  · {req.user.email}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Requested {formatDate(req.borrowedAt)} · due {formatDate(req.dueDate)}
                </p>
                {req.note && (
                  <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400 line-clamp-2">"{req.note}"</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => approveBorrow({ variables: { id: req.id } })}
                  disabled={approveLoading}
                  className="px-4 py-1.5 text-sm font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => { setRejectTarget(req); setRejectReason(''); }}
                  disabled={approveLoading}
                  className="px-4 py-1.5 text-sm font-medium rounded-md border border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Book reserved for another patron, account issues…"
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
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
        <div className="p-6 text-center">
          <div className="text-red-500 mb-2">Error loading pending requests:</div>
          <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded text-red-700 dark:text-red-300 overflow-auto max-h-40">
            {error.message}
          </pre>
          <button
            onClick={() => { if (!useFallbackQuery) setUseFallbackQuery(true); else refetch(); }}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading active borrows…</p>
        </div>
      );
    }

    if (filteredBorrows.length === 0) {
      return (
        <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {searchTerm ? "No borrows match your search." : "No active borrows."}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {["Book", "User", "Borrowed Date", "Due Date", "Status", "Actions"].map((h, i) => (
                <th key={h} scope="col"
                  className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {filteredBorrows.map((borrow) => (
              <tr key={borrow.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-4 whitespace-normal">
                  <div className="text-sm font-medium text-gray-900 dark:text-white break-words">{borrow.book.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">ISBN: {borrow.book.isbn}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 break-words">{borrow.book.authors.map((a) => a.name).join(', ')}</div>
                </td>
                <td className="px-4 py-4 whitespace-normal">
                  <div className="text-sm font-medium text-gray-900 dark:text-white break-words">{borrow.user.firstName} {borrow.user.lastName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{borrow.user.email}</div>
                </td>
                <td className="px-4 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400">{formatDate(borrow.borrowedAt)}</td>
                <td className="px-4 py-4 whitespace-normal">
                  <span className={`text-sm ${isOverdue(borrow.dueDate) ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                    {formatDate(borrow.dueDate)}
                    {isOverdue(borrow.dueDate) && ` (${daysOverdue(borrow.dueDate)}d overdue)`}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-normal">
                  <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    isOverdue(borrow.dueDate)
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}>
                    {isOverdue(borrow.dueDate) ? "Overdue" : "Borrowed"}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => handleExtend(borrow)}
                    className="px-3 py-1 rounded-md text-emerald-700 dark:text-emerald-400 border border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                    Extend
                  </button>
                  <button onClick={() => handleReturn(borrow)} disabled={returnLoading}
                    className="px-3 py-1 rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Return
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Awaiting Approval ── */}
      <ApprovalSection onRefetchActive={() => refetch()} />

      {/* ── Active Borrows ── */}
      <div className="bg-white shadow dark:bg-gray-800 dark:border dark:border-gray-700 sm:rounded-md">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Active Borrows
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search books or users..."
                className="input w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsCheckoutModalOpen(true)}
              className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              Check Out Book
            </button>
          </div>
        </div>
        {renderContent()}
      </div>

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
            <div className="flex gap-2">
              {EXTEND_GRACE_DAYS.map((d) => (
                <button key={d} type="button" onClick={() => setExtendDays(d)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    extendDays === d
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}>
                  +{d} days
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Member</label>
            {selectedMember ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white break-words">{selectedMember.firstName} {selectedMember.lastName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 break-all">{selectedMember.email}</div>
                  {(selectedMember.overdueBorrowCount > 0 || selectedMember.outstandingFines > 0) && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                      {selectedMember.overdueBorrowCount > 0 && `${selectedMember.overdueBorrowCount} overdue book(s)`}
                      {selectedMember.overdueBorrowCount > 0 && selectedMember.outstandingFines > 0 && " · "}
                      {selectedMember.outstandingFines > 0 && `${selectedMember.outstandingFines.toLocaleString()} FCFA owed`}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => setSelectedMember(null)}
                  className="flex-shrink-0 self-start sm:self-auto text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  Change
                </button>
              </div>
            ) : (
              <>
                <input type="text" placeholder="Search by name or email…" value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {memberResults?.users?.length > 0 && (
                  <ul className="mt-1 border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-100 dark:divide-gray-700 max-h-40 overflow-y-auto">
                    {memberResults.users.map((u: any) => (
                      <li key={u.id}>
                        <button type="button" onClick={() => setSelectedMember(u)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div className="text-gray-900 dark:text-white">{u.firstName} {u.lastName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Book</label>
            {selectedBook ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-white break-words min-w-0">{selectedBook.title}</div>
                <button type="button" onClick={() => setSelectedBook(null)}
                  className="flex-shrink-0 self-start sm:self-auto text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  Change
                </button>
              </div>
            ) : (
              <>
                <input type="text" placeholder="Search by title…" value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {bookResults?.books?.length > 0 && (
                  <ul className="mt-1 border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-100 dark:divide-gray-700 max-h-40 overflow-y-auto">
                    {bookResults.books.map((b: any) => (
                      <li key={b.id}>
                        <button type="button" disabled={b.available <= 0} onClick={() => setSelectedBook(b)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex justify-between">
                          <span className="text-gray-900 dark:text-white">{b.title}</span>
                          <span className={`text-xs ${b.available > 0 ? "text-gray-400" : "text-red-500"}`}>
                            {b.available > 0 ? `${b.available} available` : "unavailable"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan period</label>
            <div className="flex gap-2">
              {[7, 14, 21, 30].map((d) => (
                <button key={d} type="button" onClick={() => setCheckoutDays(d)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    checkoutDays === d
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}>
                  {d} days
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingRequests;
