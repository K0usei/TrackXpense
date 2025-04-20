"""
End-to-end receipt processing pipeline combining OCR, BERT, and XGBoost.
"""
import os
import io
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import easyocr
from typing import Dict, List, Any, Tuple, Optional
import logging
from pathlib import Path
import sys

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

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocess image for better OCR results."""
        # Convert to grayscale
        gray = image.convert('L')

        # Increase contrast
        enhancer = ImageEnhance.Contrast(gray)
        gray = enhancer.enhance(2.0)

        # Apply slight blur to reduce noise
        gray = gray.filter(ImageFilter.GaussianBlur(radius=0.5))

        # Apply adaptive thresholding
        # This is a simple approximation of adaptive thresholding
        # For better results, consider using OpenCV's adaptiveThreshold
        threshold = np.array(gray).mean() * 0.8
        binary = gray.point(lambda p: 255 if p > threshold else 0)

        # Apply dilation to make text more prominent
        binary = binary.filter(ImageFilter.MaxFilter(3))

        return binary

    def process_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """Process receipt image and extract structured data."""
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_bytes))

            # Try different preprocessing approaches to improve text extraction

            # 1. First try with minimal preprocessing
            gray_image = image.convert('L')
            enhancer = ImageEnhance.Contrast(gray_image)
            enhanced_image = enhancer.enhance(2.0)  # Increase contrast more

            # Convert to numpy array for OCR
            image_np = np.array(enhanced_image)

            # Perform OCR with minimal preprocessing
            logger.info("Attempting OCR with minimal preprocessing...")
            ocr_results = self.reader.readtext(image_np)

            # If no text was found, try with more aggressive preprocessing
            if len(ocr_results) == 0:
                logger.info("No text found with minimal preprocessing, trying more aggressive approach...")
                # Apply thresholding for better text extraction
                from PIL import ImageOps

                # Invert colors if the image is dark (helps with some receipts)
                inverted_image = ImageOps.invert(gray_image)
                # Apply stronger contrast
                enhancer = ImageEnhance.Contrast(inverted_image)
                enhanced_image = enhancer.enhance(2.5)
                # Apply sharpening
                enhanced_image = enhanced_image.filter(ImageFilter.SHARPEN)

                # Convert to numpy array for OCR
                image_np = np.array(enhanced_image)

                # Try OCR again with more aggressive preprocessing
                ocr_results = self.reader.readtext(image_np)

            # If still no text, try with the original image as a last resort
            if len(ocr_results) == 0:
                logger.info("Still no text found, trying with original image...")
                image_np = np.array(image)
                ocr_results = self.reader.readtext(image_np)

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
