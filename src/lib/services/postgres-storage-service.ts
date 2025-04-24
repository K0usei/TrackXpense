import { getAuth } from 'firebase/auth'

interface UploadResult {
  url: string;
  filename: string;
  sectionIndex: string;
}

export class PostgresStorageService {
  private static API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8000/api'

  /**
   * Upload a single receipt image section
   * @param file The image file to upload
   * @param userId The user ID
   * @param sectionIndex The index of this section in a multi-section receipt
   * @returns The URL of the uploaded file
   */
  static async uploadReceipt(file: File, userId: string, sectionIndex: number = 0): Promise<string> {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Create a safe filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const safeFileName = `receipt-section-${timestamp}.${fileExtension}`;

      // Create form data for the upload
      const formData = new FormData();
      formData.append('file', file, safeFileName);
      formData.append('userId', userId);
      formData.append('timestamp', timestamp.toString());
      formData.append('contentType', file.type || 'image/jpeg');
      formData.append('sectionIndex', sectionIndex.toString());

      console.log(`Starting upload to PostgreSQL: section ${sectionIndex}`, safeFileName);

      // Upload the file to the backend API
      const response = await fetch(`${this.API_BASE}/receipts/upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for FormData
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`Failed to upload receipt image: ${response.status} ${errorText}`);
      }

      const data = await response.json() as UploadResult;
      console.log(`Upload complete for section ${sectionIndex}, URL:`, data.url);

      // Return the URL to the uploaded file
      return data.url;
    } catch (error) {
      console.error('Upload setup failed:', error);
      throw new Error('Failed to initialize upload: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Upload multiple receipt image sections
   * @param files Array of image files to upload
   * @param userId The user ID
   * @returns Array of URLs for the uploaded files
   */
  static async uploadMultipleReceipts(files: File[], userId: string): Promise<string[]> {
    try {
      const uploadPromises = files.map((file, index) =>
        this.uploadReceipt(file, userId, index)
      );

      const urls = await Promise.all(uploadPromises);
      console.log(`Successfully uploaded ${urls.length} receipt sections`);
      return urls;
    } catch (error) {
      console.error('Failed to upload multiple receipt sections:', error);
      throw new Error('Failed to upload receipt images: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  static async getReceiptImage(imageId: string): Promise<string> {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${this.API_BASE}/receipts/image/${imageId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get receipt image:', response.status, errorText);
        throw new Error(`Failed to get receipt image: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Failed to get receipt image:', error);
      throw new Error('Failed to get receipt image: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
}
