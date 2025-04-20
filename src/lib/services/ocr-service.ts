import { ExtractedData, ReceiptData, ReceiptItem } from '@/types/receipt'
import { getAuth } from 'firebase/auth'
// Document scanner no longer used - directly using original images for OCR
import { getApiUrl } from '@/lib/utils/api-url'

export class OCRService {
  private static readonly API_BASE = getApiUrl()

  static async processReceipt(image: File): Promise<ExtractedData> {
    console.log('Starting receipt processing for image:', image.name, 'size:', image.size);

    // Use the original image with minimal preprocessing for OCR
    // This preserves image quality while enhancing text visibility
    let processedImage = image;
    console.log('Using original image with minimal preprocessing for text extraction with EasyOCR');

    // Create a URL for the image for fallback display
    const imageUrl = URL.createObjectURL(processedImage);
    console.log('Created image URL for display');

    try {
      // Try to use the backend OCR service if available
      console.log('Preparing to send image to backend OCR service...');
      const formData = new FormData();
      formData.append('image', processedImage);

      console.log('Sending OCR request to:', `${this.API_BASE}/ocr/process-receipt`);

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('OCR request timeout reached (10s)');
        controller.abort();
      }, 10000); // 10 second timeout

      try {
        const startTime = Date.now();
        const response = await fetch(`${this.API_BASE}/ocr/process-receipt`, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        });
        const endTime = Date.now();
        console.log(`OCR request completed in ${endTime - startTime}ms`);

        // Clear the timeout
        clearTimeout(timeoutId);

