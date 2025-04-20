from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Body
from PIL import Image, ImageEnhance, ImageFilter
import io
import sys
import os
import re
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...models import Receipt

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the parent directory to the path to import the services
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from services.receipt_processor import ReceiptProcessor
from services.feedback_collector import FeedbackCollector
from services.category_predictor import CategoryPredictor

router = APIRouter()
# Initialize the receipt processor and feedback collector
receipt_processor = ReceiptProcessor()
feedback_collector = FeedbackCollector()
category_predictor = CategoryPredictor()

def extract_amount(text: str) -> float:
    """Extract amount from text, handling different currency formats."""
    # Remove currency symbols and whitespace
    amount_str = re.sub(r'[^\d.,]', '', text)
    try:
        # Handle different decimal separators
        if ',' in amount_str and '.' in amount_str:
            amount_str = amount_str.replace(',', '')
        elif ',' in amount_str:
            amount_str = amount_str.replace(',', '.')
        return float(amount_str)
    except ValueError:
        return 0.0

def extract_date(text: str) -> str:
    """Extract date from text in various formats."""
    date_patterns = [
        r'\d{2}/\d{2}/\d{4}',
        r'\d{2}-\d{2}-\d{4}',
        r'\d{2}\.\d{2}\.\d{4}'
    ]

    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return ""

def preprocess_image(image: Image.Image) -> Image.Image:
    """Apply minimal preprocessing to enhance text visibility."""
    # Convert to grayscale for better text contrast
    gray_image = image.convert('L')

    # Apply slight contrast enhancement
    enhancer = ImageEnhance.Contrast(gray_image)
    enhanced_image = enhancer.enhance(1.5)

    return enhanced_image

def parse_receipt_data(ocr_result: List) -> Dict[str, Any]:
    """Parse OCR results into structured data."""
    lines = [result[1] for result in ocr_result]
    text = '\n'.join(lines)

    # Initialize receipt data according to the illustrated structure
    receipt_data = {
        # STORE section
        "store": {
            "name": "",
            "address": ""
        },
        # ITEMS section
        "items": [],
        # TOTAL section
        "total": {
            "subtotal": 0.0,
            "tax": 0.0,
            "discount": 0.0,
            "change": 0.0,
            "amount": 0.0  # This is the final total amount
        },
        # OTHERS section
        "date": "",
        "time": "",
        # Additional metadata
        "category": "Others",  # Default category
        "confidence": 0.8,
        "rawText": text  # Include raw text for debugging
    }

    # Extract store name (usually first few lines)
    for line in lines[:3]:
        if not any(word in line.lower() for word in ['tel', 'phone', 'address', 'receipt']):
            receipt_data["store"]["name"] = line
            break

    # Look for address in the next few lines
    for line in lines[3:6]:
        if any(word in line.lower() for word in ['street', 'ave', 'road', 'blvd', 'st', 'dr', 'lane']):
            receipt_data["store"]["address"] = line
            break

    # Extract date
    for line in lines:
        date = extract_date(line)
        if date:
            receipt_data["date"] = date
            break

    # Extract time
    time_pattern = r'(\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?)'
    for line in lines:
        if time_match := re.search(time_pattern, line):
            receipt_data["time"] = time_match.group(1)
            break

    # Extract total amounts (subtotal, tax, discount, change, total amount)
    amount_keywords = {
        'subtotal': ['subtotal', 'sub total', 'sub-total'],
        'tax': ['tax', 'vat', 'sales tax'],
        'discount': ['discount', 'coupon', 'savings'],
        'change': ['change', 'cash back'],
        'amount': ['total', 'amount', 'sum', 'balance', 'due', 'payment']
    }

    # Search for each amount type
    for amount_type, keywords in amount_keywords.items():
        for line in reversed(lines):  # Start from bottom
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in keywords):
                receipt_data["total"][amount_type] = extract_amount(line)
                break

    # If no total amount found, use the largest amount as the total
    if receipt_data["total"]["amount"] == 0.0:
        amounts = []
        for line in lines:
            # Look for dollar amounts like $12.34
            matches = re.findall(r'\$?(\d+\.\d{2})', line)
            amounts.extend([float(m) for m in matches])

        if amounts:
            receipt_data["total"]["amount"] = max(amounts)

    # If we found a total amount but no subtotal, use the total as subtotal
    if receipt_data["total"]["amount"] > 0 and receipt_data["total"]["subtotal"] == 0.0:
        receipt_data["total"]["subtotal"] = receipt_data["total"]["amount"]

    # Extract items (look for price patterns)
    for line in lines:
        # Skip header and footer lines
        if any(word in line.lower() for word in ['receipt', 'tel', 'tax', 'total', 'change', 'subtotal', 'discount']):
            continue

        # Look for price patterns
        price_match = re.search(r'\d+\.\d{2}', line)
        if price_match:
            price = float(price_match.group())
            name = line[:price_match.start()].strip()

            # Try to extract quantity
            quantity = 1  # Default quantity
            quantity_pattern = r'(\d+)\s*[xX]\s*'
            if quantity_match := re.search(quantity_pattern, name):
                try:
                    quantity = int(quantity_match.group(1))
                    # Remove the quantity part from the item name
                    name = re.sub(quantity_pattern, '', name).strip()
                except ValueError:
                    pass

            # Try to extract category (this would be enhanced with ML in a real implementation)
            category = "Others"  # Default category

            if name and price > 0:
                item = {
                    "name": name,
                    "price": price,
                    "quantity": quantity,
                    "category": category
                }
                receipt_data["items"].append(item)

    # If no items found, create a default item with the total amount
    if not receipt_data["items"] and receipt_data["total"]["amount"] > 0:
        default_item = {
            "name": receipt_data["store"]["name"] or "Purchase",
            "price": receipt_data["total"]["amount"],
            "quantity": 1,
            "category": "Others"
        }
        receipt_data["items"].append(default_item)

    return receipt_data

