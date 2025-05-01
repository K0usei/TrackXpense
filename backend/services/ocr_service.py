import easyocr
import numpy as np
import cv2
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import io
import re
from datetime import datetime
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models import Receipt
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        self.reader = easyocr.Reader(['en'])

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
        """Apply advanced preprocessing to enhance text visibility for OCR."""
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
        """Process receipt image with advanced preprocessing and OCR."""
        # Convert bytes to image
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Image size: {image.size}, mode: {image.mode}")

        # Apply our advanced preprocessing pipeline
        logger.info("Applying advanced image preprocessing...")
        processed_image = self.preprocess_image(image)

        # Convert to numpy array for OCR
        processed_np = np.array(processed_image)

        # Perform OCR with advanced preprocessing
        logger.info("Performing OCR with advanced preprocessing...")
        results = self.reader.readtext(processed_np)
        logger.info(f"OCR extracted {len(results)} text elements with advanced preprocessing")

        # If no text was found, try with alternative preprocessing approaches
        if len(results) == 0:
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
            results = self.reader.readtext(image_np)
            logger.info(f"OCR extracted {len(results)} text elements with inverted preprocessing")

        # If still no text, try with the original image as a last resort
        if len(results) == 0:
            logger.info("Still no text found, trying with original image...")
            image_np = np.array(image)
            results = self.reader.readtext(image_np)
            logger.info(f"OCR extracted {len(results)} text elements with original image")

        # If still no results, try one more approach with OpenCV preprocessing
        if len(results) == 0:
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
            results = self.reader.readtext(img_cv)
            logger.info(f"OCR extracted {len(results)} text elements with OpenCV preprocessing")

        # Log the first few results for debugging
        if results:
            logger.info("Sample of extracted text:")
            for i, (_, text, conf) in enumerate(results[:5]):
                logger.info(f"  {i}: '{text}' (confidence: {conf:.2f})")
        else:
            logger.warning("No text was extracted from the image")

        # Extract relevant information
        extracted_data = self._parse_receipt(results)

        return extracted_data

    def _parse_receipt(self, ocr_results: List) -> Dict[str, Any]:
        """Parse OCR results into structured receipt data with BERT classification."""
        text_blocks = [block[1] for block in ocr_results]
        text = '\n'.join(text_blocks)

        logger.info(f"Parsing receipt with {len(text_blocks)} blocks of text")

        # Initialize receipt data according to the illustrated structure
        receipt_data = {
            # STORE section
            'store': {
                'name': '',
                'address': ''
            },
            # ITEMS section
            'items': [],
            # TOTAL section
            'total': {
                'subtotal': 0.0,
                'tax': 0.0,
                'discount': 0.0,
                'change': 0.0,
                'amount': 0.0  # This is the final total amount
            },
            # OTHERS section
            'date': '',
            'time': '',
            # Additional metadata
            'category': 'Others',  # Default category
            'confidence': 0.8,
            'rawText': text  # Include raw text for debugging
        }

        # If no text was extracted, return empty data
        if not text_blocks:
            logger.warning("No text blocks were extracted, returning empty receipt data")
            return receipt_data

        # Extract store name (usually first few lines)
        # Try to find a good store name in the first 3 lines
        for i in range(min(3, len(text_blocks))):
            if len(text_blocks[i]) > 2 and not any(word in text_blocks[i].lower() for word in ['tel', 'phone', 'address', 'receipt', 'www', 'http', '.com']):
                receipt_data['store']['name'] = text_blocks[i]
                logger.info(f"Extracted store name: '{text_blocks[i]}'")
                break

        # If no store name found, use the first line
        if not receipt_data['store']['name'] and text_blocks:
            receipt_data['store']['name'] = text_blocks[0]
            logger.info(f"Using first line as store name: '{text_blocks[0]}'")

        # Look for address in the next few lines after store name
        address_start = 1 if receipt_data['store']['name'] == text_blocks[0] else 2
        for i in range(address_start, min(address_start + 3, len(text_blocks))):
            if any(word in text_blocks[i].lower() for word in ['street', 'ave', 'road', 'blvd', 'st', 'dr', 'lane']):
                receipt_data['store']['address'] = text_blocks[i]
                logger.info(f"Extracted store address: '{text_blocks[i]}'")
                break

        # Find date
        date_patterns = [
            r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',  # MM/DD/YYYY or DD/MM/YYYY
            r'\d{4}[-/]\d{1,2}[-/]\d{1,2}',  # YYYY/MM/DD
            r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}',  # Month DD, YYYY
            r'\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}'  # DD Month YYYY
        ]

        date_found = False
        for text in text_blocks:
            for pattern in date_patterns:
                if match := re.search(pattern, text, re.IGNORECASE):
                    try:
                        date_str = match.group(0)
                        logger.info(f"Found date pattern: '{date_str}'")

                        # Try different date formats
                        for fmt in ['%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%m-%d-%Y', '%B %d, %Y', '%b %d, %Y', '%d %B %Y', '%d %b %Y']:
                            try:
                                parsed_date = datetime.strptime(date_str, fmt)
                                receipt_data['date'] = parsed_date.strftime('%Y-%m-%d')
                                logger.info(f"Parsed date: {receipt_data['date']}")
                                date_found = True
                                break
                            except ValueError:
                                continue

                        if date_found:
                            break
                    except Exception as e:
                        logger.error(f"Error parsing date: {e}")
                        continue

            if date_found:
                break

        # If no date found, use current date
        if not receipt_data['date']:
            receipt_data['date'] = datetime.now().strftime('%Y-%m-%d')
            logger.info(f"No date found, using current date: {receipt_data['date']}")

        # Find total amounts (subtotal, tax, discount, change, total amount)
        # Define patterns for each field
        amount_patterns = {
            'subtotal': [r'SUBTOTAL\s*[\$]?\s*(\d+\.\d{2})', r'SUB\s*TOTAL\s*[\$]?\s*(\d+\.\d{2})'],
            'tax': [r'TAX\s*[\$]?\s*(\d+\.\d{2})', r'VAT\s*[\$]?\s*(\d+\.\d{2})', r'SALES TAX\s*[\$]?\s*(\d+\.\d{2})'],
            'discount': [r'DISCOUNT\s*[\$]?\s*(\d+\.\d{2})', r'COUPON\s*[\$]?\s*(\d+\.\d{2})', r'SAVINGS\s*[\$]?\s*(\d+\.\d{2})'],
            'change': [r'CHANGE\s*[\$]?\s*(\d+\.\d{2})', r'CASH BACK\s*[\$]?\s*(\d+\.\d{2})'],
            'amount': [r'TOTAL\s*[\$]?\s*(\d+\.\d{2})', r'AMOUNT\s*[\$]?\s*(\d+\.\d{2})', r'GRAND TOTAL\s*[\$]?\s*(\d+\.\d{2})',
                      r'BALANCE\s*[\$]?\s*(\d+\.\d{2})', r'DUE\s*[\$]?\s*(\d+\.\d{2})', r'PAYMENT\s*[\$]?\s*(\d+\.\d{2})']
        }

        # Search for each amount type
        for amount_type, patterns in amount_patterns.items():
            for text in text_blocks:
                for pattern in patterns:
                    if match := re.search(pattern, text.upper()):
                        receipt_data['total'][amount_type] = float(match.group(1))
                        print(f"Found {amount_type}: ${receipt_data['total'][amount_type]}")
                        break

        # If no total amount found with keywords, look for dollar amounts
        if receipt_data['total']['amount'] == 0.0:
            # Look for dollar amounts like $12.34
            dollar_pattern = r'\$?(\d+\.\d{2})'
            amounts = []

            # Check the bottom half of the receipt first (total is usually at the bottom)
            bottom_blocks = text_blocks[len(text_blocks)//2:] if len(text_blocks) > 2 else text_blocks

            for text in bottom_blocks:
                matches = re.findall(dollar_pattern, text)
                amounts.extend([float(m) for m in matches])

            if amounts:
                # Use the largest amount as the total
                receipt_data['total']['amount'] = max(amounts)
                print(f"Found total amount from largest amount: ${receipt_data['total']['amount']}")

        # If still no total amount found, check all text blocks
        if receipt_data['total']['amount'] == 0.0 and text_blocks:
            print("No total amount found in bottom half, checking all text blocks")
            dollar_pattern = r'\$?(\d+\.\d{2})'
            amounts = []

            for text in text_blocks:
                matches = re.findall(dollar_pattern, text)
                amounts.extend([float(m) for m in matches])

            if amounts:
                # Use the largest amount as the total
                receipt_data['total']['amount'] = max(amounts)
                print(f"Found total amount from all text blocks: ${receipt_data['total']['amount']}")

        # If we found a total amount but no subtotal, use the total as subtotal
        if receipt_data['total']['amount'] > 0 and receipt_data['total']['subtotal'] == 0.0:
            receipt_data['total']['subtotal'] = receipt_data['total']['amount']
            print(f"Using total amount as subtotal: ${receipt_data['total']['subtotal']}")

        # Extract items and prices
        items = []
        price_pattern = r'\$?\s*(\d+\.\d{2})'

        print("Extracting items from receipt...")

        # Skip header and footer lines
        skip_keywords = ['TOTAL', 'SUBTOTAL', 'TAX', 'AMOUNT', 'BALANCE', 'DUE', 'PAYMENT', 'RECEIPT', 'TEL', 'PHONE', 'ADDRESS', 'THANK']

        # First pass: Look for lines with prices
        for i, text in enumerate(text_blocks):
            if price_match := re.search(price_pattern, text):
                price = float(price_match.group(1))

                # Skip if this is the total amount
                if price == receipt_data['total']['amount'] and any(keyword in text.upper() for keyword in ['TOTAL', 'AMOUNT', 'BALANCE', 'DUE', 'PAYMENT']):
                    continue

                # Skip if this is the subtotal
                if price == receipt_data['total']['subtotal'] and any(keyword in text.upper() for keyword in ['SUBTOTAL', 'SUB TOTAL']):
                    continue

                # Skip if this is the tax
                if price == receipt_data['total']['tax'] and any(keyword in text.upper() for keyword in ['TAX', 'VAT', 'SALES TAX']):
                    continue

                # Skip if this is the discount
                if price == receipt_data['total']['discount'] and any(keyword in text.upper() for keyword in ['DISCOUNT', 'COUPON', 'SAVINGS']):
                    continue

                # Skip if this is the change
                if price == receipt_data['total']['change'] and any(keyword in text.upper() for keyword in ['CHANGE', 'CASH BACK']):
                    continue

                # Look for item name in previous line if current line only contains price
                if i > 0 and text.strip() == price_match.group(0).strip():
                    item_name = text_blocks[i-1]
                else:
                    item_name = text.replace(price_match.group(0), '').strip()

                # Clean up the item name
                item_name = re.sub(r'[\$\*\#\@\%\&]', '', item_name).strip()

                # Try to extract quantity
                quantity = 1  # Default quantity
                quantity_pattern = r'(\d+)\s*[xX]\s*'
                if quantity_match := re.search(quantity_pattern, item_name):
                    try:
                        quantity = int(quantity_match.group(1))
                        # Remove the quantity part from the item name
                        item_name = re.sub(quantity_pattern, '', item_name).strip()
                    except ValueError:
                        pass

                # Try to extract category
                category = 'Others'  # Default category
                # This would be enhanced with the category predictor in a real implementation

                if item_name and not any(keyword in item_name.upper() for keyword in skip_keywords):
                    item = {
                        'name': item_name,
                        'quantity': quantity,
                        'price': price,
                        'category': category
                    }
                    items.append(item)
                    print(f"Extracted item: {item}")

        # If no items found, create a default item with the total amount
        if not items and receipt_data['total']['amount'] > 0:
            default_item = {
                'name': receipt_data['store']['name'] or 'Purchase',
                'price': receipt_data['total']['amount'],
                'quantity': 1,
                'category': 'Others'
            }
            items.append(default_item)
            print(f"No items found, created default item: {default_item}")

        receipt_data['items'] = items
        print(f"Total items extracted: {len(items)}")

        # Extract time if not already found
        time_pattern = r'(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)'  # Matches formats like 10:30, 10:30:45, 10:30 AM
        for text in text_blocks:
            if time_match := re.search(time_pattern, text):
                receipt_data['time'] = time_match.group(1)
                print(f"Extracted time: {receipt_data['time']}")
                break

        return receipt_data

    def save_receipt(self, receipt_data: Dict[str, Any], db: Session, user_id: str, image_urls: List[str]) -> Receipt:
        # Convert the nested structure to a flat structure for database storage
        receipt = Receipt(
            user_id=user_id,
            vendor=receipt_data['store']['name'],
            address=receipt_data['store']['address'],
            date=datetime.strptime(receipt_data['date'], '%Y-%m-%d'),
            time=receipt_data['time'] or datetime.now().strftime('%H:%M'),
            total=receipt_data['total']['amount'],
            subtotal=receipt_data['total']['subtotal'],
            tax=receipt_data['total']['tax'],
            discount=receipt_data['total']['discount'],
            change=receipt_data['total']['change'],
            items=receipt_data['items'],  # This is stored as JSON
            image_urls=image_urls,
            category=receipt_data['category'],
            confidence=receipt_data['confidence']
        )

        db.add(receipt)
        db.commit()
        db.refresh(receipt)
        return receipt




