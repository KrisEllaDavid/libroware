import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_USER } from '../graphql/mutations';
import FloatingInput from './FloatingInput';
import { useAuth } from '../context/AuthContext';

interface PasswordData {
  password: string;
  confirmPassword: string;
}

const UserSetupForm: React.FC = () => {
  const { user, login: authLogin } = useAuth();
  const [passwordData, setPasswordData] = useState<PasswordData>({ 
    password: '', 
    confirmPassword: '' 
  });
  const [error, setError] = useState<string | null>(null);

  const [updateUser, { loading }] = useMutation(UPDATE_USER, {
    onCompleted: (data: { updateUser: any }) => {
      const updatedUser = {
        ...user,
        ...data.updateUser,
        requiresPasswordChange: false
      };
      
      // Update auth context with the updated user info
      const token = localStorage.getItem('token') || '';
      authLogin(token, updatedUser);
    },
    onError: (error: any) => {
      console.error('Password update error:', error);
      // Extract more specific error message if available
      const errorMessage = error.graphQLErrors?.[0]?.message || error.message || 'Failed to update password';
      setError(errorMessage);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!passwordData.password.trim()) {
      setError('Password is required');
      return;
    }
    
    if (passwordData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (passwordData.password !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!user?.id) {
      setError('User information is missing. Please try logging in again.');
      return;
    }

    try {
      await updateUser({
        variables: {
          id: user.id,
          input: { 
            password: passwordData.password,
            requiresPasswordChange: false
          }
        }
      });
    } catch (err) {
      // Error is handled in onError above
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">Welcome to Libroware</h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900 dark:text-white">Set Your Password</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Your account has been created. Please set a password to continue.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <FloatingInput
                id="password"
                name="password"
                type="password"
                value={passwordData.password}
                onChange={handleChange}
                required
                label="New Password"
              />
            </div>
            
            <div>
              <FloatingInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handleChange}
                required
                label="Confirm Password"
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all"
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSetupForm; 