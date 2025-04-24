'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Zap, ZapOff, X, Check, Plus, Loader2 } from "lucide-react"
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { OCRService } from '@/lib/services/ocr-service'
import { getAuth } from 'firebase/auth'
import { PostgresStorageService } from '@/lib/services/postgres-storage-service'
import { CategoryPredictor } from '@/lib/services/category-predictor'
import type { ReceiptData, ExtractedData } from '@/types/receipt'
import { ExtractedDataView } from './extracted-data-view'

interface AdvancedReceiptScannerProps {
  onScanComplete: (data: ReceiptData) => void
}

export function AdvancedReceiptScanner({ onScanComplete }: AdvancedReceiptScannerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Camera state
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Capture state
  const [capturedSections, setCapturedSections] = useState<string[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [fullscreenSection, setFullscreenSection] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [showCaptureAnimation, setShowCaptureAnimation] = useState<boolean>(false)

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanningStep, setScanningStep] = useState<'idle' | 'capturing' | 'confirming' | 'processing' | 'editing'>('capturing')

  // Result state
  const [extractedData, setExtractedData] = useState<ReceiptData | null>(null)
  const [editedData, setEditedData] = useState<ReceiptData | null>(null)
  const [tempImageFiles, setTempImageFiles] = useState<File[]>([])

  const { toast } = useToast()
  const auth = getAuth()

  // Initialize camera when component mounts
  useEffect(() => {
    // Some browsers require user interaction before accessing camera
    // We'll try to initialize immediately, but also provide a manual button
    if (scanningStep === 'capturing') {
      initializeCamera()
    }

    // Add event listener for user interaction
    const handleUserInteraction = () => {
      if (!cameraReady && !streamRef.current && scanningStep === 'capturing') {
        console.log('User interaction detected, initializing camera')
        initializeCamera()
      }
    }

    // Listen for both click and touchstart for mobile devices
    document.addEventListener('click', handleUserInteraction, { once: true })
    document.addEventListener('touchstart', handleUserInteraction, { once: true })

    return () => {
      // Clean up camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [cameraReady, scanningStep, facingMode])

  // Initialize camera with environment facing mode if available
  const initializeCamera = async () => {
    try {
      // If there's an existing stream, stop it first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      // Reset video element
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject = null
      }

      setCameraError(null)
      console.log('Initializing camera...')

      // Request camera permissions with more permissive options
      const cameraPromise = navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }).catch(async (initialError) => {
        console.warn('Initial camera access failed:', initialError)

        // First fallback: try with lower resolution
        return navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }).catch(async (fallbackError) => {
          console.warn('Fallback camera access failed:', fallbackError)

          // Second fallback: try with basic options
          return navigator.mediaDevices.getUserMedia({
            video: true
          })
        })
      })

      const stream = await cameraPromise
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera metadata loaded')
          setCameraReady(true)
        }

        try {
          console.log('Attempting to play video')
          await videoRef.current.play()
          console.log('Video playing successfully')
        } catch (playError) {
          console.error('Error playing video:', playError)
          setCameraError('Failed to start video stream. Please check your camera permissions.')
        }

        // Handle flash if available and apply constraints to prevent mirroring
        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          // Try to apply constraints to prevent mirroring
          // Note: 'mirror' is not a standard constraint but some browsers support it
          try {
            await videoTrack.applyConstraints({
              advanced: [{ mirror: false } as any]
            })
            console.log('Applied non-mirroring constraint to video track')
          } catch (constraintError) {
            console.warn('Could not apply non-mirroring constraint:', constraintError)
          }

          const capabilities = videoTrack.getCapabilities()
          if ('torch' in capabilities) {
            try {
              await videoTrack.applyConstraints({
                advanced: [{ torch: isFlashOn }] as any
              })
            } catch (flashError) {
              console.warn('Flash not supported:', flashError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Camera access error:', error)
      setCameraError('Failed to access camera. Please check your camera permissions.')
      setCameraReady(false)

      // Show a toast notification for better user feedback
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check your camera permissions.",
        variant: "destructive"
      })
    }
  }

  // Toggle flash
  const toggleFlash = async () => {
    try {
      if (!streamRef.current) return

      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities()
        if ('torch' in capabilities) {
          const newFlashState = !isFlashOn
          await videoTrack.applyConstraints({
            advanced: [{ torch: newFlashState }] as any
          })
          setIsFlashOn(newFlashState)
        } else {
          toast({
            title: "Flash not available",
            description: "Your device doesn't support flash control.",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Flash toggle error:', error)
      toast({
        title: "Flash error",
        description: "Failed to toggle flash.",
        variant: "destructive"
      })
    }
  }

  // Switch between front and rear cameras
  const switchCamera = async () => {
    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    // Toggle facing mode
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newFacingMode)

    // Re-initialize camera with new facing mode
    setCameraReady(false)
    await initializeCamera()

    toast({
      title: "Camera Switched",
      description: `Switched to ${newFacingMode === 'user' ? 'front' : 'rear'} camera`,
    })
  }

  // Capture current frame from video
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return

    // Show capture animation
    setShowCaptureAnimation(true)

    // Hide animation after a short delay
    setTimeout(() => {
      setShowCaptureAnimation(false)
    }, 500)

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Always capture in portrait orientation with 9:16 aspect ratio
    let sourceX = 0
    let sourceY = 0
    let sourceWidth = video.videoWidth
    let sourceHeight = video.videoHeight

    // Calculate dimensions for 9:16 aspect ratio
    const targetAspectRatio = 9 / 16

    if (sourceWidth / sourceHeight > targetAspectRatio) {
      // If video is wider than 9:16, crop the sides
      const newWidth = sourceHeight * targetAspectRatio
      sourceX = (sourceWidth - newWidth) / 2
      sourceWidth = newWidth
    } else {
      // If video is taller than 9:16, crop the top and bottom
      const newHeight = sourceWidth / targetAspectRatio
      sourceY = (sourceHeight - newHeight) / 2
      sourceHeight = newHeight
    }

    // Set canvas dimensions to 9:16 aspect ratio
    canvas.width = sourceWidth
    canvas.height = sourceHeight

    // Draw the video directly to the canvas
    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

    // For front camera, we need to flip the image horizontally to match the mirrored video feed
    if (facingMode === 'user') {
      // Create a second canvas to flip the image horizontally
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Flip the image horizontally in the temp canvas
      tempCtx.translate(tempCanvas.width, 0);
      tempCtx.scale(-1, 1);
      tempCtx.drawImage(canvas, 0, 0);

      // Clear the original canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Copy the flipped image back to the original canvas
      ctx.drawImage(tempCanvas, 0, 0);
    }

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)

    // Add to captured sections
    setCapturedSections(prev => [...prev, dataUrl])

    // Show confirmation if this is the first capture
    if (capturedSections.length === 0) {
      setShowConfirmation(true)
    }

    // Provide feedback
    toast({
      title: "Section captured",
      description: `Captured section ${capturedSections.length + 1} of the receipt.`,
    })
  }

  // Function to handle local storage of images if needed in the future
  // Currently not used as we're storing in PostgreSQL
  /*
  const storeImagesLocally = (images: string[]): string[] => {
    return images;
  }
  */

  // Confirm captures and start processing
  const confirmCaptures = async () => {
    if (capturedSections.length === 0) {
      toast({
        title: "No captures",
        description: "Please capture at least one section of the receipt.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setScanningStep('processing')

    try {
      // Convert data URLs to files
      const files = capturedSections.map(async (dataUrl, index) => {
        try {
          const res = await fetch(dataUrl)
          const blob = await res.blob()
          return new File([blob], `receipt-section-${index + 1}.jpg`, { type: 'image/jpeg' })
        } catch (error) {
          console.error('Error converting data URL to file:', error)
          throw new Error('Failed to process captured image')
        }
      })

      // Process with EasyOCR and XGBoost
      const resolvedFiles = await Promise.all(files)

      // Use original files with minimal preprocessing for OCR
      // This preserves image quality while enhancing text visibility
      const processedFiles = resolvedFiles
      console.log('Using original images with minimal preprocessing for text extraction with EasyOCR')

      // We'll upload images after user confirms the extracted data
      // For now, just store the files for later use

      // Process the receipt with OCR
      const data = await OCRService.processReceipt(processedFiles[0]) // Start with first file

      // If we have multiple sections, process them all and combine results
      if (processedFiles.length > 1) {
        let combinedText = data.rawText

        for (let i = 1; i < processedFiles.length; i++) {
          const additionalData = await OCRService.processReceipt(processedFiles[i])
          combinedText += '\n' + additionalData.rawText

          // Merge items if available
          if (additionalData.items && additionalData.items.length > 0) {
            data.items = [...data.items, ...additionalData.items]
          }

          // Update total if the new section has a larger total amount (likely the final total)
          if (additionalData.total.amount > data.total.amount) {
            data.total = additionalData.total
          }
        }

        data.rawText = combinedText
      }

      // Predict category using XGBoost
      try {
        const prediction = await CategoryPredictor.predictCategory(
          data.store.name || '',
          data.total.amount,
          data.store.name || ''
        )

        data.category = prediction.category
        data.confidence = prediction.confidence
      } catch (categoryError) {
        console.error('Category prediction failed:', categoryError)
        data.category = 'Others'
      }

      // Create receipt data with ID
      const receiptData: ReceiptData = {
        ...data,
        id: crypto.randomUUID(),
        imageUrls: [], // Will be populated after upload
        userId: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      }

      // Store the processed image files for later upload
      setTempImageFiles(processedFiles)

      setExtractedData(receiptData)
      setEditedData(receiptData)
      setScanningStep('editing')
    } catch (error) {
      console.error('Processing failed:', error)

      // Check if we have captured sections to create a fallback
      if (capturedSections.length > 0) {
        try {
          // Convert the first captured section to a file
          const res = await fetch(capturedSections[0])
          const blob = await res.blob()
          const file = new File([blob], `receipt-section-1.jpg`, { type: 'image/jpeg' })

          // Create a URL for the image
          const imageUrl = URL.createObjectURL(file)

          // Create empty receipt data
          const emptyData: ExtractedData = {
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
            items: [{ name: '', quantity: 1, price: 0 }],
            rawText: '',
            category: 'Others',
            confidence: 0,
            imageUrl: imageUrl
          }

          // Create receipt data with ID
          const receiptData: ReceiptData = {
            ...emptyData,
            id: crypto.randomUUID(),
            imageUrls: [], // Will be populated after upload
            userId: auth.currentUser?.uid,
            createdAt: new Date().toISOString()
          }

          // Store the file for later upload
          setTempImageFiles([file])

          setExtractedData(receiptData)
          setEditedData(receiptData)
          setScanningStep('editing')

          toast({
            title: "OCR Service Unavailable",
            description: "Please enter receipt details manually.",
            variant: "destructive"
          })

          setIsProcessing(false)
          return
        } catch (fallbackError) {
          console.error('Fallback error handling failed:', fallbackError)
        }
      }

      // If we couldn't create a fallback, show error and return to capturing
      toast({
        title: "Error",
        description: "Failed to process receipt. Please try again.",
        variant: "destructive"
      })
      setScanningStep('capturing')
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset the scanner
  const resetScanner = () => {
    // Stop current stream if it exists
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Reset all states
    setCapturedSections([])
    setShowConfirmation(false)
    setExtractedData(null)
    setEditedData(null)
    setScanningStep('capturing')
    setCameraReady(false)

    // Reinitialize camera with a slight delay to ensure DOM is updated
    setTimeout(() => {
      initializeCamera()
    }, 100)
  }

  // Note: Item editing functionality is now handled in the ExtractedDataView component

  // Save the receipt
  const saveReceipt = async () => {
    if (!editedData) return

    setIsProcessing(true)

    try {
      // Calculate total from items if available
      if (editedData.items && editedData.items.length > 0) {
        const calculatedTotal = editedData.items.reduce(
          (sum, item) => sum + (item.price * item.quantity), 0
        )

        // Update total amount if it's different
        if (Math.abs(calculatedTotal - editedData.total.amount) > 0.01) {
          editedData.total.amount = calculatedTotal

          // If subtotal is 0, use the calculated total
          if (editedData.total.subtotal === 0) {
            editedData.total.subtotal = calculatedTotal
          }
        }
      }

      // Now upload the images to PostgreSQL
      let imageUrls: string[] = []

      if (auth.currentUser && tempImageFiles.length > 0) {
        // Show upload toast
        toast({
          title: "Uploading Images",
          description: `Saving ${tempImageFiles.length} receipt section${tempImageFiles.length > 1 ? 's' : ''} to storage...`,
        })

        try {
          // Use the new method to upload multiple receipt sections
          imageUrls = await PostgresStorageService.uploadMultipleReceipts(
            tempImageFiles,
            auth.currentUser.uid
          )

          console.log(`Successfully uploaded ${imageUrls.length} of ${tempImageFiles.length} receipt sections`)
        } catch (uploadError) {
          console.error('Failed to upload receipt images:', uploadError)
          toast({
            title: "Image Upload Warning",
            description: "Some receipt images could not be uploaded. The receipt data will still be saved.",
            variant: "destructive"
          })
        }

        // Update the receipt data with image URLs
        editedData.imageUrls = imageUrls
      }

      // Save the receipt data to create both Receipt and Expense records
      onScanComplete(editedData)

      toast({
        title: "Receipt Saved",
        description: `Your receipt has been successfully processed and saved with ${imageUrls.length} image${imageUrls.length !== 1 ? 's' : ''}.`,
      })
    } catch (error) {
      console.error('Error saving receipt:', error)
      toast({
        title: "Error",
        description: "Failed to save receipt. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Render different UI based on scanning step
  const renderScanningStep = () => {
    switch (scanningStep) {
      case 'capturing':
        return (
          <div className="relative flex-1 bg-black overflow-hidden">
            {/* Scanning animation overlay - only show when not viewing captured sections */}
            {!showConfirmation && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/15 to-transparent h-full w-full animate-scan"></div>
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-500/70 animate-scanline shadow-md shadow-blue-500/50"></div>
              </div>
            )}

            {/* Capture animation */}
            {showCaptureAnimation && (
              <div className="absolute inset-0 bg-white/30 z-20 animate-flash pointer-events-none">
                <div className="absolute inset-0 border-4 border-white animate-capture-border"></div>
              </div>
            )}
            {/* Video feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }} // Flip horizontally for front camera
            />

            {/* Canvas for capturing (hidden) */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera error message or not ready state */}
            {(cameraError || !cameraReady) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center">
                <div>
                  {cameraError ? (
                    <>
                      <p className="mb-4">{cameraError}</p>
                      <Button onClick={initializeCamera}>Retry Camera Access</Button>
                    </>
                  ) : (
                    <>
                      <p className="mb-4">Camera initializing...</p>
                      <Button onClick={initializeCamera}>Start Camera Manually</Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Capture confirmation overlay */}
            {showConfirmation && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white p-4">
                <div className="max-w-md w-full bg-background/20 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-xl max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4 text-center">Receipt Sections</h3>

                  <div className="flex flex-col items-center justify-center gap-4 mb-6">
                    {capturedSections.map((section, index) => (
                      <div
                        key={index}
                        className="relative w-full max-w-[180px] md:max-w-[240px] aspect-[9/16] bg-gray-800/80 rounded-lg overflow-hidden shadow-md border border-white/10 group hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
                        onClick={() => setFullscreenSection(section)}
                      >
                        <img
                          src={section}
                          alt={`Receipt section ${index + 1}`}
                          className="w-full h-full object-contain"
                        // No need to flip the image here as it's already been flipped during capture if needed
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs p-2 font-medium text-center">
                          Section {index + 1}
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 rounded-full transition-opacity duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newSections = [...capturedSections];
                            newSections.splice(index, 1);
                            setCapturedSections(newSections);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Recapture button */}
                    {capturedSections.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCapturedSections([]);
                          setShowConfirmation(false);
                        }}
                        className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 w-full mb-2"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Recapture All
                      </Button>
                    )}

                    <div className="flex justify-between gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowConfirmation(false)
                        }}
                        className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white flex-1"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add More
                      </Button>

                      <Button
                        onClick={confirmCaptures}
                        disabled={capturedSections.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Process Receipt
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Camera controls - hide when showing confirmation */}
            <div className={`absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 transition-all duration-300 ${showConfirmation ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100'}`}>
              {/* Flash toggle */}
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-full bg-black/30 border-white/30 text-white hover:bg-black/50"
                onClick={toggleFlash}
              >
                {isFlashOn ? (
                  <Zap className="h-5 w-5" />
                ) : (
                  <ZapOff className="h-5 w-5" />
                )}
              </Button>

              {/* Capture button - in the middle */}
              <Button
                variant="default"
                size="icon"
                className="w-16 h-16 rounded-full bg-white text-blue-600 hover:bg-gray-100 shadow-md"
                onClick={captureFrame}
                disabled={!cameraReady}
              >
                <Camera className="h-7 w-7" />
              </Button>

              {/* Switch camera button */}
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-full bg-black/30 border-white/30 text-white hover:bg-black/50"
                onClick={switchCamera}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </Button>

              {/* Done button - absolute positioned at bottom right */}
              {capturedSections.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-6 w-10 h-10 rounded-full bg-blue-600 border-white/30 text-white hover:bg-blue-700 shadow-md transition-all duration-200"
                  onClick={() => setShowConfirmation(true)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )

      case 'processing':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-500/20 to-blue-500/5">
            <div className="text-center bg-background/80 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-input/20 max-w-md relative overflow-hidden">

              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary relative z-10" />
              </div>
              <h3 className="text-xl font-bold mb-3">Processing Receipt</h3>
              <p className="text-muted-foreground mb-2">
                Extracting information using OCR and analyzing categories...
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span>This may take a few moments</span>
              </div>
              <div className="w-full bg-background/50 h-2 rounded-full mt-6 overflow-hidden">
                <div className="bg-primary h-full animate-progress"></div>
              </div>
            </div>
          </div>
        )

      case 'editing':
        if (!editedData || capturedSections.length === 0) return null

        return (
          <ExtractedDataView
            data={editedData}
            scannedImageUrl={capturedSections[0]}
            additionalImages={capturedSections.slice(1)} // Pass additional images
            onSave={saveReceipt}
            onRescan={resetScanner}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      {renderScanningStep()}

      {/* Fullscreen section view */}
      {fullscreenSection && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => {
            setFullscreenSection(null);
            setZoomLevel(1); // Reset zoom when closing
          }}
        >
          <div
            className="relative max-w-md w-full max-h-[90vh] overflow-hidden aspect-[9/16] bg-gray-900/80 rounded-lg"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image container
          >
            <div className="overflow-auto h-full w-full">
              <img
                src={fullscreenSection}
                alt="Receipt section"
                className="w-full h-full object-contain transition-transform duration-200 ease-in-out"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }} // No need to flip as it's already flipped during capture
              />
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full p-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-black/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel(Math.max(0.5, zoomLevel - 0.25));
                }}
                disabled={zoomLevel <= 0.5}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </Button>

              <span className="text-white text-xs font-medium">{Math.round(zoomLevel * 100)}%</span>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-black/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel(Math.min(3, zoomLevel + 0.25));
                }}
                disabled={zoomLevel >= 3}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-black/30 ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel(1); // Reset zoom
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </Button>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenSection(null);
                setZoomLevel(1); // Reset zoom when closing
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
