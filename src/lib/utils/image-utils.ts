import imageCompression from 'browser-image-compression'

interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight: number
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920
  }
): Promise<File> {
  try {
    return await imageCompression(file, options)
  } catch (error) {
    console.error('Error compressing image:', error)
    return file
  }
}