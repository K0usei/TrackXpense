/**
 * Utility functions for document scanning and image processing
 */

/**
 * Removes horizontal, vertical, and diagonal lines from an image
 * @param imageData The image data
 * @param width Image width
 * @param height Image height
 * @returns New ImageData with lines removed
 */
function removeLines(imageData: ImageData, width: number, height: number): ImageData {
  const data = imageData.data;
  const result = new Uint8ClampedArray(data.length);

  // Copy the original data
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i];
  }

  // Parameters for line detection
  const minLineLength = Math.min(width, height) * 0.08; // Minimum length to be considered a line
  const maxLineThickness = 8; // Maximum thickness of lines to remove
  const blackThreshold = 120; // Threshold for black pixels

  // Create a binary map of the image for line detection
  const binaryMap = new Array(width * height).fill(false);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isBlack = (data[idx] + data[idx + 1] + data[idx + 2]) / 3 < blackThreshold;
      binaryMap[y * width + x] = isBlack;
    }
  }

  // Detect and remove horizontal lines
  for (let y = 0; y < height; y++) {
    let lineStart = -1;
    let lineLength = 0;
    let lineThickness = 0;

    // Scan each row for horizontal lines
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isBlack = (data[idx] + data[idx + 1] + data[idx + 2]) / 3 < blackThreshold;

      if (isBlack) {
        // Check if this is part of a line
        if (lineStart === -1) {
          lineStart = x;
          lineLength = 1;

          // Check line thickness (scan down)
          lineThickness = 1;
          for (let ty = y + 1; ty < Math.min(y + maxLineThickness, height); ty++) {
            const tyIdx = (ty * width + x) * 4;
            if ((data[tyIdx] + data[tyIdx + 1] + data[tyIdx + 2]) / 3 < blackThreshold) {
              lineThickness++;
            } else {
              break;
            }
          }
        } else {
          lineLength++;
        }
      } else if (lineStart !== -1) {
        // End of a potential line
        if (lineLength >= minLineLength && lineThickness <= maxLineThickness) {
          // This is a line - remove it by setting pixels to white
          for (let lx = lineStart; lx < x; lx++) {
            for (let ly = y; ly < Math.min(y + lineThickness, height); ly++) {
              const lIdx = (ly * width + lx) * 4;
              result[lIdx] = 255;     // R
              result[lIdx + 1] = 255; // G
              result[lIdx + 2] = 255; // B
              // Alpha remains unchanged
            }
          }
        }

        // Reset line detection
        lineStart = -1;
        lineLength = 0;
        lineThickness = 0;
      }
    }

    // Check if line extends to the edge
    if (lineStart !== -1 && lineLength >= minLineLength && lineThickness <= maxLineThickness) {
      // Remove the line
      for (let lx = lineStart; lx < width; lx++) {
        for (let ly = y; ly < Math.min(y + lineThickness, height); ly++) {
          const lIdx = (ly * width + lx) * 4;
          result[lIdx] = 255;     // R
          result[lIdx + 1] = 255; // G
          result[lIdx + 2] = 255; // B
          // Alpha remains unchanged
        }
      }
    }
  }

  // Detect and remove vertical lines
  for (let x = 0; x < width; x++) {
    let lineStart = -1;
    let lineLength = 0;
    let lineThickness = 0;

    // Scan each column for vertical lines
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const isBlack = (result[idx] + result[idx + 1] + result[idx + 2]) / 3 < blackThreshold;

      if (isBlack) {
        // Check if this is part of a line
        if (lineStart === -1) {
          lineStart = y;
          lineLength = 1;

          // Check line thickness (scan right)
          lineThickness = 1;
          for (let tx = x + 1; tx < Math.min(x + maxLineThickness, width); tx++) {
            const txIdx = (y * width + tx) * 4;
            if ((data[txIdx] + data[txIdx + 1] + data[txIdx + 2]) / 3 < blackThreshold) {
              lineThickness++;
            } else {
              break;
            }
          }
        } else {
          lineLength++;
        }
      } else if (lineStart !== -1) {
        // End of a potential line
        if (lineLength >= minLineLength && lineThickness <= maxLineThickness) {
          // This is a line - remove it by setting pixels to white
          for (let ly = lineStart; ly < y; ly++) {
            for (let lx = x; lx < Math.min(x + lineThickness, width); lx++) {
              const lIdx = (ly * width + lx) * 4;
              result[lIdx] = 255;     // R
              result[lIdx + 1] = 255; // G
              result[lIdx + 2] = 255; // B
              // Alpha remains unchanged
            }
          }
        }

        // Reset line detection
        lineStart = -1;
        lineLength = 0;
        lineThickness = 0;
      }
    }

    // Check if line extends to the edge
    if (lineStart !== -1 && lineLength >= minLineLength && lineThickness <= maxLineThickness) {
      // Remove the line
      for (let ly = lineStart; ly < height; ly++) {
        for (let lx = x; lx < Math.min(x + lineThickness, width); lx++) {
          const lIdx = (ly * width + lx) * 4;
          result[lIdx] = 255;     // R
          result[lIdx + 1] = 255; // G
          result[lIdx + 2] = 255; // B
          // Alpha remains unchanged
        }
      }
    }
  }

  // Detect and remove diagonal lines (45 degrees)
  console.log('Detecting diagonal lines...');

  // Directions for diagonal line detection: 45° and 135°
  const directions = [
    { dx: 1, dy: 1 },   // 45° (down-right)
    { dx: 1, dy: -1 },  // 135° (up-right)
  ];

  // Create a map to track pixels that have been identified as part of diagonal lines
  const diagonalLineMap = new Array(width * height).fill(false);

  // For each direction, scan the image for diagonal lines
  for (const dir of directions) {
    const { dx, dy } = dir;

    // Start points for diagonal scanning
    const startPoints: { x: number, y: number }[] = [];

    // Add all points along the left and top edges as start points
    for (let y = 0; y < height; y++) {
      startPoints.push({ x: 0, y });
    }
    for (let x = 1; x < width; x++) { // Start from 1 to avoid duplicate corner
      startPoints.push({ x, y: 0 });
    }

    // For each start point, follow the diagonal and check for lines
    for (const start of startPoints) {
      let x = start.x;
      let y = start.y;
      let linePoints: { x: number, y: number }[] = [];

      // Follow the diagonal path
      while (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const isBlack = (result[idx] + result[idx + 1] + result[idx + 2]) / 3 < blackThreshold;

        if (isBlack) {
          // Add this point to the current line
          linePoints.push({ x, y });
        } else if (linePoints.length > 0) {
          // End of a potential line - check if it's long enough
          if (linePoints.length >= minLineLength) {
            // Check if this is a line by verifying its straightness
            let isLine = true;

            // Check thickness perpendicular to the line direction
            for (const point of linePoints) {
              // Check perpendicular thickness
              let perpThickness = 1;
              let px = point.x - dy; // Perpendicular direction
              let py = point.y + dx;

              while (px >= 0 && px < width && py >= 0 && py < height && perpThickness < maxLineThickness) {
                const pIdx = (py * width + px) * 4;
                if ((result[pIdx] + result[pIdx + 1] + result[pIdx + 2]) / 3 < blackThreshold) {
                  perpThickness++;
                  px -= dy;
                  py += dx;
                } else {
                  break;
                }
              }

              // If any point is too thick, it's not a clean line
              if (perpThickness > maxLineThickness) {
                isLine = false;
                break;
              }
            }

            // If it's a valid line, mark all its pixels for removal
            if (isLine) {
              for (const point of linePoints) {
                // Mark this point and its perpendicular thickness
                for (let t = 0; t < maxLineThickness; t++) {
                  const tx = point.x - t * dy;
                  const ty = point.y + t * dx;

                  if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
                    diagonalLineMap[ty * width + tx] = true;
                  }
                }
              }
            }
          }

          // Reset line detection
          linePoints = [];
        }

        // Move to the next point in the diagonal
        x += dx;
        y += dy;
      }

      // Check if a line extends to the edge
      if (linePoints.length >= minLineLength) {
        // Same checks as above for edge lines
        let isLine = true;

        for (const point of linePoints) {
          let perpThickness = 1;
          let px = point.x - dy;
          let py = point.y + dx;

          while (px >= 0 && px < width && py >= 0 && py < height && perpThickness < maxLineThickness) {
            const pIdx = (py * width + px) * 4;
            if ((result[pIdx] + result[pIdx + 1] + result[pIdx + 2]) / 3 < blackThreshold) {
              perpThickness++;
              px -= dy;
              py += dx;
            } else {
              break;
            }
          }

          if (perpThickness > maxLineThickness) {
            isLine = false;
            break;
          }
        }

        if (isLine) {
          for (const point of linePoints) {
            for (let t = 0; t < maxLineThickness; t++) {
              const tx = point.x - t * dy;
              const ty = point.y + t * dx;

              if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
                diagonalLineMap[ty * width + tx] = true;
              }
            }
          }
        }
      }
    }
  }

  // Remove all diagonal lines by setting marked pixels to white
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (diagonalLineMap[y * width + x]) {
        const idx = (y * width + x) * 4;
        result[idx] = 255;     // R
        result[idx + 1] = 255; // G
        result[idx + 2] = 255; // B
        // Alpha remains unchanged
      }
    }
  }

  console.log('Line removal complete');
  return new ImageData(result, width, height);
}

