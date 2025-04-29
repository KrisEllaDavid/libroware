import React, { useState, useRef, ChangeEvent } from 'react';
import { useMutation, gql } from '@apollo/client';

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
      {previewUrl && (
        <div className="preview-container mb-3">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="preview-image w-full max-w-xs rounded-md shadow-sm" 
          />
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />
      
      <button
        type="button"
        onClick={triggerFileInput}
        disabled={isUploading}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {buttonLabel}
          </>
        )}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
};

export default FileUpload; 