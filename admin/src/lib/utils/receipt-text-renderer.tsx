/**
 * Utility functions for rendering receipt text as a computerized image
 */
import React from 'react';

/**
 * Generate a data URL for a computerized text image from raw receipt text
 * @param rawText The raw text from the receipt
 * @param options Optional rendering options
 * @returns A data URL for the rendered image
 */
export function generateComputerizedTextImage(
  rawText: string,
  options: {
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    padding?: number;
    backgroundColor?: string;
    textColor?: string;
    width?: number;
    maxHeight?: number;
  } = {}
): string {
  // Default options
  const {
    fontFamily = 'Courier New, monospace',
    fontSize = 14,
    lineHeight = 1.2,
    padding = 20,
    backgroundColor = '#ffffff',
    textColor = '#000000',
    width = 400,
    maxHeight = 800
  } = options;

  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context');
    return '';
  }

  // Set canvas dimensions
  canvas.width = width;
  
  // Set font properties
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'top';
  
  // Split text into lines
  const lines = rawText.split('\n');
  
  // Calculate total height
  const lineHeightPx = fontSize * lineHeight;
  const totalHeight = Math.min(maxHeight, lines.length * lineHeightPx + padding * 2);
  canvas.height = totalHeight;
  
  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Reset fill style for text
  ctx.fillStyle = textColor;
  
  // Draw text lines
  lines.forEach((line, index) => {
    const y = padding + index * lineHeightPx;
    // Only draw lines that are visible in the canvas
    if (y < totalHeight - padding) {
      ctx.fillText(line, padding, y);
    }
  });
  
  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
}

/**
 * Create a computerized text element from raw receipt text
 * @param rawText The raw text from the receipt
 * @param options Optional rendering options
 * @returns A React element with the rendered text
 */
export function createComputerizedTextElement(
  rawText: string,
  options: {
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    padding?: number;
    backgroundColor?: string;
    textColor?: string;
  } = {}
): JSX.Element {
  // Default options
  const {
    fontFamily = 'Courier New, monospace',
    fontSize = 14,
    lineHeight = 1.5,
    padding = 20,
    backgroundColor = '#ffffff',
    textColor = '#000000'
  } = options;
  
  // Split text into lines
  const lines = rawText.split('\n');
  
  return (
    <div 
      style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight,
        padding: `${padding}px`,
        backgroundColor,
        color: textColor,
        whiteSpace: 'pre-wrap',
        overflowY: 'auto',
        maxHeight: '100%',
        border: '1px solid #ddd',
        borderRadius: '4px'
      }}
    >
      {lines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  );
}
