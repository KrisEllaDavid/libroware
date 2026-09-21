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
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  IconButton,
  PageHeader,
  SearchInput,
  Alert,
  Checkbox,
  Skeleton,
  Tag,
} from '../ui';

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

  const roleTone = (role: string) =>
    role === 'ADMIN' ? 'accent' : role === 'LIBRARIAN' ? 'info' : 'neutral';

  const renderContent = () => {
    if (queryError) {
      return (
        <ErrorState
          message={queryError.message}
          onRetry={() => refetch()}
          retryLabel={t('users.refresh')}
        />
      );
    }

    if (loading) {
      // Rows shaped like the list they replace, so nothing jumps on arrival.
      return (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-16" />
            </li>
          ))}
        </ul>
      );
    }

    if (users.length === 0) {
      return (
        <EmptyState
          icon="users"
          title={searchTerm ? t('users.noMatchTitle', 'No matching members') : t('users.noUsersTitle', 'No members yet')}
          description={searchTerm ? t('users.noMatchHint', { term: searchTerm, defaultValue: `Nothing matches “${searchTerm}”.` }) : t('users.noUsersHint')}
          action={
            searchTerm ? (
              <Button variant="secondary" icon="close" onClick={() => setSearchTerm('')}>
                {t('common.clearSearch', 'Clear search')}
              </Button>
            ) : (
              <Button variant="primary" icon="userPlus" onClick={handleCreate}>
                {t('users.addUser')}
              </Button>
            )
          }
        />
      );
    }

    return (
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex flex-col gap-3 px-5 py-4 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/50 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
          >
            <Avatar
              src={user.profilePicture}
              firstName={user.firstName}
              lastName={user.lastName}
              size="md"
              className="shrink-0"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h4>
                {user.requiresPasswordChange && (
                  <Tag tone="warning" size="sm">{t('users.newAccount')}</Tag>
                )}
              </div>

              <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>

              {/* Standing: role always, then only the counts that are non-zero.
                  Rendering "0 overdue" on every row is noise that makes the
                  rows that do have overdue loans harder to spot. */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Tag tone={roleTone(user.role)} size="sm">
                  {user.role === 'ADMIN'
                    ? t('users.roleAdmin')
                    : user.role === 'LIBRARIAN'
                    ? t('users.roleLibrarian')
                    : t('users.roleUser')}
                </Tag>
                {!!user.activeBorrowCount && (
                  <Tag tone="neutral" size="sm" icon="bookmark">
                    {t('users.activeLoans', { count: user.activeBorrowCount })}
                  </Tag>
                )}
                {!!user.overdueBorrowCount && (
                  <Tag tone="danger" size="sm" icon="clock">
                    {t('users.overdue', { count: user.overdueBorrowCount })}
                  </Tag>
                )}
                {!!user.outstandingFines && (
                  <Tag tone="warning" size="sm" icon="coins">
                    {t('users.owed', { amount: user.outstandingFines.toLocaleString() })}
                  </Tag>
                )}
              </div>
            </div>

            {canManageUser(user) && (
              <div className="flex shrink-0 items-center gap-0.5 self-start sm:self-center">
                <IconButton
                  icon="edit"
                  label={t('users.editUserTitle')}
                  onClick={() => handleEdit(user)}
                />
                <IconButton
                  icon="trash"
                  tone="danger"
                  label={
                    user.id === currentUser?.id
                      ? t('users.cannotDeleteSelf')
                      : t('users.deleteUser')
                  }
                  disabled={deleteLoading || user.id === currentUser?.id}
                  onClick={() => handleDelete(user.id)}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  // If not an admin or librarian, don't render anything
  if (!isAdmin() && currentUser?.role !== 'LIBRARIAN') {
    return (
      <ErrorState
        title={t('users.noPermission')}
        message={t(
          'users.noPermissionHint',
          'Ask an administrator if you need access to member records.'
        )}
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon="users"
        eyebrow={t('admin.tabs.users')}
        title={t('users.title')}
        description={t(
          'users.subtitle',
          'Accounts, roles and borrowing standing for every library member.'
        )}
        actions={
          <>
            <Button icon="refresh" onClick={manualRefresh}>
              {t('users.refresh')}
            </Button>
            <Button variant="primary" icon="userPlus" onClick={handleCreate}>
              {t('users.addUser')}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader
          title={t('users.title')}
          description={t('users.count', {
            count: data?.usersCount ?? users.length,
            defaultValue: `${(data?.usersCount ?? users.length).toLocaleString()} members`,
          })}
          actions={
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              onClear={() => setSearchTerm('')}
              placeholder={t('users.search')}
              wrapperClassName="sm:w-72"
            />
          }
        />

        {renderContent()}

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.usersCount ?? 0}
          onPage={(p) => { setPage(p); refetch({ skip: p * PAGE_SIZE, take: PAGE_SIZE }); }}
        />
      </Card>

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
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FloatingInput
              id="firstName"
              name="firstName"
              label={t('users.firstName')}
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
            <FloatingInput
              id="lastName"
              name="lastName"
              label={t('users.lastName')}
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>

          <FloatingInput
            id="email"
            name="email"
            label={t('users.email')}
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FloatingInput
              id="password"
              name="password"
              label={isEditing ? t('users.newPasswordOptional') : t('users.password')}
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!isEditing}
            />
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

          <div>
            <p className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300">
              {t('users.profilePicture')}
            </p>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('users.uploadAfterCreate')}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-gray-800/60">
            <Checkbox
              id="requiresPasswordChange"
              name="requiresPasswordChange"
              checked={formData.requiresPasswordChange || false}
              onChange={handleCheckboxChange}
              label={t('users.requirePasswordChange')}
              description={t(
                'users.requirePasswordChangeHint',
                'The member sets their own password the first time they sign in.'
              )}
            />
          </div>

          {error && <Alert tone="danger">{error}</Alert>}
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