@router.post("/process-receipt")
async def process_receipt(image: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # Read image bytes
        contents = await image.read()
        logger.info(f"Processing receipt image with size: {len(contents)} bytes")

        # Process the receipt using the receipt processor
        logger.info("Starting receipt processing with direct text extraction")
        receipt_data = receipt_processor.process_image(contents)
        logger.info(f"Receipt processing complete. Extracted data: vendor='{receipt_data.get('vendor', 'N/A')}', total={receipt_data.get('total', 0)}, items={len(receipt_data.get('items', []))}")

        # Format date if needed
        if isinstance(receipt_data["date"], str) and receipt_data["date"]:
            try:
                # Try to ensure the date is in YYYY-MM-DD format
                if "/" in receipt_data["date"] or "-" in receipt_data["date"]:
                    # Try common formats
                    for fmt in ["%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d", "%d-%m-%Y", "%m-%d-%Y"]:
                        try:
                            date_obj = datetime.strptime(receipt_data["date"], fmt)
                            receipt_data["date"] = date_obj.strftime("%Y-%m-%d")
                            break
                        except ValueError:
                            continue
            except Exception:
                # If all parsing fails, use current date
                receipt_data["date"] = datetime.now().strftime("%Y-%m-%d")
        else:
            receipt_data["date"] = datetime.now().strftime("%Y-%m-%d")

        return receipt_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process receipt: {str(e)}")

@router.post("/save-receipt")
async def save_receipt(receipt_data: dict, db: Session = Depends(get_db)):
    try:
        # Handle both flat and nested structure
        if "store" in receipt_data:
            # Nested structure (from our enhanced OCR service)
            store_name = receipt_data.get("store", {}).get("name", "Unknown Vendor")
            store_address = receipt_data.get("store", {}).get("address", "")
            total_amount = receipt_data.get("total", {}).get("amount", 0.0)
            subtotal = receipt_data.get("total", {}).get("subtotal", total_amount)
            tax = receipt_data.get("total", {}).get("tax", 0.0)
            discount = receipt_data.get("total", {}).get("discount", 0.0)
            change = receipt_data.get("total", {}).get("change", 0.0)
        else:
            # Flat structure (from frontend)
            store_name = receipt_data.get("vendor", "Unknown Vendor")
            store_address = receipt_data.get("address", "")
            total_amount = receipt_data.get("total", 0.0)
            subtotal = receipt_data.get("subtotal", total_amount)
            tax = receipt_data.get("tax", 0.0)
            discount = receipt_data.get("discount", 0.0)
            change = receipt_data.get("change", 0.0)

        # Create a new Receipt object
        receipt = Receipt(
            user_id=receipt_data.get("userId", ""),
            vendor=store_name,
            address=store_address,
            date=datetime.strptime(receipt_data.get("date", datetime.now().strftime("%Y-%m-%d")), "%Y-%m-%d"),
            time=receipt_data.get("time", ""),
            total=total_amount,
            subtotal=subtotal,
            tax=tax,
            discount=discount,
            change=change,
            category=receipt_data.get("category", "Others"),
            items=receipt_data.get("items", []),
            image_urls=receipt_data.get("imageUrls", []),
            confidence=receipt_data.get("confidence", 0.8)
        )

        # Add to database
        db.add(receipt)
        db.commit()
        db.refresh(receipt)

        # Return the saved receipt data
        response_data = {
            "id": receipt.id,
            "store": {
                "name": receipt.vendor,
                "address": receipt.address
            },
            "date": receipt.date.strftime("%Y-%m-%d"),
            "time": receipt.time,
            "total": {
                "subtotal": receipt.subtotal,
                "tax": receipt.tax,
                "discount": receipt.discount,
                "change": receipt.change,
                "amount": receipt.total
            },
            "items": receipt.items,
            "category": receipt.category,
            "imageUrls": receipt.image_urls,
            "confidence": receipt.confidence,
            "createdAt": receipt.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }

        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict-category")
async def predict_category(data: dict = Body(...)):
    """
    Predict the category for a transaction based on description, amount, and vendor.

    Args:
        data: Dictionary containing description, amount, and vendor

    Returns:
        Dict with predicted category and confidence
    """
    try:
        description = data.get("description", "")
        amount = data.get("amount", 0.0)
        vendor = data.get("vendor", "")

        # Use the category predictor to predict the category
        category, confidence = category_predictor.predict(
            description=description,
            amount=amount,
            vendor=vendor
        )

        return {
            "category": category,
            "confidence": confidence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to predict category: {str(e)}")

@router.post("/submit-feedback")
async def submit_feedback(original_data: dict = Body(...), corrected_data: dict = Body(...)):
    """
    Submit feedback for a receipt to improve the model over time.

    Args:
        original_data: The original extracted receipt data
        corrected_data: The corrected receipt data

    Returns:
        Dict with success status and message
    """
    try:
        # Get user ID from the data or use a default
        user_id = corrected_data.get("userId", "anonymous")

        # Collect feedback
        success = feedback_collector.collect_receipt_feedback(
            original_data=original_data,
            corrected_data=corrected_data,
            user_id=user_id
        )

        if success:
            return {
                "success": True,
                "message": "Feedback collected successfully. Thank you for helping improve our models!"
            }
        else:
            return {
                "success": False,
                "message": "No changes detected between original and corrected data."
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process feedback: {str(e)}")