        if (response.ok) {
          console.log('OCR response received, parsing JSON...');
          const data = await response.json();
          console.log('OCR processing successful:', data);

          // Store the original data for potential feedback
          // Handle both nested and flat structure from backend
          let extractedData: ExtractedData;

          if (data.store) {
            // New nested structure
            extractedData = {
              store: data.store || { name: 'Unknown Vendor', address: '' },
              date: data.date || new Date().toISOString().split('T')[0],
              time: data.time || '',
              total: data.total || { subtotal: 0, tax: 0, discount: 0, change: 0, amount: 0 },
              items: data.items && data.items.length > 0 ? data.items : [{ name: '', quantity: 1, price: 0 }],
              rawText: data.rawText || '',
              category: data.category || 'Others',
              confidence: data.confidence || 0.8,
              originalResponse: data,
              imageUrl: imageUrl
            };
          } else {
            // Legacy flat structure - convert to nested
            extractedData = {
              store: {
                name: data.vendor || 'Unknown Vendor',
                address: data.address || ''
              },
              date: data.date || new Date().toISOString().split('T')[0],
              time: data.time || '',
              total: {
                subtotal: data.subtotal || data.total || 0,
                tax: data.tax || 0,
                discount: data.discount || 0,
                change: data.change || 0,
                amount: data.total || 0
              },
              items: data.items && data.items.length > 0 ? data.items : [{ name: '', quantity: 1, price: 0 }],
              rawText: data.rawText || '',
              category: data.category || 'Others',
              confidence: data.confidence || 0.8,
              originalResponse: data,
              imageUrl: imageUrl
            };
          }

          console.log('Extracted data:', {
            store: extractedData.store,
            date: extractedData.date,
            total: extractedData.total,
            itemCount: extractedData.items.length
          });

          return extractedData;
        } else {
          console.error('OCR service returned error status:', response.status);
          const errorText = await response.text();
          console.error('Error details:', errorText);
        }
      } catch (fetchError) {
        console.warn('Backend OCR service unavailable:', fetchError);
        // Continue to client-side processing
      } finally {
        clearTimeout(timeoutId);
      }

      // If we reach here, the backend service is unavailable or returned an error
      // Use client-side OCR processing instead
      console.log('Using client-side OCR processing as fallback');
      return this.processImageLocally(processedImage, imageUrl);
    } catch (error) {
      console.error('Error in OCR service:', error);
      return this.createEmptyReceiptData(processedImage, imageUrl);
    }
  }

  /**
   * Create empty receipt data with the image URL for manual entry
   * @param image The receipt image file
   * @param imageUrl Optional pre-created image URL
   * @returns Empty receipt data with the image URL
   */
  private static createEmptyReceiptData(image: File, imageUrl?: string): ExtractedData {
    // Create a URL for the image if not provided
    const url = imageUrl || URL.createObjectURL(image)

    return {
      store: {
        name: '',
        address: ''
      },
      date: new Date().toISOString().split('T')[0],
      time: '',
      total: {
        subtotal: 0,
        tax: 0,
        discount: 0,
        change: 0,
        amount: 0
      },
      items: [
        { name: '', quantity: 1, price: 0 }
      ],
      rawText: '',
      category: 'Others',
      confidence: 0,
      imageUrl: url // Store the image URL for display
    }
  }

  // Generate mock receipt data as fallback when API fails
  private static generateMockReceiptData(): ExtractedData {
    // Generate random items
    const itemCount = Math.floor(Math.random() * 5) + 1
    const items: ReceiptItem[] = []

    for (let i = 0; i < itemCount; i++) {
      const price = parseFloat((Math.random() * 50 + 5).toFixed(2))
      const quantity = Math.floor(Math.random() * 3) + 1

      items.push({
        name: `Item ${i + 1}`,
        price,
        quantity,
        category: 'Others'
      })
    }

    // Calculate total
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = parseFloat((subtotal * 0.12).toFixed(2))
    const total = parseFloat((subtotal + tax).toFixed(2))

    // Generate random text that looks like a receipt
    const rawText = `
  STORE NAME
  123 Main Street
  City, State 12345
  Tel: (123) 456-7890

  Date: ${new Date().toLocaleDateString()}
  Time: ${new Date().toLocaleTimeString()}

  ${items.map(item => `${item.name.padEnd(20)} ${item.quantity} x $${item.price.toFixed(2)} $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

  Subtotal: $${subtotal.toFixed(2)}
  Tax (12%): $${tax.toFixed(2)}
  Total: $${total.toFixed(2)}

  Thank you for shopping with us!
    `.trim()

    return {
      store: {
        name: 'Store Name',
        address: '123 Main Street, City, State 12345'
      },
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      total: {
        subtotal: subtotal,
        tax: tax,
        discount: 0,
        change: 0,
        amount: total
      },
      items,
      rawText,
      category: 'Others',
      confidence: 0.8
    }
  }

  static async preprocessImage(imageData: string): Promise<File> {
    // Convert base64 to blob
    const base64Response = await fetch(imageData)
    const blob = await base64Response.blob()

    // Create a File object and return it directly without document scan conversion
    // This preserves the original image quality for better OCR results
    return new File([blob], 'receipt.jpg', { type: 'image/jpeg' })
  }

  /**
   * Process an image locally using client-side techniques
   * @param image The receipt image file
   * @param imageUrl The URL for the image
   * @returns Extracted receipt data
   */
  private static async processImageLocally(image: File, imageUrl: string): Promise<ExtractedData> {
    try {
      console.log('Starting local image processing');

      // Create a canvas to analyze the image
      const img = new Image();
      const canvas = document.createElement('canvas');

      // Load the image
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => {
          console.error('Failed to load image:', e);
          reject(new Error('Failed to load image'));
        };
        img.src = imageUrl;
      });

      console.log('Image loaded, dimensions:', img.width, 'x', img.height);

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0);

      // Analyze the image to extract text patterns
      // This is a simplified approach - in a real implementation, we would use a client-side OCR library

      // For now, we'll create a receipt with empty items that the user can fill in
      const items: ReceiptItem[] = [
        { name: '', quantity: 1, price: 0 },
        { name: '', quantity: 1, price: 0 },
        { name: '', quantity: 1, price: 0 }
      ];

      // Generate receipt text placeholder
      const receiptText = 'Receipt text will appear here after processing.';

      console.log('Local image processing complete');

      return {
        store: {
          name: '',
          address: ''
        },
        date: new Date().toISOString().split('T')[0],
        time: '',
        total: {
          subtotal: 0,
          tax: 0,
          discount: 0,
          change: 0,
          amount: 0
        },
        items: items,
        rawText: receiptText,
        category: 'Others',
        confidence: 0.1, // Very low confidence since this is just a placeholder
        imageUrl
      };
    } catch (error) {
      console.error('Error in local image processing:', error);
      return this.createEmptyReceiptData(image, imageUrl);
    }
  }

  static async saveReceipt(receiptData: ReceiptData): Promise<string> {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        throw new Error('User not authenticated')
      }

      // Use the provided ID or generate a new one
      const receiptId = receiptData.id || crypto.randomUUID()

      // Add user ID and timestamp if not present
      const dataToSave = {
        ...receiptData,
        id: receiptId,
        userId: receiptData.userId || auth.currentUser.uid,
        createdAt: receiptData.createdAt || new Date().toISOString(),
        category: receiptData.category || 'Others'
      }

      // Save to backend API using the new endpoint
      const response = await fetch(`${this.API_BASE}/ocr/save-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(dataToSave)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to save receipt:', response.status, errorText)
        throw new Error(`Failed to save receipt: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log('Receipt saved successfully:', data)

      return receiptId
    } catch (error) {
      console.error('Error saving receipt:', error)
      throw new Error('Failed to save receipt')
    }
  }

  /**
   * Submit feedback for a receipt to improve the model
   * @param originalData The original extracted receipt data
   * @param correctedData The corrected receipt data
   * @returns The response from the server
   */
  static async submitFeedback(originalData: ExtractedData, correctedData: ExtractedData): Promise<any> {
    try {
      const auth = getAuth()
      // Add user ID if available
      const userId = auth.currentUser?.uid || 'anonymous'

      // Prepare data for submission
      const feedbackData = {
        original_data: originalData,
        corrected_data: {
          ...correctedData,
          userId: userId
        }
      }

      // Submit feedback to the API
      const response = await fetch(`${this.API_BASE}/ocr/submit-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to submit feedback:', response.status, errorText)
        throw new Error(`Failed to submit feedback: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log('Feedback submitted successfully:', data)
      return data
    } catch (error) {
      console.error('Error submitting feedback:', error)
      throw new Error('Failed to submit feedback')
    }
  }
}


// Export types are now imported from @/types/receipt