/**
 * Detects the skew angle of an image using Hough transform (simplified)
 * @param imageData The image data
 * @param width Image width
 * @param height Image height
 * @returns The detected skew angle in degrees
 */
function detectSkewAngle(imageData: ImageData, width: number, height: number): number {
  const data = imageData.data;
  const binaryThreshold = 150; // Threshold for black/white

  // Sample points to reduce computation (every 3rd pixel for better accuracy)
  const sampleStep = 3;

  // Accumulator for angles (-45 to 45 degrees with 0.25 degree steps for better precision)
  // Expanded range to detect larger angles for proper 90-degree alignment
  const angleRange = 45;
  const angleStep = 0.25;
  const angleCount = Math.floor(angleRange * 2 / angleStep) + 1;
  const accumulator = new Array(angleCount).fill(0);

  // For each row, find the leftmost and rightmost black pixel
  const rowEdges: { left: number, right: number, y: number }[] = [];

  // Sample rows to find text lines
  for (let y = 0; y < height; y += sampleStep) {
    let leftEdge = -1;
    let rightEdge = -1;
    let blackPixelCount = 0;

    // Find left and right edges of text in this row
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isBlack = (data[idx] + data[idx + 1] + data[idx + 2]) / 3 < binaryThreshold;

      if (isBlack) {
        blackPixelCount++;
        if (leftEdge === -1) leftEdge = x;
        rightEdge = x;
      }
    }

    // If we found a text line (both edges) with enough black pixels
    // and the line is long enough (at least 10% of the width)
    if (leftEdge !== -1 && rightEdge !== -1 &&
      (rightEdge - leftEdge) > width * 0.1 &&
      blackPixelCount > (rightEdge - leftEdge) * 0.3) { // At least 30% of pixels in the line are black
      rowEdges.push({ left: leftEdge, right: rightEdge, y });
    }
  }

  console.log(`Found ${rowEdges.length} text lines for skew detection`);

  // If we don't have enough text lines, return 0 (no skew)
  if (rowEdges.length < 3) {
    console.log('Not enough text lines for skew detection, assuming no skew');
    return 0;
  }

  // Sort rows by y position to ensure we're comparing adjacent lines
  rowEdges.sort((a, b) => a.y - b.y);

  // Calculate the angle for each pair of rows
  for (let i = 0; i < rowEdges.length - 1; i++) {
    // Only compare with the next few rows to focus on adjacent lines
    const maxJ = Math.min(i + 5, rowEdges.length - 1);
    for (let j = i + 1; j <= maxJ; j++) {
      // Calculate angle between left edges
      const dy = rowEdges[j].y - rowEdges[i].y;
      const dx = rowEdges[j].left - rowEdges[i].left;

      if (dx !== 0 && dy > 0) {
        const angle = Math.atan(dx / dy) * 180 / Math.PI;

        // Only consider angles within our range
        if (Math.abs(angle) <= angleRange) {
          // Convert angle to index in accumulator
          const angleIndex = Math.floor((angle + angleRange) / angleStep);
          if (angleIndex >= 0 && angleIndex < accumulator.length) {
            // Weight by the length of the lines
            const weight = Math.min(rowEdges[i].right - rowEdges[i].left, rowEdges[j].right - rowEdges[j].left) / width;
            accumulator[angleIndex] += weight;
          }
        }
      }

      // Also calculate angle between right edges
      const dxRight = rowEdges[j].right - rowEdges[i].right;
      if (dxRight !== 0 && dy > 0) {
        const angleRight = Math.atan(dxRight / dy) * 180 / Math.PI;

        if (Math.abs(angleRight) <= angleRange) {
          const angleIndexRight = Math.floor((angleRight + angleRange) / angleStep);
          if (angleIndexRight >= 0 && angleIndexRight < accumulator.length) {
            const weight = Math.min(rowEdges[i].right - rowEdges[i].left, rowEdges[j].right - rowEdges[j].left) / width;
            accumulator[angleIndexRight] += weight;
          }
        }
      }
    }
  }

  // Find the angle with the most votes
  let maxVotes = 0;
  let maxAngleIndex = Math.floor(angleCount / 2); // Default to 0 degrees

  for (let i = 0; i < accumulator.length; i++) {
    if (accumulator[i] > maxVotes) {
      maxVotes = accumulator[i];
      maxAngleIndex = i;
    }
  }

  // Convert back to angle
  let skewAngle = (maxAngleIndex * angleStep) - angleRange;

  // Check for angles close to 90 degrees (or -90 degrees)
  // If the angle is close to 90 or -90, it means the document is sideways
  // We'll adjust it to be exactly 90 or -90 for proper rotation
  if (Math.abs(Math.abs(skewAngle) - 90) < 10) {
    // Round to exactly 90 or -90 degrees
    skewAngle = skewAngle > 0 ? 90 : -90;
    console.log('Document appears to be sideways, setting angle to exactly', skewAngle, 'degrees');
    return skewAngle;
  }

  // For normal skew angles, apply correction factors
  // Apply a small correction factor based on empirical testing
  // Use a more aggressive correction for small angles to ensure proper alignment
  let correctedAngle = skewAngle;
  if (Math.abs(skewAngle) < 5) {
    // For small angles, apply a stronger correction
    correctedAngle = skewAngle * 1.5;
  } else if (Math.abs(skewAngle) < 10) {
    // For medium angles, apply a moderate correction
    correctedAngle = skewAngle * 1.2;
  }

  // Round to nearest 0.5 degree for cleaner rotation
  correctedAngle = Math.round(correctedAngle * 2) / 2;

  console.log('Detected skew angle:', skewAngle, 'Corrected angle:', correctedAngle);

  return correctedAngle;
}

