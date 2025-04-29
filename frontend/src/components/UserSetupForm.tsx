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
  const [showPassword, setShowPassword] = useState(false);

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

  // Emergency bypass for development/testing
  const skipPasswordChange = () => {
    if (user) {
      const updatedUser = {
        ...user,
        requiresPasswordChange: false
      };
      const token = localStorage.getItem('token') || '';
      authLogin(token, updatedUser);
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
            <div className="relative">
              <FloatingInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={passwordData.password}
                onChange={handleChange}
                required
                label="New Password"
              />
              <button 
                type="button"
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            
            <div>
              <FloatingInput
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
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
            
            {/* Development bypass link - remove in production */}
            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={skipPasswordChange}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Skip Password Change (Dev Only)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSetupForm; 