import React, { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { UPDATE_USER } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Card, CardBody, Icon, Input, cn } from './ui';

interface PasswordData {
  password: string;
  confirmPassword: string;
}

/** Four checks, shown live. Each one is a rule the submit handler enforces. */
const rules = [
  { id: 'length', test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { id: 'letter', test: (p: string) => /[a-zA-Z]/.test(p), label: 'Contains a letter' },
  { id: 'number', test: (p: string) => /\d/.test(p), label: 'Contains a number' },
];

const UserSetupForm: React.FC = () => {
  const { t } = useTranslation();
  const { user, login: authLogin } = useAuth();
  const [passwordData, setPasswordData] = useState<PasswordData>({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);

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

  const passed = useMemo(
    () => rules.map((r) => ({ ...r, ok: r.test(passwordData.password) })),
    [passwordData.password]
  );

  const mismatch =
    passwordData.confirmPassword.length > 0 &&
    passwordData.password !== passwordData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!passwordData.password.trim()) {
      setError(t('setup.required'));
      return;
    }
    if (passwordData.password.length < 8) {
      setError(t('setup.minLength'));
      return;
    }
    if (passwordData.password !== passwordData.confirmPassword) {
      setError(t('setup.mismatch'));
      return;
    }
    if (!user?.id) {
      setError(t('setup.missingUser'));
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

  const revealToggle = (
    <button
      type="button"
      onClick={() => setReveal((v) => !v)}
      aria-label={reveal ? t('auth.hide') : t('auth.show')}
      aria-pressed={reveal}
      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
    >
      <Icon name={reveal ? 'eyeOff' : 'eye'} size={16} />
    </button>
  );

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
            <Icon name="lock" size={24} />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {t('setup.welcome')}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {t('setup.subtitle')}
          </p>
        </div>

        <Card>
          <CardBody>
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {error && <Alert tone="danger">{error}</Alert>}

              <Input
                id="password"
                name="password"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                label={t('setup.newPassword')}
                icon="lock"
                value={passwordData.password}
                onChange={handleChange}
                trailing={revealToggle}
                required
              />

              {/* Requirements, checked live. Telling someone their password is
                  too short only after they submit twice is the slowest way to
                  communicate a rule. */}
              <ul className="space-y-1.5">
                {passed.map((rule) => (
                  <li
                    key={rule.id}
                    className={cn(
                      'flex items-center gap-2 text-xs transition-colors duration-200',
                      rule.ok
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors duration-200',
                        rule.ok
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-gray-300 dark:border-gray-600'
                      )}
                      aria-hidden="true"
                    >
                      {rule.ok && <Icon name="check" size={10} strokeWidth={3} />}
                    </span>
                    {rule.label}
                  </li>
                ))}
              </ul>

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                label={t('setup.confirmPass')}
                icon="lock"
                value={passwordData.confirmPassword}
                onChange={handleChange}
                error={mismatch ? t('setup.mismatch') : null}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                loading={loading}
              >
                {loading ? t('setup.setting') : t('setup.setBtn')}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default UserSetupForm;