/**
 * Converts an image to a document-like scanned image with deskewing, white background, and black text
 * @param imageData Base64 image data or URL
 * @returns Promise with processed image data URL
 */
export async function convertToDocumentScan(imageData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');

    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data for processing
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;

      // Detect skew angle (simplified approach)
      const skewAngle = detectSkewAngle(imageData, canvas.width, canvas.height);
      console.log('Detected skew angle:', skewAngle);

      // If skew is detected, rotate the image to correct it
      if (Math.abs(skewAngle) > 0.25 || Math.abs(skewAngle) === 90) { // Lower threshold to catch even slight skew or 90-degree rotations
        console.log('Applying deskew rotation of', skewAngle, 'degrees');

        // Create a larger canvas to avoid clipping during rotation
        const rotationCanvas = document.createElement('canvas');

        // For 90-degree rotations, we need to swap width and height
        let canvasWidth = canvas.width;
        let canvasHeight = canvas.height;

        // For 90-degree rotations, swap dimensions
        if (Math.abs(skewAngle) === 90) {
          // Swap width and height for 90-degree rotations
          [canvasWidth, canvasHeight] = [canvasHeight, canvasWidth];
        }

        const padding = Math.ceil(Math.max(canvasWidth, canvasHeight) * 0.2); // 20% padding for better results
        rotationCanvas.width = canvasWidth + padding * 2;
        rotationCanvas.height = canvasHeight + padding * 2;
        const rotationCtx = rotationCanvas.getContext('2d');

        if (!rotationCtx) {
          console.error('Failed to get rotation canvas context');
        } else {
          // Clear canvas with white background
          rotationCtx.fillStyle = '#FFFFFF';
          rotationCtx.fillRect(0, 0, rotationCanvas.width, rotationCanvas.height);

          // Draw original image in the center of the padded canvas
          rotationCtx.drawImage(img, padding, padding);

          // Create a temporary canvas with the original image
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = rotationCanvas.width;
          tempCanvas.height = rotationCanvas.height;
          const tempCtx = tempCanvas.getContext('2d');

          if (!tempCtx) {
            console.error('Failed to get temp canvas context');
          } else {
            // Copy the current rotation canvas to the temp canvas
            tempCtx.drawImage(rotationCanvas, 0, 0);

            // Clear the rotation canvas
            rotationCtx.clearRect(0, 0, rotationCanvas.width, rotationCanvas.height);
            rotationCtx.fillStyle = '#FFFFFF';
            rotationCtx.fillRect(0, 0, rotationCanvas.width, rotationCanvas.height);

            // Use high-quality interpolation for better rotation
            rotationCtx.imageSmoothingEnabled = true;
            rotationCtx.imageSmoothingQuality = 'high';

            // Special handling for 90-degree rotations
            if (Math.abs(skewAngle) === 90) {
              // For 90-degree rotations, we need a different approach
              rotationCtx.save();
              rotationCtx.translate(rotationCanvas.width / 2, rotationCanvas.height / 2);
              rotationCtx.rotate(-skewAngle * Math.PI / 180); // Convert to radians

              // Draw the image with swapped dimensions
              rotationCtx.drawImage(
                tempCanvas,
                -tempCanvas.height / 2, // Note: swapped width/height
                -tempCanvas.width / 2,
                tempCanvas.height,
                tempCanvas.width
              );
              rotationCtx.restore();

              console.log('Applied 90-degree rotation');
            } else {
              // Normal rotation for small angles
              rotationCtx.save();
              rotationCtx.translate(rotationCanvas.width / 2, rotationCanvas.height / 2);
              rotationCtx.rotate(-skewAngle * Math.PI / 180); // Convert to radians and rotate opposite direction
              rotationCtx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
              rotationCtx.restore();
            }

            // Apply a second pass of rotation if needed for fine-tuning
            // This helps with more accurate alignment
            const rotatedImageData = rotationCtx.getImageData(0, 0, rotationCanvas.width, rotationCanvas.height);
            const secondPassAngle = detectSkewAngle(rotatedImageData, rotationCanvas.width, rotationCanvas.height);

            // If there's still a significant skew, apply a second rotation
            if (Math.abs(secondPassAngle) > 0.5) {
              console.log('Applying second-pass rotation of', secondPassAngle, 'degrees');

              // Copy the current rotation canvas to the temp canvas
              tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
              tempCtx.fillStyle = '#FFFFFF';
              tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
              tempCtx.drawImage(rotationCanvas, 0, 0);

              // Clear the rotation canvas
              rotationCtx.clearRect(0, 0, rotationCanvas.width, rotationCanvas.height);
              rotationCtx.fillStyle = '#FFFFFF';
              rotationCtx.fillRect(0, 0, rotationCanvas.width, rotationCanvas.height);

              // Apply the second rotation
              rotationCtx.save();
              rotationCtx.translate(rotationCanvas.width / 2, rotationCanvas.height / 2);
              rotationCtx.rotate(-secondPassAngle * Math.PI / 180);
              rotationCtx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
              rotationCtx.restore();

              console.log('Second-pass rotation applied successfully');
            }
          }

          // Clear original canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw the rotated image back to the original canvas, cropping to the original size
          // Use the center of the rotation canvas to avoid edge artifacts

          // For 90-degree rotations, we need to handle the dimensions differently
          if (Math.abs(skewAngle) === 90) {
            // For 90-degree rotations, we need to resize the original canvas
            // to match the new orientation
            const originalWidth = canvas.width;
            const originalHeight = canvas.height;

            // Resize the canvas to the new dimensions
            canvas.width = originalHeight;
            canvas.height = originalWidth;

            // Calculate the center position in the rotation canvas
            const centerX = rotationCanvas.width / 2 - canvas.width / 2;
            const centerY = rotationCanvas.height / 2 - canvas.height / 2;

            // Draw the rotated image back to the original canvas
            ctx.drawImage(
              rotationCanvas,
              centerX, centerY, canvas.width, canvas.height, // Source rectangle
              0, 0, canvas.width, canvas.height // Destination rectangle
            );

            console.log('Canvas resized for 90-degree rotation:', canvas.width, 'x', canvas.height);
          } else {
            // Normal drawing for small angle rotations
            const centerX = rotationCanvas.width / 2 - canvas.width / 2;
            const centerY = rotationCanvas.height / 2 - canvas.height / 2;

            ctx.drawImage(
              rotationCanvas,
              centerX, centerY, canvas.width, canvas.height, // Source rectangle
              0, 0, canvas.width, canvas.height // Destination rectangle
            );
          }

          // Get the deskewed image data
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          data = imageData.data;

          console.log('Deskew rotation applied successfully');
        }
      }

      // Step 1: Apply adaptive thresholding for better text detection
      // This helps with text clarity and handles varying lighting conditions
      const blockSize = 25; // Size of the neighborhood for adaptive thresholding
      const binaryThreshold = 15; // Threshold offset from the mean

      // Create a grayscale version first
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale using luminance formula
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Store grayscale value in all channels
        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
        // Alpha channel remains unchanged
      }

      // Apply adaptive thresholding with optimization for performance
      // Use a step size to reduce computation (every 2nd pixel)
      const stepSize = 2;

      // First pass: Calculate and apply thresholds at reduced resolution
      for (let y = 0; y < canvas.height; y += stepSize) {
        for (let x = 0; x < canvas.width; x += stepSize) {
          const idx = (y * canvas.width + x) * 4;

          // Calculate local mean (simple box blur)
          let sum = 0;
          let count = 0;

          // Sample the neighborhood with a step to reduce computation
          const halfBlock = Math.floor(blockSize / 2);
          for (let ny = Math.max(0, y - halfBlock); ny < Math.min(canvas.height, y + halfBlock); ny += 2) {
            for (let nx = Math.max(0, x - halfBlock); nx < Math.min(canvas.width, x + halfBlock); nx += 2) {
              const nidx = (ny * canvas.width + nx) * 4;
              sum += data[nidx];
              count++;
            }
          }

          // Calculate local mean
          const mean = sum / count;

          // Apply threshold to the current pixel and its neighbors
          for (let sy = 0; sy < stepSize && y + sy < canvas.height; sy++) {
            for (let sx = 0; sx < stepSize && x + sx < canvas.width; sx++) {
              const subIdx = ((y + sy) * canvas.width + (x + sx)) * 4;
              const pixelValue = data[subIdx];
              const binaryValue = pixelValue < (mean - binaryThreshold) ? 0 : 255;

              // Set RGB channels to binary value
              data[subIdx] = binaryValue;     // R
              data[subIdx + 1] = binaryValue; // G
              data[subIdx + 2] = binaryValue; // B
            }
          }
        }
      }

      // Remove lines from the image
      console.log('Removing lines from the image...');
      imageData = removeLines(imageData, canvas.width, canvas.height);
      data = imageData.data;

      // Put processed image data back to canvas for further processing
      ctx.putImageData(imageData, 0, 0);
      console.log('Lines removed successfully');

      // Step 2: Create a clean white background with black text
      // We'll use a more direct approach instead of globalCompositeOperation

      // Create a new canvas for the final image
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const finalCtx = finalCanvas.getContext('2d');

      if (!finalCtx) {
        console.error('Failed to get final canvas context');
      } else {
        // Fill with white background
        finalCtx.fillStyle = '#FFFFFF';
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        // Get the binary image data
        const binaryData = imageData.data;

        // Create a new ImageData for the final image
        const finalImageData = finalCtx.createImageData(finalCanvas.width, finalCanvas.height);
        const finalData = finalImageData.data;

        // Copy the binary image data to the final image, inverting as needed
        for (let i = 0; i < binaryData.length; i += 4) {
          // If the pixel is dark in the binary image, make it black in the final image
          if (binaryData[i] < 128) {
            finalData[i] = 0;       // R
            finalData[i + 1] = 0;   // G
            finalData[i + 2] = 0;   // B
          } else {
            finalData[i] = 255;     // R
            finalData[i + 1] = 255; // G
            finalData[i + 2] = 255; // B
          }
          finalData[i + 3] = 255;   // A (fully opaque)
        }

        // Put the final image data back to the final canvas
        finalCtx.putImageData(finalImageData, 0, 0);

        // Clear the original canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the final image to the original canvas
        ctx.drawImage(finalCanvas, 0, 0);

        // Update the image data reference
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        data = imageData.data;
      }

      // Step 3: Apply enhanced sharpening for better text clarity
      const sharpnessData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const sharpData = sharpnessData.data;

      // Create a copy of the image data for the final result
      const finalData = new Uint8ClampedArray(sharpData.length);

      // First pass: Identify text and background regions
      const isText = new Array(canvas.width * canvas.height).fill(false);
      const textThreshold = 180; // Threshold for text pixels

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const pixelValue = (sharpData[idx] + sharpData[idx + 1] + sharpData[idx + 2]) / 3;

          // Mark as text if darker than threshold
          isText[y * canvas.width + x] = pixelValue < textThreshold;
        }
      }

      // Second pass: Apply edge enhancement and noise reduction
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;
          const pixelPos = y * canvas.width + x;

          if (isText[pixelPos]) {
            // This is a text pixel - check if it's an edge
            let neighborTextCount = 0;

            // Check 8 surrounding pixels
            for (let ny = Math.max(0, y - 1); ny <= Math.min(canvas.height - 1, y + 1); ny++) {
              for (let nx = Math.max(0, x - 1); nx <= Math.min(canvas.width - 1, x + 1); nx++) {
                if (ny === y && nx === x) continue; // Skip the center pixel

                if (isText[ny * canvas.width + nx]) {
                  neighborTextCount++;
                }
              }
            }

            // Isolated text pixels are likely noise - remove them
            if (neighborTextCount <= 1) {
              // This is likely noise - make it white
              finalData[idx] = 255;     // R
              finalData[idx + 1] = 255; // G
              finalData[idx + 2] = 255; // B
            }
            // Edge pixels (text pixels next to background)
            else if (neighborTextCount < 5) {
              // This is an edge - make it pure black for sharpness
              finalData[idx] = 0;       // R
              finalData[idx + 1] = 0;   // G
              finalData[idx + 2] = 0;   // B
            }
            // Interior text pixels
            else {
              // This is interior text - make it dark but not completely black
              finalData[idx] = 10;      // R
              finalData[idx + 1] = 10;  // G
              finalData[idx + 2] = 10;  // B
            }
          } else {
            // This is a background pixel - make it pure white
            finalData[idx] = 255;     // R
            finalData[idx + 1] = 255; // G
            finalData[idx + 2] = 255; // B
          }

          // Keep alpha channel
          finalData[idx + 3] = sharpData[idx + 3];
        }
      }

      // Create a new ImageData with the processed pixels
      const finalImageData = new ImageData(finalData, canvas.width, canvas.height);

      // Put the final image data back to canvas
      ctx.putImageData(finalImageData, 0, 0);

      // Add subtle document border shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Transparent fill
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Convert to data URL with high quality
      const processedImageData = canvas.toDataURL('image/jpeg', 0.95);
      resolve(processedImageData);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageData;
  });
}

/**
 * Converts a File object to a document-like scanned image
 * @param file Image file to process
 * @returns Promise with processed image as a File object
 */
export async function convertFileToDocumentScan(file: File): Promise<File> {
  try {
    console.log('Starting document scan conversion for:', file.name);

    // Convert file to data URL
    const dataUrl = await fileToDataUrl(file);
    console.log('File converted to data URL');

    // Process the image
    console.log('Processing image with document scanner...');
    const processedDataUrl = await convertToDocumentScan(dataUrl);
    console.log('Image processing complete');

    // Convert back to File
    const processedFile = await dataUrlToFile(
      processedDataUrl,
      `scanned-${file.name}`,
      'image/jpeg' // Force JPEG for better compatibility
    );

    console.log('Document scan conversion complete');
    return processedFile;
  } catch (error) {
    console.error('Error in document scanner:', error);
    // If processing fails, return the original file
    console.warn('Returning original file due to processing error');
    return file;
  }
}

/**
 * Converts a File to a data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a data URL to a File
 */
async function dataUrlToFile(dataUrl: string, filename: string, type: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type });
}
