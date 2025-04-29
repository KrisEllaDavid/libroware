import React, { useState, useRef, ChangeEvent } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_USER, UPLOAD_PROFILE_PICTURE } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import imageCompression from 'browser-image-compression';

interface ProfileEditorProps {
  onClose: () => void;
  onUpdate: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ onClose, onUpdate }) => {
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
      addToast('Error processing image', 'error');
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
      addToast('User not authenticated', 'error');
      return;
    }

    // Validate password if changing
    if (isChangingPassword) {
      if (!currentPassword) {
        addToast('Current password is required', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        addToast('New passwords do not match', 'error');
        return;
      }

      if (newPassword.length < 8) {
        addToast('Password must be at least 8 characters', 'error');
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
            addToast('Profile updated with new picture', 'success');
          } else {
            addToast(`Profile updated but image upload failed: ${uploadData?.uploadProfilePicture?.message}`, 'warning');
          }
        } else {
          // Just update basic info
          login(localStorage.getItem('token') || '', data.updateUser);
          addToast('Profile updated successfully', 'success');
        }

        // Call onUpdate callback to refresh parent component
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      addToast(`Error updating profile: ${(error as Error).message}`, 'error');
    }
  };

  const isLoading = updateLoading || uploadLoading || isProcessingImage;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Edit Profile</h2>

        <form onSubmit={handleSubmit}>
          {/* Profile Image */}
          <div className="mb-6 flex flex-col items-center">
            <div
              className="relative w-32 h-32 mb-2 cursor-pointer overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 hover:opacity-90 transition-opacity"
              onClick={triggerFileInput}
            >
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-semibold text-gray-400 dark:text-gray-500">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}

              {isProcessingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              )}

              <div className="absolute bottom-0 inset-x-0 bg-black bg-opacity-60 text-white text-xs text-center py-1">
                Change Photo
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Click the image to upload a new profile picture
            </span>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Password Change Toggle */}
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="changePassword"
                checked={isChangingPassword}
                onChange={(e) => setIsChangingPassword(e.target.checked)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="changePassword" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Change Password
              </label>
            </div>
          </div>

          {/* Password Fields */}
          {isChangingPassword && (
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  required={isChangingPassword}
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  required={isChangingPassword}
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  required={isChangingPassword}
                  minLength={8}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditor; 