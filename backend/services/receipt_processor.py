"""
End-to-end receipt processing pipeline combining OCR, BERT, and XGBoost.
"""
import os
import io
import numpy as np
import cv2
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import easyocr
from typing import Dict, List, Any, Tuple, Optional
import logging
from pathlib import Path
import sys
import math

# Add the parent directory to the path to import the ML models
sys.path.append(str(Path(__file__).parent.parent))

from services.receipt_parser import ReceiptParser
from services.category_predictor import CategoryPredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ReceiptProcessor:
    """End-to-end receipt processing pipeline."""

    def __init__(self,
                 bert_model_dir: str = 'models/bert_receipt_classifier',
                 category_model_path: str = 'models/category_model.joblib'):
        """Initialize the receipt processor."""
        # Initialize EasyOCR
        self.reader = easyocr.Reader(['en'])
        logger.info("EasyOCR initialized")

        # Initialize receipt parser with BERT
        self.parser = ReceiptParser(model_dir=bert_model_dir)
        logger.info("Receipt parser initialized")

        # Initialize category predictor with XGBoost
        try:
            self.category_predictor = CategoryPredictor(model_path=category_model_path)
            logger.info("Category predictor initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize category predictor: {e}")
            logger.warning("Category prediction will use rule-based fallback")
            self.category_predictor = None

    def detect_skew(self, image_np: np.ndarray) -> float:
        """Detect the skew angle of the image."""
        # Convert to grayscale if it's not already
        if len(image_np.shape) == 3:
            gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        else:
            gray = image_np.copy()

        # Apply threshold to get binary image
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Find all contours
        contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        # Find the largest contour by area
        if not contours:
            return 0.0

        # Filter out very small contours
        significant_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 100]
        if not significant_contours:
            return 0.0

        # Get rotated rectangles for all significant contours
        angles = []
        for contour in significant_contours:
            # Get minimum area rectangle
            rect = cv2.minAreaRect(contour)
            # Get angle
            angle = rect[2]

            # Adjust angle to be between -45 and 45 degrees
            if angle < -45:
                angle = 90 + angle
            elif angle > 45:
                angle = angle - 90

            angles.append(angle)

        # Use the median angle to avoid outliers
        angles.sort()
        median_angle = angles[len(angles) // 2] if angles else 0.0

        logger.info(f"Detected skew angle: {median_angle:.2f} degrees")
        return median_angle

    def deskew_image(self, image_np: np.ndarray) -> np.ndarray:
        """Deskew the image based on detected angle."""
        # Detect skew angle
        angle = self.detect_skew(image_np)

        # If angle is very small, no need to deskew
        if abs(angle) < 0.5:
            logger.info("Skew angle too small, skipping deskew")
            return image_np

        # Get image dimensions
        h, w = image_np.shape[:2]
        center = (w // 2, h // 2)

        # Get rotation matrix
        M = cv2.getRotationMatrix2D(center, angle, 1.0)

        # Perform rotation
        rotated = cv2.warpAffine(
            image_np,
            M,
            (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(255, 255, 255)
        )

        logger.info(f"Image deskewed by {angle:.2f} degrees")
        return rotated

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocess image for better OCR results."""
        # Convert PIL Image to numpy array for OpenCV processing
        image_np = np.array(image)

        # Deskew the image
        logger.info("Deskewing image...")
        deskewed = self.deskew_image(image_np)

        # Convert back to PIL for further processing
        deskewed_pil = Image.fromarray(deskewed)

        # Convert to grayscale
        gray = deskewed_pil.convert('L')

        # Increase contrast
        enhancer = ImageEnhance.Contrast(gray)
        gray = enhancer.enhance(2.5)  # Increased contrast for better text visibility

        # Apply slight blur to reduce noise
        gray = gray.filter(ImageFilter.GaussianBlur(radius=0.5))

        # Convert to numpy for OpenCV adaptive thresholding
        gray_np = np.array(gray)

        # Apply adaptive thresholding using OpenCV for better results
        binary_np = cv2.adaptiveThreshold(
            gray_np,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,  # Block size
            2    # Constant subtracted from mean
        )

        # Convert back to PIL
        binary = Image.fromarray(binary_np)

        # Apply dilation to make text more prominent
        binary = binary.filter(ImageFilter.MaxFilter(3))

        # Sharpen the image to make text clearer
        sharpened = binary.filter(ImageFilter.SHARPEN)

        logger.info("Image preprocessing completed")
        return sharpened

    def process_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """Process receipt image and extract structured data."""
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_bytes))

            # Apply our advanced preprocessing pipeline
            logger.info("Applying advanced image preprocessing...")
            processed_image = self.preprocess_image(image)

            # Convert to numpy array for OCR
            processed_np = np.array(processed_image)

            # Perform OCR with advanced preprocessing
            logger.info("Performing OCR with advanced preprocessing...")
            ocr_results = self.reader.readtext(processed_np)

            # If no text was found, try with alternative preprocessing approaches
            if len(ocr_results) == 0:
                logger.info("No text found with advanced preprocessing, trying alternative approach...")

                # Try inverting the image (dark background to light)
                inverted_image = ImageOps.invert(image.convert('L'))
                enhancer = ImageEnhance.Contrast(inverted_image)
                enhanced_image = enhancer.enhance(2.5)

                # Apply sharpening
                enhanced_image = enhanced_image.filter(ImageFilter.SHARPEN)

                # Convert to numpy array for OCR
                image_np = np.array(enhanced_image)

                # Try OCR again with inverted preprocessing
                ocr_results = self.reader.readtext(image_np)

            # If still no text, try with the original image as a last resort
            if len(ocr_results) == 0:
                logger.info("Still no text found, trying with original image...")
                image_np = np.array(image)
                ocr_results = self.reader.readtext(image_np)

            # If still no results, try one more approach with OpenCV preprocessing
            if len(ocr_results) == 0:
                logger.info("No text found with previous methods, trying OpenCV preprocessing...")

                # Convert to OpenCV format
                img_cv = np.array(image)
                if len(img_cv.shape) == 3:
                    img_cv = cv2.cvtColor(img_cv, cv2.COLOR_RGB2GRAY)

                # Apply bilateral filter to preserve edges while removing noise
                img_cv = cv2.bilateralFilter(img_cv, 9, 75, 75)

                # Apply adaptive threshold
                img_cv = cv2.adaptiveThreshold(
                    img_cv, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                    cv2.THRESH_BINARY, 11, 2
                )

                # Apply morphological operations to clean up the image
                kernel = np.ones((1, 1), np.uint8)
                img_cv = cv2.morphologyEx(img_cv, cv2.MORPH_CLOSE, kernel)

                # Try OCR with this approach
                ocr_results = self.reader.readtext(img_cv)

            # Log OCR results for debugging
            logger.info(f"OCR extracted {len(ocr_results)} text elements")
            for idx, (bbox, text, conf) in enumerate(ocr_results[:10]):  # Log first 10 results
                logger.info(f"OCR text {idx}: '{text}' (confidence: {conf:.2f})")

            # Parse receipt
            logger.info("Parsing receipt with BERT classifier...")
            receipt_data = self.parser.parse_receipt(ocr_results)

            # Predict category
            if self.category_predictor and receipt_data["vendor"] and receipt_data["total"] > 0:
                logger.info("Predicting category...")
                # Combine all items into a description
                items_text = ", ".join([item["name"] for item in receipt_data["items"]])
                description = f"{receipt_data['vendor']} {items_text}"

                category, confidence = self.category_predictor.predict(
                    description=description,
                    amount=receipt_data["total"],
                    vendor=receipt_data["vendor"]
                )

                receipt_data["category"] = category
                receipt_data["confidence"] = confidence
            else:
                logger.info("Using default category 'Others'")
                receipt_data["category"] = "Others"
                receipt_data["confidence"] = 1.0

            logger.info(f"Receipt processed successfully: {receipt_data['vendor']}, {receipt_data['total']}, {receipt_data['category']}")
            return receipt_data

        except Exception as e:
            logger.error(f"Error processing receipt: {e}")
            raise

    def process_image_file(self, image_path: str) -> Dict[str, Any]:
        """Process receipt image file and extract structured data."""
        with open(image_path, 'rb') as f:
            image_bytes = f.read()

        return self.process_image(image_bytes)


# Example usage
if __name__ == "__main__":
    # Initialize processor
    processor = ReceiptProcessor()

    # Process a sample receipt
    sample_path = "data/sample_receipt.jpg"
    if os.path.exists(sample_path):
        result = processor.process_image_file(sample_path)
        print(f"Vendor: {result['vendor']}")
        print(f"Date: {result['date']}")
        print(f"Total: ${result['total']:.2f}")
        print(f"Category: {result['category']} (confidence: {result['confidence']:.2f})")
        print(f"Items: {len(result['items'])}")
        for item in result['items']:
            print(f"  - {item['name']}: {item['quantity']} x ${item['price']:.2f}")
    else:
        print(f"Sample receipt not found at {sample_path}")
