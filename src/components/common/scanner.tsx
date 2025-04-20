'use client'

import React, { useRef, useState } from 'react'
import Webcam from 'react-webcam'
import Image from 'next/image'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Loader2, CameraIcon, SwitchCamera } from 'lucide-react'
import { OCRService } from '@/lib/services/ocr-service'
import { useToast } from '@/components/ui/use-toast'
import type { ExtractedData } from '@/types/receipt'
import { cn } from '@/lib/utils'

interface ScannerProps {
    onScanComplete: (data: ExtractedData) => void
    className?: string
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete, className }) => {
    const webcamRef = useRef<Webcam | null>(null)
    const [image, setImage] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [ocrText, setOcrText] = useState<string>('')
    const [useBackCamera, setUseBackCamera] = useState<boolean>(true)
    const { toast } = useToast()

    const videoConstraints = {
        width: 720,
        height: 720,
        facingMode: useBackCamera ? 'environment' : 'user',
    }

    const captureImage = () => {
        if (!webcamRef.current) return

        // Get the screenshot from webcam
        const imageSrc = webcamRef.current.getScreenshot()

        // If using front camera, we need to flip the image
        if (!useBackCamera && imageSrc) {
            // We'll flip the image when displaying it with the style transform
            // The actual image data doesn't need to be modified
        }

        setImage(imageSrc)
    }

    const handleScanReceipt = async () => {
        if (!image) return

        setLoading(true)
        setError('')

        try {
            // Convert the image to a file with minimal preprocessing
            const imageFile = await OCRService.preprocessImage(image) // This applies minimal preprocessing to enhance text visibility

            // Process the receipt
            const data = await OCRService.processReceipt(imageFile)

            setOcrText(data.rawText)
            onScanComplete(data)

            toast({
                title: "Success",
                description: "Receipt processed successfully",
            })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process receipt'
            setError(errorMessage)
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className={cn(
            "p-4 mx-auto", // Center the card
            "w-full md:w-[640px]", // Full width on mobile, fixed width on desktop
            "h-auto", // Auto height
            className
        )}>
            <div className="space-y-4">
                <div className="relative aspect-[3/4] md:aspect-square w-full">
                    <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="absolute inset-0 w-full h-full rounded-lg object-cover"
                        style={{ transform: !useBackCamera ? 'scaleX(-1)' : 'scaleX(1)' }} // Flip horizontally for front camera
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <Button
                            size="icon"
                            variant="outline"
                            className="bg-black/20 hover:bg-black/40 backdrop-blur-sm border-white/10"
                            onClick={() => setUseBackCamera(!useBackCamera)}
                        >
                            <SwitchCamera className="h-4 w-4 text-white" />
                        </Button>
                        <Button
                            size="icon"
                            variant="outline"
                            className="bg-black/20 hover:bg-black/40 backdrop-blur-sm border-white/10"
                            onClick={captureImage}
                        >
                            <CameraIcon className="h-4 w-4 text-white" />
                        </Button>
                    </div>
                </div>

                {image && (
                    <div className="space-y-4">
                        <Button
                            onClick={handleScanReceipt}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Processing...' : 'Scan Receipt'}
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative aspect-[3/4] w-full">
                                <Image
                                    src={image}
                                    alt="Captured Receipt"
                                    fill
                                    className="rounded-lg object-cover"
                                    style={{ transform: !useBackCamera ? 'scaleX(-1)' : 'scaleX(1)' }} // Flip horizontally to match camera view
                                />
                            </div>

                            {ocrText && (
                                <div className="h-full">
                                    <h3 className="font-semibold mb-2">Extracted Text:</h3>
                                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto h-[calc(100%-2rem)]">
                                        {ocrText}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="text-destructive text-sm">{error}</div>
                )}
            </div>
        </Card>
    )
}

export default Scanner
