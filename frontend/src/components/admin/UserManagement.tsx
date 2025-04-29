import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { GET_USERS } from '../../graphql/queries';
import { CREATE_USER, UPDATE_USER, DELETE_USER, FORCE_DELETE_USER } from '../../graphql/mutations';
import Modal from '../Modal';
import FloatingInput from '../FloatingInput';
import FloatingDropdown from '../FloatingDropdown';
import DeleteConfirmation from '../DeleteConfirmation';
import FileUpload from '../common/FileUpload';
import { User, Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

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

const UserManagement: React.FC = () => {
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
  const [isForceDeleteModalOpen, setIsForceDeleteModalOpen] = useState(false);
  const [userHasRecords, setUserHasRecords] = useState(false);

  const { toasts, addToast } = useToast();

  // GraphQL queries and mutations
  const { loading, error: queryError, data, refetch } = useQuery(GET_USERS, {
    variables: { skip: 0, take: 50 },
    fetchPolicy: 'network-only', // Always fetch fresh data
    onCompleted: (data: { users: User[] }) => {
      console.log("Users data received:", data);
      setAllUsers(data.users);
      setUsers(data.users);
    },
    onError: (error: any) => {
      console.error("GraphQL query error:", error);
      addToast('Error loading users: ' + error.message, 'error');
    }
  });

  const [createUser, { loading: createLoading }] = useMutation(CREATE_USER, {
    onCompleted: (data: { createUser: User }) => {
      console.log("User created successfully:", data);
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
      addToast('Failed to create user: ' + error.message, 'error');
    },
  });

  const [updateUser, { loading: updateLoading }] = useMutation(UPDATE_USER, {
    onCompleted: (data: { updateUser: User }) => {
      console.log("User updated successfully:", data);
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
      addToast('Failed to update user: ' + error.message, 'error');
    },
  });

  const [deleteUser, { loading: deleteLoading }] = useMutation(DELETE_USER, {
    onCompleted: (data) => {
      console.log("User deleted successfully:", data);
      
      // Close the modal immediately
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      
      // Immediate UI update without waiting for refetch
      if (userToDelete) {
        const filteredUsers = allUsers.filter(user => user.id !== userToDelete);
        setAllUsers(filteredUsers);
        setUsers(filteredUsers);
      }
      
      // Add a small delay before refetching to ensure the server has processed the deletion
      setTimeout(() => {
        console.log("Refetching users after deletion");
        refetch({ fetchPolicy: 'network-only' })
          .then(({ data }) => {
            if (data && data.users) {
              console.log("Refetch successful, got", data.users.length, "users");
              setAllUsers(data.users);
              
              // Apply search filter if one exists
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
          .catch(error => {
            console.error("Error refetching users:", error);
            addToast('Error refreshing user list', 'error');
          });
      }, 500); // Small delay to ensure deletion is processed
    },
    onError: (error) => {
      console.error("Delete user error:", error);
      setError(error.message);
      
      // Check if it's a foreign key constraint error
      if (error.message.includes('Foreign key constraint violated')) {
        // Switch to force delete confirmation instead of closing the modal
        setIsForceDeleteModalOpen(true);
      } else {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        addToast(`Error: ${error.message}`, 'error');
      }
    }
  });

  const [forceDeleteUser, { loading: forceDeleteLoading }] = useMutation(FORCE_DELETE_USER, {
    onCompleted: (data: { forceDeleteUser: { id: string } }) => {
      console.log("User force deleted successfully:", data);
      
      // Close all modals
      setIsForceDeleteModalOpen(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      setUserHasRecords(false);
      
      // Refetch and update UI
      refetch().then((result: { data?: { users: User[] } }) => {
        if (result.data && result.data.users) {
          setAllUsers(result.data.users);
          setUsers(result.data.users);
          addToast('User and all associated records deleted successfully', 'success');
        }
      }).catch((err: any) => {
        console.error("Error refetching users after force delete:", err);
        addToast('Error refreshing user list: ' + err.message, 'error');
      });
      
      // Optimistic update
      if (userToDelete) {
        const filteredUsers = allUsers.filter(user => user.id !== userToDelete);
        setAllUsers(filteredUsers);
        setUsers(filteredUsers);
      }
    },
    onError: (error: any) => {
      console.error("Force delete user error:", error);
      setError(error.message);
      setIsForceDeleteModalOpen(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      setUserHasRecords(false);
      addToast(`Error: ${error.message}`, 'error');
    },
  });

  // Update users state when data changes
  useEffect(() => {
    if (data && data.users) {
      setAllUsers(data.users);
      setUsers(data.users);
    }
  }, [data]);

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
      setError('Please fill in all required fields');
      return;
    }

    if (isEditing) {
      // Update existing user
      const input = { ...formData };
      
      // Don't send empty password
      if (!input.password) {
        const { password, ...rest } = input;
        console.log("Updating user with ID:", selectedUserId);
        console.log("Update payload:", rest);
        
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
        console.log("Updating user with ID and password:", selectedUserId);
        console.log("Update payload with password:", {...input, password: "[REDACTED]"});
        
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
      console.log("Creating new user:", { ...formData, password: "[REDACTED]" });
      
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
      console.log("Deleting user with ID:", userToDelete);
      
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

  const confirmForceDelete = () => {
    if (userToDelete) {
      console.log("Force deleting user with ID:", userToDelete);
      
      forceDeleteUser({ 
        variables: { id: userToDelete },
        update: (cache, { data }) => {
          if (data && data.forceDeleteUser) {
            // Update Apollo cache to remove the deleted user immediately
            const deletedUserId = data.forceDeleteUser.id;
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
    }
  };

  const cancelForceDelete = () => {
    setIsForceDeleteModalOpen(false);
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
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
        { value: 'USER', label: 'User' },
        { value: 'LIBRARIAN', label: 'Librarian' },
        { value: 'ADMIN', label: 'Admin' }
      ];
    } else if (currentUser?.role === 'LIBRARIAN') {
      return [
        { value: 'USER', label: 'User' }
      ];
    }
    return [];
  };

  // Add a function to explicitly refresh the user list
  const refreshUserList = () => {
    console.log("Manually refreshing user list");
    
    // Track the initial user count for comparison
    const initialUserCount = allUsers.length;
    
    // Then refetch with network-only policy
    refetch({ 
      fetchPolicy: 'network-only' 
    }).then((result: { data?: { users: User[] } }) => {
      if (result.data && result.data.users) {
        console.log("Refreshed user list:", result.data.users.length);
        
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
          addToast('User list updated', 'success');
        }
      }
    }).catch((err: Error) => {
      console.error("Error refreshing users:", err);
      addToast('Error refreshing user list', 'error');
    });
  };

  // Add a refresh button to the UI to manually refresh the user list
  const manualRefresh = () => {
    console.log("Manual refresh requested");
    
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
            addToast('User list updated', 'success');
          }
        }
      })
      .catch((error: Error) => {
        console.error("Manual refresh error:", error);
        addToast('Error refreshing user list', 'error');
      });
  };

  const renderContent = () => {
    if (queryError) {
      return (
        <div className="p-6 text-center">
          <p className="text-red-500">Error loading users: {queryError.message}</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent align-[-0.125em]" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 transition-colors">Loading users...</p>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">No users found. Click "Add User" to create one.</p>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {users.map((user) => (
          <li key={user.id} className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 sm:px-6 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-10 w-10 rounded-full mr-4 object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 mr-4 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                    {user.firstName} {user.lastName}
                    {user.requiresPasswordChange && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        New Account
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{user.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                        : user.role === 'LIBRARIAN'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {user.role}
                    </span>
                  </p>
                </div>
              </div>
              {canManageUser(user) && (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(user)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Edit User"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(user.id)}
                    disabled={deleteLoading || user.id === currentUser?.id}  // Prevent self-deletion
                    className={`${
                      user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''
                    } text-red-500 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                    title={user.id === currentUser?.id ? "Cannot delete your own account" : "Delete User"}
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
        <p className="text-red-500">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow dark:bg-gray-800 dark:border dark:border-gray-700 sm:rounded-md transition-colors">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white transition-colors">
            Users
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search users..."
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
                title="Refresh user list"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full sm:w-auto justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Add User
              </button>
            </div>
          </div>
        </div>
        
        {renderContent()}
      </div>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={isFormModalOpen}
        title={isEditing ? 'Edit User' : 'Add User'}
        confirmText={isEditing ? 'Save Changes' : 'Add User'}
        cancelText="Cancel"
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
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <FloatingInput
                id="lastName"
                name="lastName"
                label="Last Name"
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
              label="Email"
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
              label={isEditing ? "New Password (leave blank to keep current)" : "Password"}
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
              label="Role"
              options={
                // If editing an existing user, restrict role options based on current user role
                isEditing && formData.role === 'ADMIN' && currentUser?.role !== 'ADMIN'
                  ? [{ value: 'ADMIN', label: 'Admin' }] // Cannot change admin role if not an admin
                  : allowedRolesToCreate()
              }
              required
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Profile Picture
            </label>
            {isEditing ? (
              <FileUpload
                entityId={selectedUserId || ''}
                uploadType="PROFILE_PICTURE"
                currentImageUrl={formData.profilePicture}
                onUploadSuccess={handleProfilePictureUpdate}
                onUploadError={(error) => setError(error)}
                buttonLabel="Upload Profile Picture"
              />
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                You can upload a profile picture after creating the user.
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
              Require password change on next login
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
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText={deleteLoading ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteLoading}
        itemType="user"
      />

      {/* Force Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isForceDeleteModalOpen}
        title="User Has Associated Records"
        message={
          <div>
            <p className="mb-4">This user has borrowed books, pending requests, or other associated records that prevent deletion.</p>
            <p className="mb-2 font-medium">You have two options:</p>
            <ol className="list-decimal pl-5 space-y-2 mb-4">
              <li>Cancel and manually remove the user's records first</li>
              <li>Force delete the user, which will remove ALL associated records</li>
            </ol>
            <p className="text-red-600 font-medium">Warning: Force delete is permanent and will remove all user data!</p>
          </div>
        }
        confirmText={forceDeleteLoading ? "Deleting..." : "Force Delete"}
        cancelText="Cancel"
        onConfirm={confirmForceDelete}
        onCancel={cancelForceDelete}
        isLoading={forceDeleteLoading}
        itemType="user"
        isDanger={true}
      />
    </div>
  );
};

export default UserManagement; 