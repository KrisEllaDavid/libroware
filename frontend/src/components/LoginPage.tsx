import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LOGIN } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import FloatingInput from './FloatingInput';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [loginMutation, { loading }] = useMutation(LOGIN, {
    onCompleted: (data: any) => {
      if (data?.login?.token && data?.login?.user) {
        const userRole = data.login.user.role?.toUpperCase();
        login(data.login.token, data.login.user);
        setRedirectTo(
          userRole === 'ADMIN'      ? '/admin?tab=users' :
          userRole === 'LIBRARIAN'  ? '/admin' :
                                      '/dashboard'
        );
      } else {
        setError(t('auth.invalidResponse'));
      }
    },
    onError: (err: any) => setError(err.message || 'Login failed'),
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await loginMutation({ variables: { input: { email, password } } });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('libroware_lang', next);
  };

  if (redirectTo) return <Navigate to={redirectTo} replace />;

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        {/* Language toggle */}
        <div className="flex justify-end mb-2">
          <button onClick={toggleLang}
            className="text-xs font-bold px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            {t('lang.switch')}
          </button>
        </div>

        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900 dark:text-white">{t('app.name')}</h1>
          <h2 className="mt-6 text-center text-xl text-gray-800 dark:text-gray-200">{t('auth.signIn')}</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <FloatingInput
              id="email" name="email" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required label={t('auth.email')}
            />
            <div className="relative">
              <FloatingInput
                id="password" name="password"
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                required label={t('auth.password')}
              />
              <button type="button"
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xs"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? t('auth.hide') : t('auth.show')}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 disabled:opacity-50 transition-all duration-200">
            {loading ? t('auth.signingIn') : t('auth.signInBtn')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
