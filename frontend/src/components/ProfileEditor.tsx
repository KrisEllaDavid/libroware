import React, { useState, useRef, ChangeEvent } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { UPDATE_USER, UPLOAD_PROFILE_PICTURE } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import imageCompression from 'browser-image-compression';
import ReactDOM from 'react-dom';
import { Avatar, Button, Checkbox, Icon, Input, Spinner, cn } from './ui';

interface ProfileEditorProps {
  onClose: () => void;
  onUpdate: (updated?: Partial<{ firstName: string; lastName: string; email: string; profilePicture: string }>) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ onClose, onUpdate }) => {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // GraphQL mutations
  const [updateUser, { loading: updateLoading }] = useMutation(UPDATE_USER);
  const [uploadProfilePicture, { loading: uploadLoading }] = useMutation(UPLOAD_PROFILE_PICTURE);

  // Handle profile image selection
  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsProcessingImage(true);

    try {
      // Compress the image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true
      };

      const compressedFile = await imageCompression(file, options);
      setImageFile(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      addToast(t('profile.errorProcessingImage'), 'error');
      setIsProcessingImage(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      addToast(t('profile.notAuthenticated'), 'error');
      return;
    }

    // Validate password if changing
    if (isChangingPassword) {
      if (!currentPassword) {
        addToast(t('profile.currentPasswordRequired'), 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        addToast(t('profile.passwordsNoMatch'), 'error');
        return;
      }

      if (newPassword.length < 8) {
        addToast(t('profile.passwordTooShort'), 'error');
        return;
      }
    }

    try {
      // Prepare update input
      const input: any = {
        firstName,
        lastName
      };

      // Add password if changing
      if (isChangingPassword && currentPassword && newPassword) {
        input.password = newPassword; // Backend will validate current password
      }

      // Update user profile information
      const { data } = await updateUser({
        variables: {
          id: user.id,
          input
        }
      });

      if (data?.updateUser) {
        // If we have an image to upload, do that after basic info update
        if (imageFile && previewImage) {
          const { data: uploadData } = await uploadProfilePicture({
            variables: {
              userId: user.id,
              imageData: previewImage
            }
          });

          if (uploadData?.uploadProfilePicture?.success) {
            // Update the local user data with the new profile picture
            login(localStorage.getItem('token') || '', uploadData.uploadProfilePicture.user);
            addToast(t('profile.updatedWithPicture'), 'success');
          } else {
            addToast(t('profile.updatedImageUploadFailed', { message: uploadData?.uploadProfilePicture?.message }), 'warning');
          }
        } else {
          // Just update basic info
          login(localStorage.getItem('token') || '', data.updateUser);
          addToast(t('profile.updatedSuccessfully'), 'success');
        }

        // Pass updated fields to parent so it can update context without reload
        onUpdate(data.updateUser);
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      addToast(t('profile.errorUpdating', { message: (error as Error).message }), 'error');
    }
  };

  const isLoading = updateLoading || uploadLoading || isProcessingImage;

  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 z-backdrop bg-gray-900/40 animate-backdrop-appear dark:bg-gray-950/70"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet on a phone, centred dialog from `sm` up — matching the
          shared Modal, so every dialog in the app behaves the same way. */}
      <div className="fixed inset-0 z-modal flex items-end justify-center sm:items-center sm:p-4">
        <div
          className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl animate-toast-drop dark:border-gray-800 dark:bg-gray-900 sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl sm:border"
          role="dialog"
          aria-modal="true"
          aria-label={t('profile.edit')}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>

          <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <h2 className="font-display text-base font-semibold tracking-tight text-gray-900 dark:text-white sm:text-lg">
              {t('profile.edit')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              aria-label={t('profile.cancel')}
              className="-mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <Icon name="close" size={18} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              {/* Photo */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="group relative h-28 w-28 overflow-hidden rounded-full transition-transform duration-250 ease-spring hover:scale-[1.02] active:scale-[0.99]"
                  aria-label={t('profile.changePhoto')}
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={t('profile.changePhoto')}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Avatar
                      src={user?.profilePicture}
                      firstName={user?.firstName}
                      lastName={user?.lastName}
                      size="2xl"
                      className="h-28 w-28"
                    />
                  )}

                  {isProcessingImage && (
                    <span className="absolute inset-0 flex items-center justify-center bg-gray-900/55 text-white">
                      <Spinner size={26} />
                    </span>
                  )}

                  {/* The change affordance only appears on hover/focus — a
                      permanent black caption band across a person's face is
                      the first thing you notice about the dialog otherwise. */}
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gray-900/65 py-1.5 text-[0.625rem] font-medium uppercase tracking-wide text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Icon name="upload" size={11} />
                    {t('profile.changePhoto')}
                  </span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('profile.clickToUpload')}
                </p>
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="firstName"
                  label={t('profile.firstName')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  required
                />
                <Input
                  id="lastName"
                  label={t('profile.lastName')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  required
                />
              </div>

              {/* Password */}
              <div className="rounded-lg border border-gray-200 p-3.5 dark:border-gray-700">
                <Checkbox
                  id="changePassword"
                  checked={isChangingPassword}
                  onChange={(e) => setIsChangingPassword(e.target.checked)}
                  label={t('profile.changePassword')}
                />

                {isChangingPassword && (
                  <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800 animate-slide-down">
                    <Input
                      id="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      label={t('profile.currentPassword')}
                      icon="lock"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required={isChangingPassword}
                    />
                    <Input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      label={t('profile.newPassword')}
                      icon="lock"
                      hint={t('setup.minLength')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required={isChangingPassword}
                      minLength={8}
                    />
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      label={t('profile.confirmNewPassword')}
                      icon="lock"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={
                        confirmPassword.length > 0 && confirmPassword !== newPassword
                          ? t('setup.mismatch')
                          : null
                      }
                      required={isChangingPassword}
                      minLength={8}
                    />
                  </div>
                )}
              </div>
            </div>

            <footer className="safe-bottom flex flex-col-reverse gap-2.5 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-900/60 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" onClick={onClose} disabled={isLoading}>
                {t('profile.cancel')}
              </Button>
              <Button type="submit" variant="primary" loading={isLoading}>
                {isLoading ? t('profile.saving') : t('profile.save')}
              </Button>
            </footer>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ProfileEditor; 