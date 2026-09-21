import React, { useState, useRef, ChangeEvent } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Alert, Button, Icon } from '../ui';

// GraphQL mutation for file uploads
const UPLOAD_FILE = gql`
  mutation UploadFile($file: String!, $type: UploadType!, $id: ID!) {
    uploadFile(file: $file, type: $type, id: $id) {
      success
      message
      url
      user {
        id
        profilePicture
      }
      book {
        id
        coverImage
      }
    }
  }
`;

type UploadType = 'PROFILE_PICTURE' | 'BOOK_COVER';

interface FileUploadProps {
  entityId: string;
  uploadType: UploadType;
  currentImageUrl?: string;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  buttonLabel?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  entityId,
  uploadType,
  currentImageUrl,
  onUploadSuccess,
  onUploadError,
  className = '',
  buttonLabel = 'Upload Image'
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadFile] = useMutation(UPLOAD_FILE);

  const optimizeImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }

        const img = new Image();
        img.src = event.target.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Calculate dimensions based on upload type
          let maxWidth = 800;
          let maxHeight = 800;
          
          if (uploadType === 'PROFILE_PICTURE') {
            maxWidth = 500;
            maxHeight = 500;
          } else if (uploadType === 'BOOK_COVER') {
            maxWidth = 800;
            maxHeight = 1200;
          }
          
          let width = img.width;
          let height = img.height;
          
          // Resize image while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * (maxWidth / width));
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * (maxHeight / height));
              height = maxHeight;
            }
          }
          
          // Set canvas size and draw resized image
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with reduced quality
          const quality = 0.8; // 80% quality
          const optimizedImageData = canvas.toDataURL('image/jpeg', quality);
          
          resolve(optimizedImageData);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
      const errorMsg = 'Please select a valid image file (JPEG, PNG, GIF, WebP)';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'Image size should be less than 5MB';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // Clear previous errors
    setError(null);
    setIsUploading(true);

    try {
      // Optimize the image before uploading
      const optimizedImageData = await optimizeImage(file);
      
      // Show preview
      setPreviewUrl(optimizedImageData);
      
      // Upload to server
      const { data } = await uploadFile({
        variables: {
          file: optimizedImageData,
          type: uploadType,
          id: entityId
        }
      });

      if (data?.uploadFile?.success) {
        if (onUploadSuccess && data.uploadFile.url) {
          onUploadSuccess(data.uploadFile.url);
        }
      } else {
        const errorMsg = data?.uploadFile?.message || 'Upload failed';
        setError(errorMsg);
        if (onUploadError) onUploadError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`file-upload ${className}`}>
      {/*
        Preview and control sit side by side rather than stacked: the preview
        used to stretch to `max-w-xs`, which inside a modal column pushed the
        upload button a screenful below the field it belongs to.
      */}
      <div className="flex items-start gap-3">
        {(previewUrl || currentImageUrl) && (
          <img
            src={previewUrl || currentImageUrl}
            alt="Preview"
            className="h-20 w-20 shrink-0 rounded-lg border border-gray-200 object-cover shadow-xs dark:border-gray-700"
          />
        )}

        <div className="min-w-0 flex-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
          />

          <Button
            type="button"
            variant="secondary"
            icon="upload"
            onClick={triggerFileInput}
            loading={isUploading}
          >
            {isUploading ? 'Uploading' : buttonLabel}
          </Button>

          {/* State the limits up front. Both of these are enforced below, and
              finding out after a failed upload is the slow way to learn them. */}
          <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Icon name="info" size={12} className="shrink-0" />
            JPEG, PNG, GIF or WebP · up to 5MB
          </p>
        </div>
      </div>

      {error && <Alert tone="danger" className="mt-3">{error}</Alert>}
    </div>
  );
};

export default FileUpload; 