import { storage } from '@/lib/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

export class StorageService {
  static async uploadReceipt(file: File, userId: string): Promise<string> {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Create a safe filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const safeFileName = `receipt-section-${timestamp}.${fileExtension}`;
      const path = `receipts/${auth.currentUser.uid}/${timestamp}_${safeFileName}`;
      const storageRef = ref(storage, path);

      // Set correct content type and metadata
      const metadata = {
        contentType: file.type || 'image/jpeg',
        customMetadata: {
          'uploadedBy': auth.currentUser.uid,
          'uploadedAt': new Date().toISOString()
        },
        // Add Cache-Control header to help with CORS
        cacheControl: 'public,max-age=300'
      };

      // Use uploadBytesResumable for better error handling and progress tracking
      console.log('Starting upload to Firebase Storage:', path);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      // Return a promise that resolves with the download URL when complete
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          // Progress observer
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload progress:', Math.round(progress) + '%');
          },
          // Error observer
          (error) => {
            console.error('Upload error:', error);
            // Log more detailed information about the error
            if (error.serverResponse) {
              console.error('Server response:', error.serverResponse);
            }
            if (error.code) {
              console.error('Error code:', error.code);

              // Handle specific error codes
              switch (error.code) {
                case 'storage/unauthorized':
                  reject(new Error('You do not have permission to upload files. Please check your authentication.'));
                  break;
                case 'storage/canceled':
                  reject(new Error('Upload was canceled.'));
                  break;
                case 'storage/unknown':
                  reject(new Error('An unknown error occurred. Please try again later.'));
                  break;
                default:
                  reject(new Error('Failed to upload receipt image: ' + error.message));
              }
            } else {
              reject(new Error('Failed to upload receipt image: ' + error.message));
            }
          },
          // Completion observer
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Upload complete, URL:', downloadUrl);
              resolve(downloadUrl);
            } catch (urlError) {
              console.error('Error getting download URL:', urlError);
              reject(new Error('Failed to get download URL'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Upload setup failed:', error);
      throw new Error('Failed to initialize upload: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
}
