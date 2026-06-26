import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { GET_USERS } from '../../graphql/queries';
import { CREATE_USER, UPDATE_USER, DELETE_USER } from '../../graphql/mutations';
import Modal from '../Modal';
import FloatingInput from '../FloatingInput';
import FloatingDropdown from '../FloatingDropdown';
import DeleteConfirmation from '../DeleteConfirmation';
import FileUpload from '../common/FileUpload';
import { User, Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Pagination from '../common/Pagination';

interface UserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  profilePicture?: string;
  requiresPasswordChange?: boolean;
}

const initialFormData: UserFormData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'USER',
  profilePicture: '',
  requiresPasswordChange: true,
};

const PAGE_SIZE = 25;

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const { toasts, addToast } = useToast();

  // GraphQL queries and mutations
  const { loading, error: queryError, data, refetch } = useQuery(GET_USERS, {
    variables: { skip: page * PAGE_SIZE, take: PAGE_SIZE },
    fetchPolicy: 'network-only', // Always fetch fresh data
  });

  const [createUser, { loading: createLoading }] = useMutation(CREATE_USER, {
    onCompleted: (data: { createUser: User }) => {
      resetForm();
      setIsFormModalOpen(false);
      
      // Refetch and update UI
      refetch().then((result: { data?: { users: User[] } }) => {
        if (result.data && result.data.users) {
          setAllUsers(result.data.users);
          setUsers(result.data.users);
        
        }
      });
    },
    onError: (error: any) => {
      console.error("Create user error:", error);
      setError(error.message);
      addToast(t('users.createFailed', { message: error.message }), 'error');
    },
  });

  const [updateUser, { loading: updateLoading }] = useMutation(UPDATE_USER, {
    onCompleted: (data: { updateUser: User }) => {
      resetForm();
      setIsFormModalOpen(false);
      
      // Refetch and update UI
      refetch().then((result: { data?: { users: User[] } }) => {
        if (result.data && result.data.users) {
          setAllUsers(result.data.users);
          setUsers(result.data.users);
                }
      });
    },
    onError: (error: any) => {
      console.error("Update user error:", error);
      setError(error.message);
      addToast(t('users.updateFailed', { message: error.message }), 'error');
    },
  });

  const [deleteUser, { loading: deleteLoading }] = useMutation(DELETE_USER, {
    onCompleted: (data) => {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);

      if (userToDelete) {
        const filteredUsers = allUsers.filter(user => user.id !== userToDelete);
        setAllUsers(filteredUsers);
        setUsers(filteredUsers);
      }

      refetch()
        .then(({ data }) => {
          if (data && data.users) {
            setAllUsers(data.users);
            if (searchTerm.trim() === '') {
              setUsers(data.users);
            } else {
              const filtered = data.users.filter(user =>
                user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
              );
              setUsers(filtered);
            }
          }
        })
        .catch((error: unknown) => {
          console.error("Error refetching users:", error);
          addToast(t('users.errorRefreshing'), 'error');
        });
    },
    onError: (error) => {
      console.error("Delete user error:", error);
      setError(error.message);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      addToast(t('users.deleteError', { message: error.message }), 'error');
    }
  });

  // Update users state when data changes
  useEffect(() => {
    if (data && data.users) {
      setAllUsers(data.users);
      setUsers(data.users);
    }
  }, [data]);

  // Surface query errors as a toast (replaces the deprecated useQuery onError option)
  useEffect(() => {
    if (queryError) {
      console.error("GraphQL query error:", queryError);
      addToast(t('users.errorLoading', { message: queryError.message }), 'error');
    }
  }, [queryError, addToast]);

  // Filter users when search term changes
  useEffect(() => {
    if (allUsers.length > 0) {
      if (searchTerm.trim() === '') {
        setUsers(allUsers);
      } else {
        const filtered = allUsers.filter(user => 
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setUsers(filtered);
      }
    }
  }, [searchTerm, allUsers]);

  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Form handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleProfilePictureUpdate = (url: string) => {
    setFormData(prev => ({
      ...prev,
      profilePicture: url
    }));
  };

  const handleSubmit = () => {
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.role) {
      setError(t('users.requiredFields'));
      return;
    }

    if (isEditing) {
      // Update existing user
      const input = { ...formData };
      
      // Don't send empty password
      if (!input.password) {
        const { password, ...rest } = input;
        
        updateUser({ 
          variables: { id: selectedUserId, input: rest },
          update: (cache, { data }) => {
            if (data && data.updateUser) {
              // Update Apollo cache to reflect the changes immediately
              const updatedUser = data.updateUser;
              const cacheData: { users: User[] } | null = cache.readQuery({ 
                query: GET_USERS, 
                variables: { skip: 0, take: 50 } 
              });
              
              if (cacheData && cacheData.users) {
                const updatedUsers = cacheData.users.map((user: User) => 
                  user.id === updatedUser.id ? updatedUser : user
                );
                
                cache.writeQuery({
                  query: GET_USERS,
                  variables: { skip: 0, take: 50 },
                  data: { users: updatedUsers }
                });
              }
            }
          }
        });
      } else {
        
        updateUser({ 
          variables: { id: selectedUserId, input: input },
          update: (cache, { data }) => {
            if (data && data.updateUser) {
              // Update Apollo cache to reflect the changes immediately
              const updatedUser = data.updateUser;
              const cacheData: { users: User[] } | null = cache.readQuery({ 
                query: GET_USERS, 
                variables: { skip: 0, take: 50 } 
              });
              
              if (cacheData && cacheData.users) {
                const updatedUsers = cacheData.users.map((user: User) => 
                  user.id === updatedUser.id ? updatedUser : user
                );
                
                cache.writeQuery({
                  query: GET_USERS,
                  variables: { skip: 0, take: 50 },
                  data: { users: updatedUsers }
                });
              }
            }
          }
        });
      }
    } else {
      // Create new user
      
      createUser({ 
        variables: { input: formData },
        update: (cache, { data }) => {
          if (data && data.createUser) {
            // Update Apollo cache to reflect the new user immediately
            const newUser = data.createUser;
            const cacheData: { users: User[] } | null = cache.readQuery({ 
              query: GET_USERS, 
              variables: { skip: 0, take: 50 } 
            });
            
            if (cacheData && cacheData.users) {
              const updatedUsers = [...cacheData.users, newUser];
              
              cache.writeQuery({
                query: GET_USERS,
                variables: { skip: 0, take: 50 },
                data: { users: updatedUsers }
              });
            }
          }
        }
      });
    }
  };

  const handleEdit = (user: User) => {
    setIsEditing(true);
    setSelectedUserId(user.id);
    setFormData({
      email: user.email,
      password: '', // Don't populate password
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profilePicture: user.profilePicture || '',
      requiresPasswordChange: user.requiresPasswordChange || false,
    });
    setIsFormModalOpen(true);
  };

  const handleCreate = () => {
    setIsEditing(false);
    setSelectedUserId(null);
    setFormData(initialFormData);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      
      deleteUser({ 
        variables: { id: userToDelete },
        update: (cache, { data }) => {
          if (data && data.deleteUser) {
            // Update Apollo cache to remove the deleted user immediately
            const deletedUserId = data.deleteUser.id;
            const cacheData: { users: User[] } | null = cache.readQuery({ 
              query: GET_USERS, 
              variables: { skip: 0, take: 50 } 
            });
            
            if (cacheData && cacheData.users) {
              const updatedUsers = cacheData.users.filter(user => user.id !== deletedUserId);
              
              cache.writeQuery({
                query: GET_USERS,
                variables: { skip: 0, take: 50 },
                data: { users: updatedUsers }
              });
            }
          }
        }
      });
      // Modal is closed in the onCompleted handler
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedUserId(null);
    setIsEditing(false);
    setError(null);
  };

  // Check if user can edit/delete another user
  const canManageUser = (targetUser: User) => {
    if (!currentUser) return false;
    
    // Admins can manage any user
    if (currentUser.role === 'ADMIN') return true;
    
    // Librarians can manage only regular users, not other librarians or admins
    if (currentUser.role === 'LIBRARIAN') {
      return targetUser.role === 'USER';
    }
    
    return false;
  };

  // Only allow creation of users with roles below the current user's role
  const allowedRolesToCreate = () => {
    if (currentUser?.role === 'ADMIN') {
      return [
        { value: 'USER', label: t('users.roleUser') },
        { value: 'LIBRARIAN', label: t('users.roleLibrarian') },
        { value: 'ADMIN', label: t('users.roleAdmin') }
      ];
    } else if (currentUser?.role === 'LIBRARIAN') {
      return [
        { value: 'USER', label: t('users.roleUser') }
      ];
    }
    return [];
  };

  // Add a function to explicitly refresh the user list
  const refreshUserList = () => {
    
    // Track the initial user count for comparison
    const initialUserCount = allUsers.length;
    
    // Then refetch with network-only policy
    refetch({ 
      fetchPolicy: 'network-only' 
    }).then((result: { data?: { users: User[] } }) => {
      if (result.data && result.data.users) {
        
        // Check if data has changed by comparing lengths and IDs
        const hasDataChanged = 
          initialUserCount !== result.data.users.length || 
          !allUsers.every((user: User) => result.data?.users.some((newUser: User) => newUser.id === user.id));
        
        setAllUsers(result.data.users);
        
        // Apply current search filter
        if (searchTerm) {
          const filtered = result.data.users.filter((user: User) => 
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setUsers(filtered);
        } else {
          setUsers(result.data.users);
        }
        
        // Only show toast if data has actually changed
        if (hasDataChanged) {
          addToast(t('users.listUpdated'), 'success');
        }
      }
    }).catch((err: Error) => {
      console.error("Error refreshing users:", err);
      addToast(t('users.errorRefreshing'), 'error');
    });
  };

  // Add a refresh button to the UI to manually refresh the user list
  const manualRefresh = () => {
    
    // Track the initial user count to detect changes
    const initialUserCount = allUsers.length;
    const initialUserIds = new Set(allUsers.map(user => user.id));
    
    refetch({ fetchPolicy: 'network-only' })
      .then(({ data }: { data?: { users: User[] } }) => {
        if (data && data.users) {
          // Check if data has changed by comparing user counts and IDs
          const hasDataChanged = 
            initialUserCount !== data.users.length || 
            data.users.some((user: User) => !initialUserIds.has(user.id));
          
          setAllUsers(data.users);
          setUsers(data.users);
          
          // Only show toast if data has changed
          if (hasDataChanged) {
            addToast(t('users.listUpdated'), 'success');
          }
        }
      })
      .catch((error: unknown) => {
        console.error("Manual refresh error:", error);
        addToast(t('users.errorRefreshing'), 'error');
      });
  };

  const renderContent = () => {
    if (queryError) {
      return (
        <div className="p-6 text-center">
          <p className="text-red-500">{t('users.errorLoading', { message: queryError.message })}</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent align-[-0.125em]" role="status">
            <span className="sr-only">{t('common.loading')}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 transition-colors">{t('users.loadingUsers')}</p>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{t('users.noUsersHint')}</p>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {users.map((user) => (
          <li key={user.id} className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 sm:px-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start min-w-0">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-10 w-10 rounded-full mr-4 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 mr-4 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white transition-colors break-words">
                    {user.firstName} {user.lastName}
                    {user.requiresPasswordChange && (
                      <span className="ml-2 inline-flex items-center px-5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {t('users.newAccount')}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors break-all">{user.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors flex flex-wrap items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                        : user.role === 'LIBRARIAN'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {user.role}
                    </span>
                    {!!user.activeBorrowCount && (
                      <span className="inline-flex items-center px-5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {t('users.activeLoans', { count: user.activeBorrowCount })}
                      </span>
                    )}
                    {!!user.overdueBorrowCount && (
                      <span className="inline-flex items-center px-5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {t('users.overdue', { count: user.overdueBorrowCount })}
                      </span>
                    )}
                    {!!user.outstandingFines && (
                      <span className="inline-flex items-center px-5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        {t('users.owed', { amount: user.outstandingFines.toLocaleString() })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {canManageUser(user) && (
                <div className="flex flex-shrink-0 space-x-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleEdit(user)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={t('users.editUserTitle')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(user.id)}
                    disabled={deleteLoading || user.id === currentUser?.id}
                    className={`${
                      user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''
                    } text-red-500 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                    title={user.id === currentUser?.id ? t('users.cannotDeleteSelf') : t('users.deleteUser')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  // If not an admin or librarian, don't render anything
  if (!isAdmin() && currentUser?.role !== 'LIBRARIAN') {
    return (
      <div className="text-center">
        <p className="text-red-500">{t('users.noPermission')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow dark:bg-gray-800 dark:border dark:border-gray-700 sm:rounded-md transition-colors">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white transition-colors">
            {t('users.title')}
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder={t('users.search')}
                className="input w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="button" 
                onClick={manualRefresh}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                title={t('users.refreshList')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('users.refresh')}
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full sm:w-auto justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                {t('users.addUser')}
              </button>
            </div>
          </div>
        </div>
        
        {renderContent()}

        {/* Pagination */}
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.usersCount ?? 0}
          onPage={(p) => { setPage(p); refetch({ skip: p * PAGE_SIZE, take: PAGE_SIZE }); }}
        />
      </div>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={isFormModalOpen}
        title={isEditing ? t('users.editUser') : t('users.addUser')}
        confirmText={isEditing ? t('users.saveChanges') : t('users.addUser')}
        cancelText={t('users.cancel')}
        onConfirm={handleSubmit}
        onCancel={() => setIsFormModalOpen(false)}
        type="form"
        size="md"
      >
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FloatingInput
                id="firstName"
                name="firstName"
                label={t('users.firstName')}
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <FloatingInput
                id="lastName"
                name="lastName"
                label={t('users.lastName')}
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <FloatingInput
              id="email"
              name="email"
              label={t('users.email')}
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="mt-4">
            <FloatingInput
              id="password"
              name="password"
              label={isEditing ? t('users.newPasswordOptional') : t('users.password')}
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!isEditing}
            />
          </div>
          <div className="mt-4">
            <FloatingDropdown
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              label={t('users.role')}
              options={
                // If editing an existing user, restrict role options based on current user role
                isEditing && formData.role === 'ADMIN' && currentUser?.role !== 'ADMIN'
                  ? [{ value: 'ADMIN', label: t('users.roleAdmin') }] // Cannot change admin role if not an admin
                  : allowedRolesToCreate()
              }
              required
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('users.profilePicture')}
            </label>
            {isEditing ? (
              <FileUpload
                entityId={selectedUserId || ''}
                uploadType="PROFILE_PICTURE"
                currentImageUrl={formData.profilePicture}
                onUploadSuccess={handleProfilePictureUpdate}
                onUploadError={(error) => setError(error)}
                buttonLabel={t('users.uploadProfilePicture')}
              />
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('users.uploadAfterCreate')}
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center">
            <input
              id="requiresPasswordChange"
              name="requiresPasswordChange"
              type="checkbox"
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              checked={formData.requiresPasswordChange || false}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="requiresPasswordChange" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              {t('users.requirePasswordChange')}
            </label>
          </div>
          {error && (
            <div className="mt-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete User Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        title={t('users.deleteUser')}
        message={t('users.deleteUserConfirm')}
        confirmText={deleteLoading ? t('users.deleting') : t('users.delete')}
        cancelText={t('users.cancel')}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteLoading}
        itemType="user"
      />

    </div>
  );
};

export default UserManagement; 