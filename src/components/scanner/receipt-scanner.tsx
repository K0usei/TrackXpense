'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Slash, X, Check, Save } from "lucide-react"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { OCRService } from '@/lib/services/ocr-service'
import { getAuth } from 'firebase/auth'
import { cn } from "@/lib/utils"
import { ReceiptData, ExtractedData } from '@/types/receipt'

interface ReceiptScannerProps {
  onScanComplete: (data: ReceiptData) => void
}

export const ReceiptScanner = ({ onScanComplete }: ReceiptScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [captures, setCaptures] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ReceiptData | null>(null)
  const [editedData, setEditedData] = useState<ReceiptData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const { toast } = useToast()
  // We'll use getAuth() directly in the processReceipt function

  useEffect(() => {
    // Try to start the camera and handle errors
    startCamera().catch(error => {
      console.error('Initial camera access failed:', error)
      const errorMessage = error.message || "Failed to access camera. Please check your permissions and try again."

      // Set camera error state for UI
      setCameraError(errorMessage)

      // Show toast notification
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive"
      })
    })

    // Cleanup function to stop the camera when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      console.log('Initializing camera...')
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Add timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Camera access timeout')), 20000)
      })

      // Try to enumerate devices first to check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')

      if (videoDevices.length === 0) {
        throw new Error('No camera detected on this device')
      }

      console.log(`Found ${videoDevices.length} camera(s)`, videoDevices)

      // Request camera permissions with more permissive options
      const cameraPromise = navigator.mediaDevices.getUserMedia({
        video: {
          // Try user-facing camera first as it might be more reliable
          facingMode: { ideal: 'user' },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      }).catch(async (initialError) => {
        console.warn('Initial camera access failed:', initialError)

        // First fallback: try with environment camera
        return navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        }).catch(async (fallbackError) => {
          console.warn('Fallback camera access failed:', fallbackError)

          // Second fallback: try with basic options
          return navigator.mediaDevices.getUserMedia({
            video: true
          })
        })
      })

      // Race between camera access and timeout
      const stream = await Promise.race([cameraPromise, timeoutPromise])

      // Store stream reference for cleanup
      streamRef.current = stream as MediaStream

      // Set video source with additional iOS compatibility
      if (videoRef.current) {
        try {
          // Clean up any existing srcObject
          if (videoRef.current.srcObject) {
            videoRef.current.srcObject = null
          }

          // Set new stream
          videoRef.current.srcObject = stream as MediaStream
          videoRef.current.setAttribute('playsinline', 'true')
          videoRef.current.setAttribute('webkit-playsinline', 'true')
          videoRef.current.muted = true // Mute to avoid feedback
          videoRef.current.volume = 0

          // Wait for video to be ready with timeout
          await Promise.race([
            new Promise<void>((resolve) => {
              if (videoRef.current) {
                videoRef.current.onloadedmetadata = () => resolve()
              }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Video loading timeout')), 8000))
          ])

          // Try to play with error handling
          try {
            await videoRef.current.play()
            console.log('Camera started successfully')
          } catch (playError) {
            console.error('Error playing video:', playError)
            throw new Error('Could not start video playback. Please check your browser settings.')
          }
        } catch (videoError) {
          console.error('Error setting up video element:', videoError)
          throw videoError
        }

        // Handle flash if available
        const videoTrack = (stream as MediaStream).getVideoTracks()[0]
        if (videoTrack) {
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

      let errorMessage = "Failed to access camera. Please try again."

      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "Camera access was denied. Please check your browser settings and ensure camera permissions are enabled for this site."
            break
          case 'NotFoundError':
            errorMessage = "No camera device was found on your device."
            break
          case 'NotReadableError':
            errorMessage = "Camera is in use by another application or encountered a hardware error."
            break
          case 'OverconstrainedError':
            errorMessage = "Could not find a camera matching the requested constraints."
            break
          case 'AbortError':
            errorMessage = "Camera access timed out. Please check your camera permissions and try again."
            break
          case 'SecurityError':
            errorMessage = "Camera access was blocked due to security restrictions. Please ensure you're accessing the site using HTTPS or localhost."
            break
        }
      }

      throw new Error(errorMessage)
    }
  }

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const capabilities = videoTrack.getCapabilities();
      // Only attempt to toggle flash if the device supports it
      if ('torch' in capabilities) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !isFlashOn }] as any
        });
        setIsFlashOn(prev => !prev);
      } else {
        toast({
          title: "Flash Unavailable",
          description: "Your device does not support flash control.",
          variant: "default"
        });
      }
    } catch (error) {
      console.warn('Flash toggle failed:', error);
      toast({
        title: "Flash Control Failed",
        description: "Unable to control the device flash.",
        variant: "default"
      });
    }
  }

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw the video to the canvas
      ctx.drawImage(videoRef.current, 0, 0)

      // Create a second canvas to flip the image horizontally to match the video feed
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return

      // Flip the image horizontally in the temp canvas
      tempCtx.translate(tempCanvas.width, 0)
      tempCtx.scale(-1, 1)
      tempCtx.drawImage(canvas, 0, 0)

      // Convert canvas to blob and then to File
      tempCanvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpeg`, { type: 'image/jpeg' })
          setCaptures(prev => [...prev, file])

          // Show feedback
          toast({
            title: "Image Captured",
            description: `Captured image ${captures.length + 1}`,
          })
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const processReceipt = async () => {
    if (captures.length === 0) return

    setIsProcessing(true)
    try {
      const auth = getAuth()
      if (!auth.currentUser) throw new Error('User not authenticated')

      // Files are already in the correct format, no need to convert
      const data: ExtractedData = await OCRService.processReceipt(captures[0]) // Only pass the first file for now

      const receiptData: ReceiptData = {
        id: crypto.randomUUID(), // Generate a unique ID
        total: data.total,
        date: data.date,
        vendor: data.vendor || 'Unknown Vendor',
        items: data.items || [],
        rawText: data.rawText || '',
        category: 'Others',
        imageUrls: []
      }

      setExtractedData(receiptData)
      setEditedData(receiptData)
      setShowPreview(true)
    } catch (error) {
      console.error('Processing failed:', error)
      toast({
        title: "Error",
        description: "Failed to process receipt. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // These functions are used in the preview UI
  const saveReceipt = () => {
    if (!editedData) return
    try {
      onScanComplete?.(editedData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save receipt.",
        variant: "destructive"
      })
    }
  }

  const resetScanner = () => {
    setCaptures([])
    setExtractedData(null)
    setEditedData(null)
    setShowPreview(false)
  }

  function removeCapture(index: number): void {
    setCaptures(prevCaptures => prevCaptures.filter((_, i) => i !== index));
  }

  // Preview and Edit Interface
  if (showPreview && extractedData && editedData) {
    return (
      <div className="fixed inset-0 bg-background p-4 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Receipt Details</h2>
            <Button
              variant="ghost"
              onClick={resetScanner}
            >
              Re-scan
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Total Amount</Label>
                <Input
                  type="number"
                  value={editedData.total}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    total: Number(e.target.value)
                  })}
                />
              </div>
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="datetime-local"
                value={editedData.date}
                onChange={(e) => setEditedData({
                  ...editedData,
                  date: e.target.value
                })}
              />
            </div>

            <Button
              className="w-full"
              onClick={saveReceipt}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Receipt
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Scanner Interface
  return (
    <div className="relative h-full flex flex-col">
      <div className="relative flex-1 bg-black">
        {cameraError ? (
          // Camera error fallback UI
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white bg-black">
            <div className="mb-4 p-4 rounded-full bg-red-500/20">
              <Camera className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Camera Access Error</h3>
            <p className="text-center mb-4 text-gray-400">{cameraError}</p>
            <Button
              variant="outline"
              onClick={() => {
                setCameraError(null);
                startCamera().catch(error => {
                  setCameraError(error.message || "Failed to access camera");
                });
              }}
            >
              Try Again
            </Button>
          </div>
        ) : (
          // Normal camera view
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover md:object-contain md:p-4"
            style={{ transform: 'scaleX(-1)' }} // Flip horizontally for front camera
          />
        )}

        {/* Multi-capture preview strip */}
        {captures.length > 0 && (
          <div className="absolute top-16 right-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto p-2 bg-black/20 backdrop-blur-sm rounded-lg">
            {captures.map((capture, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(capture)}
                  alt={`Capture ${index + 1}`}
                  className="w-20 h-28 object-cover rounded-md border-2 border-white/20"
                  style={{ transform: 'scaleX(-1)' }} // Flip horizontally to match camera view
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeCapture(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-t from-black/50 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFlash}
          className="text-white hover:bg-white/20"
        >
          <Slash className={cn(
            "h-6 w-6",
            isFlashOn ? "text-yellow-400" : "text-white"
          )} />
        </Button>

        <Button
          size="lg"
          onClick={captureImage}
          className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          <Camera className="h-6 w-6 text-white" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={processReceipt}
          disabled={captures.length === 0 || isProcessing}
          className={cn(
            "text-white hover:bg-white/20",
            captures.length > 0 ? "opacity-100" : "opacity-50"
          )}
        >
          {isProcessing ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Check className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  )
}






