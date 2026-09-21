import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LOGIN } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Icon, Input, LibraryScene } from './ui';

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
    /*
      Two-panel sign-in: the form on the left, the reading-room illustration on
      the right from `lg` up. A lone card floating in the middle of an empty
      grey page is the default every admin tool ships with — and it gave a
      university library product no sense of what it was for.

      The art panel is the one that disappears below `lg`, never the form.
    */
    <div className="flex min-h-dvh bg-white dark:bg-gray-950">
      <div className="flex w-full flex-col lg:w-[52%] xl:w-[46%]">
        {/* Top bar: brand and language, aligned to the form's own gutter. */}
        <header className="flex items-center justify-between px-6 py-6 sm:px-10 lg:px-14">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Icon name="books" size={20} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              {t('app.name', 'Libroware')}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-all duration-200 ease-soft hover:border-gray-300 hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Icon name="globe" size={14} />
            {t('lang.switch')}
          </button>
        </header>

        {/* The form is optically centred in the remaining height, and capped at
            a comfortable measure so it doesn't stretch on a wide window. */}
        <main className="flex flex-1 items-center px-6 pb-12 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-[24rem] animate-fade-up">
            <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {t('auth.signIn')}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {t(
                'auth.signInSubtitle',
                'Sign in with the account issued by your library desk.'
              )}
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleLogin} noValidate>
              {error && <Alert tone="danger">{error}</Alert>}

              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                label={t('auth.email')}
                icon="mail"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                label={t('auth.password')}
                icon="lock"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('auth.hide') : t('auth.show')}
                    aria-pressed={showPassword}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                loading={loading}
                iconAfter={loading ? undefined : 'arrowRight'}
              >
                {loading ? t('auth.signingIn') : t('auth.signInBtn')}
              </Button>
            </form>

            <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              <Icon name="info" size={14} className="mt-px shrink-0 text-gray-400" />
              {t(
                'auth.helpNote',
                'Lost your password? The library desk can reset it for you.'
              )}
            </p>
          </div>
        </main>
      </div>

      {/* Art panel. Decorative, so it carries no heading and is skipped by
          assistive tech beyond the illustration's own label. */}
      <aside className="relative hidden lg:block lg:w-[48%] xl:w-[54%]">
        <div className="absolute inset-0">
          <LibraryScene />
        </div>

        {/* Caption sits on a solid scrim rather than a blur: it has to stay
            legible over whatever part of the illustration falls behind it. */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-950 via-emerald-950/80 to-transparent px-12 pb-12 pt-24">
          <p className="max-w-md font-display text-2xl font-medium leading-snug tracking-tight text-white">
            {t(
              'auth.tagline',
              'Every title, borrower and due date for the Congo-Cameroon Interstate University library.'
            )}
          </p>
          <p className="mt-3 text-sm text-emerald-100/80">
            {t('auth.taglineSub', 'Catalogue · Borrowing · Reservations · Fines')}
          </p>
        </div>
      </aside>
    </div>
  );
};

export default LoginPage;
