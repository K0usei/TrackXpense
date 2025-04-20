"""
Enhanced receipt parsing service using BERT for field classification.
"""
import re
import json
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional
import logging
import numpy as np
from pathlib import Path
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the parent directory to the path to import the BERT model
sys.path.append(str(Path(__file__).parent.parent))

# Try to import the BERT model, fall back to simplified version if not available
try:
    from ml.bert_field_classifier import BERTFieldClassifier
    FieldClassifier = BERTFieldClassifier
    logger.info("Using BERT field classifier")
except ImportError:
    try:
        from ml.simplified_bert_classifier import SimplifiedFieldClassifier
        FieldClassifier = SimplifiedFieldClassifier
        logger.info("Using simplified field classifier")
    except ImportError:
        logger.warning("Neither BERT nor simplified classifier available. Using rule-based parsing only.")
        FieldClassifier = None

# Class definition follows

class ReceiptParser:
    """Enhanced receipt parser using BERT for field classification."""

    def __init__(self, model_dir: str = 'models/simplified_receipt_classifier'):
        """Initialize the receipt parser."""
        # Try to use BERT or simplified classifier if available
        if FieldClassifier is not None:
            try:
                # Try BERT model directory first
                self.field_classifier = FieldClassifier(model_dir=model_dir)
                self.field_classifier.load_model()
                logger.info("Field classifier model loaded successfully")
            except FileNotFoundError:
                # Try simplified model directory
                try:
                    simplified_dir = 'models/simplified_receipt_classifier'
                    self.field_classifier = FieldClassifier(model_dir=simplified_dir)
                    self.field_classifier.load_model()
                    logger.info("Simplified field classifier loaded successfully")
                except FileNotFoundError:
                    logger.warning("No field classifier model found. Using rule-based parsing.")
                    self.field_classifier = None
        else:
            logger.warning("Field classifier not available. Using rule-based parsing.")
            self.field_classifier = None

    def parse_receipt(self, ocr_results: List[Tuple[List[List[int]], str, float]]) -> Dict[str, Any]:
        """
        Parse OCR results into structured receipt data.

        Args:
            ocr_results: List of tuples (bounding_box, text, confidence) from EasyOCR

        Returns:
            Dict containing structured receipt data
        """
        # Extract text lines from OCR results
        lines = [result[1] for result in ocr_results]
        text = '\n'.join(lines)

        # Initialize receipt data
        receipt_data = {
            "vendor": "",
            "date": "",
            "time": "",
            "total": 0.0,
            "tax": 0.0,
            "change": 0.0,
            "items": [],
            "category": "Others",  # Default category
            "confidence": 0.8,
            "rawText": text  # Include raw text for debugging
        }

        # Use field classifier to classify lines if available
        if self.field_classifier:
            try:
                logger.info(f"Using field classifier to classify {len(lines)} lines of text")
                field_labels = self.field_classifier.predict(lines)

                # Log the classification results for debugging
                logger.info("Field classification results:")
                for i, (line, label) in enumerate(zip(lines[:10], field_labels[:10])):
                    logger.info(f"Line {i}: '{line}' -> {label}")

                receipt_data = self._parse_with_classifier(lines, field_labels, receipt_data)
                logger.info(f"Parsed with classifier: Vendor='{receipt_data['vendor']}', Total={receipt_data['total']}, Items={len(receipt_data['items'])}")
            except Exception as e:
                logger.error(f"Error using field classifier: {e}")
                logger.info("Falling back to rule-based parsing")
                receipt_data = self._parse_with_rules(lines, receipt_data)
        else:
            logger.warning("No field classifier available, using rule-based parsing")
            receipt_data = self._parse_with_rules(lines, receipt_data)

        return receipt_data

    def _parse_with_classifier(self, lines: List[str], field_labels: List[str], receipt_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse receipt using BERT field classifications."""
        # Extract vendor (STORE)
        store_lines = [lines[i] for i, label in enumerate(field_labels) if label == 'STORE']
        if store_lines:
            receipt_data["vendor"] = store_lines[0]

        # Extract date (DATE)
        date_lines = [lines[i] for i, label in enumerate(field_labels) if label == 'DATE']
        if date_lines:
            for line in date_lines:
                date = self._extract_date(line)
                if date:
                    receipt_data["date"] = date
                    break

        # Extract total (TOTAL)
        total_lines = [lines[i] for i, label in enumerate(field_labels) if label == 'TOTAL']
        if total_lines:
            for line in total_lines:
                total = self._extract_amount(line)
                if total:
                    receipt_data["total"] = total
                    break

        # Extract items (ITEM)
        item_lines = [lines[i] for i, label in enumerate(field_labels) if label == 'ITEM']
        items = []
        for line in item_lines:
            item = self._parse_item_line(line)
            if item:
                items.append(item)

        receipt_data["items"] = items

        # Extract tax and time using rule-based approach
        for line in lines:
            # Extract tax
            if 'tax' in line.lower() and not receipt_data["tax"]:
                tax = self._extract_amount(line)
                if tax:
                    receipt_data["tax"] = tax

            # Extract time
            if 'time' in line.lower() and not receipt_data["time"]:
                time_match = re.search(r'(\d{1,2}:\d{2}(?:\s*[AP]M)?)', line, re.IGNORECASE)
                if time_match:
                    receipt_data["time"] = time_match.group(1)

        return receipt_data

    def _parse_with_rules(self, lines: List[str], receipt_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse receipt using rule-based approach."""
        logger.info("Using rule-based parsing as fallback")

        # Extract vendor (usually first few lines)
        for line in lines[:5]:  # Check more lines
            if len(line) > 2 and not any(word in line.lower() for word in ['tel', 'phone', 'address', 'receipt', 'www', 'http', '.com']):
                receipt_data["vendor"] = line
                logger.info(f"Extracted vendor: '{line}'")
                break

        # Extract date
        for line in lines:
            date = self._extract_date(line)
            if date:
                receipt_data["date"] = date
                logger.info(f"Extracted date: '{date}'")
                break

        # If no date found, use current date
        if not receipt_data["date"]:
            from datetime import datetime
            receipt_data["date"] = datetime.now().strftime('%Y-%m-%d')
            logger.info(f"No date found, using current date: {receipt_data['date']}")

        # Extract time
        for line in lines:
            if 'time' in line.lower():
                time_match = re.search(r'(\d{1,2}:\d{2}(?:\s*[AP]M)?)', line, re.IGNORECASE)
                if time_match:
                    receipt_data["time"] = time_match.group(1)
                    break

        # Extract total
        # First try to find lines with total keywords
        for line in reversed(lines):  # Start from the bottom
            line_lower = line.lower()
            if any(word in line_lower for word in ['total', 'amount', 'sum', 'balance', 'due', 'payment']):
                total = self._extract_amount(line)
                if total and total > 0:
                    receipt_data["total"] = total
                    logger.info(f"Extracted total from keyword: '{line}' -> {total}")
                    break

        # If no total found with keywords, look for dollar amounts in the bottom part of the receipt
        if not receipt_data["total"] or receipt_data["total"] == 0:
            # Look at the bottom third of the receipt for dollar amounts
            bottom_lines = lines[len(lines)//3*2:] if len(lines) > 3 else lines
            largest_amount = 0
            for line in bottom_lines:
                amount = self._extract_amount(line)
                if amount and amount > largest_amount:
                    largest_amount = amount

            if largest_amount > 0:
                receipt_data["total"] = largest_amount
                logger.info(f"Extracted total from largest amount: {largest_amount}")

        # Extract tax
        for line in lines:
            if 'tax' in line.lower():
                tax = self._extract_amount(line)
                if tax:
                    receipt_data["tax"] = tax
                    break

        # Extract items (more complex)
        items = self._extract_items_from_text(lines)
        receipt_data["items"] = items

        # If no items were found, create at least one default item with the total amount
        if not items and receipt_data["total"] > 0:
            default_item = {
                "name": receipt_data["vendor"] or "Purchase",
                "quantity": 1,
                "price": receipt_data["total"]
            }
            receipt_data["items"] = [default_item]
            logger.info(f"No items found, created default item: {default_item}")
        else:
            logger.info(f"Extracted {len(items)} items")

        return receipt_data

    def _extract_date(self, text: str) -> Optional[str]:
        """Extract date from text."""
        # Try various date formats
        date_patterns = [
            # MM/DD/YYYY or MM-DD-YYYY
            r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',
            # DD/MM/YYYY or DD-MM-YYYY
            r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',
            # YYYY/MM/DD or YYYY-MM-DD
            r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})',
            # Month DD, YYYY
            r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{1,2}),? (\d{4})',
            # DD Month YYYY
            r'(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})'
        ]

        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    if len(match.groups()) == 3:
                        # Try to determine the format
                        if re.match(r'\d{4}', match.group(1)):  # YYYY-MM-DD
                            year, month, day = match.groups()
                        elif re.match(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', match.group(1), re.IGNORECASE):  # Month DD, YYYY
                            month_str, day, year = match.groups()
                            month_map = {
                                'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                                'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
                            }
                            month = month_map.get(month_str.lower()[:3], 1)
                        elif re.match(r'\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', match.group(1) + ' ' + match.group(2), re.IGNORECASE):  # DD Month YYYY
                            day, month_str, year = match.groups()
                            month_map = {
                                'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                                'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
                            }
                            month = month_map.get(month_str.lower()[:3], 1)
                        else:  # Assume MM/DD/YYYY for US receipts
                            month, day, year = match.groups()

                        # Handle 2-digit years
                        if len(str(year)) == 2:
                            year = '20' + str(year)

                        # Format as YYYY-MM-DD
                        date_str = f"{int(year):04d}-{int(month):02d}-{int(day):02d}"

                        # Validate date
                        datetime.strptime(date_str, '%Y-%m-%d')
                        return date_str
                except (ValueError, IndexError):
                    continue

        # If no date found, return today's date
        return datetime.now().strftime('%Y-%m-%d')

    def _extract_amount(self, text: str) -> Optional[float]:
        """Extract monetary amount from text."""
        # Skip empty text
        if not text or len(text) < 2:
            return None

        # First, try to find dollar amounts with decimal points (most reliable)
        dollar_pattern = r'\$?(\d+\.\d{2})'
        dollar_matches = re.findall(dollar_pattern, text)
        if dollar_matches:
            # Get the largest dollar amount
            try:
                return max(float(amount) for amount in dollar_matches)
            except ValueError:
                pass

        # If no dollar amounts found, try to find any decimal numbers
        # Remove common currency symbols
        cleaned_text = text.replace('$', '').replace('€', '').replace('£', '').replace('¥', '')

        # Look for patterns like "Total: 123.45" or "123.45" or "123,45"
        amount_pattern = r'[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?'
        amounts = re.findall(amount_pattern, cleaned_text)

        if amounts:
            # Get the largest amount (usually the total)
            try:
                # Filter out very large numbers (likely not prices)
                valid_amounts = [float(amount.replace(',', '.')) for amount in amounts if float(amount.replace(',', '.')) < 10000]
                if valid_amounts:
                    return max(valid_amounts)
            except ValueError:
                pass

        # If still no amount found, look for numbers after keywords
        for keyword in ['total', 'amount', 'sum', 'balance', 'due', 'payment']:
            if keyword in text.lower():
                # Find the position of the keyword
                keyword_pos = text.lower().find(keyword)
                # Look for numbers after the keyword
                after_keyword = text[keyword_pos + len(keyword):]
                numbers = re.findall(r'\d+\.?\d*', after_keyword)
                if numbers:
                    try:
                        # Use the first number after the keyword
                        return float(numbers[0].replace(',', '.'))
                    except ValueError:
                        pass

        return None

    def _parse_item_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse an item line into structured data."""
        # Try to extract item name, quantity, and price
        # Pattern: Item name followed by quantity and price
        # Examples: "Milk 2 x $3.99" or "Bread $2.49" or "Eggs (12) $4.99"

        # Skip lines that are too short or don't have any alphanumeric characters
        if len(line) < 3 or not re.search(r'[a-zA-Z0-9]', line):
            return None

        # First, try to extract quantity and price pattern like "2 x $3.99"
        quantity_price_pattern = r'(\d+)\s*x\s*\$?(\d+\.?\d*)'
        quantity_match = re.search(quantity_price_pattern, line)

        if quantity_match:
            # Extract quantity and price
            quantity = int(quantity_match.group(1))
            price = float(quantity_match.group(2))

            # Extract item name (everything before the quantity)
            name = line[:quantity_match.start()].strip()

            # Clean up the name
            name = re.sub(r'[\$\*\#\@\%\&]', '', name).strip()

            if name:  # Only return if we have a name
                return {
                    "name": name,
                    "quantity": quantity,
                    "price": price
                }

        # Try to extract quantity in parentheses like "Eggs (12) $4.99"
        paren_quantity_pattern = r'\((\d+)\)\s*\$?(\d+\.?\d*)'
        paren_match = re.search(paren_quantity_pattern, line)

        if paren_match:
            # Extract quantity and price
            quantity = int(paren_match.group(1))
            price = float(paren_match.group(2))

            # Extract item name (everything before the parentheses)
            name = line[:paren_match.start()].strip()

            # Clean up the name
            name = re.sub(r'[\$\*\#\@\%\&]', '', name).strip()

            if name:  # Only return if we have a name
                return {
                    "name": name,
                    "quantity": quantity,
                    "price": price
                }

        # If no quantity pattern found, try to extract just the price
        # Look for a price pattern like "$12.34" or "12.34"
        price_pattern = r'\$?(\d+\.\d{2})'
        price_match = re.search(price_pattern, line)

        if price_match:
            # Extract price
            price = float(price_match.group(1))

            # Extract item name (everything before the price)
            name = line[:price_match.start()].strip()

            # Clean up the name
            name = re.sub(r'[\$\*\#\@\%\&]', '', name).strip()

            if name:  # Only return if we have a name
                return {
                    "name": name,
                    "quantity": 1,
                    "price": price
                }

        # If no price pattern found, try to find any number that might be a price
        numbers = re.findall(r'\d+\.?\d*', line)
        if numbers:
            # Try to find a number that looks like a price (has a decimal point)
            prices = [float(num) for num in numbers if '.' in num]
            if prices:
                price = max(prices)  # Use the largest number as the price

                # Extract item name (remove all numbers and symbols)
                name = re.sub(r'\d+\.?\d*', '', line).strip()
                name = re.sub(r'[\$\*\#\@\%\&]', '', name).strip()

                if name:  # Only return if we have a name
                    return {
                        "name": name,
                        "quantity": 1,
                        "price": price
                    }
            else:
                # If no decimal numbers, use the largest integer as the price
                price = max([float(num) for num in numbers])

                # Extract item name (remove all numbers and symbols)
                name = re.sub(r'\d+', '', line).strip()
                name = re.sub(r'[\$\*\#\@\%\&]', '', name).strip()

                if name and price > 0:  # Only return if we have a name and positive price
                    return {
                        "name": name,
                        "quantity": 1,
                        "price": price
                    }

        # If we couldn't extract a price but the line looks like an item name
        if re.match(r'^[a-zA-Z\s]+$', line.strip()) and len(line.strip()) > 3:
            return {
                "name": line.strip(),
                "quantity": 1,
                "price": 0.0  # No price found
            }

        return None  # Couldn't parse this line as an item

    def _extract_items_from_text(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Extract items from receipt text."""
        items = []
        logger.info("Attempting to extract items from receipt text")

        # Look for a section that might contain items
        item_section_started = False
        item_section_ended = False

        # First pass: Try to find an item section with header
        for i, line in enumerate(lines):
            # Skip empty lines
            if not line.strip():
                continue

            # Check if this line might be the start of the item section
            if not item_section_started and any(word in line.lower() for word in ['item', 'description', 'qty', 'quantity', 'price', 'amount', 'product']):
                item_section_started = True
                logger.info(f"Found potential item section start at line {i}: '{line}'")
                continue

            # Check if this line might be the end of the item section
            if item_section_started and not item_section_ended and any(word in line.lower() for word in ['subtotal', 'total', 'tax', 'amount', 'balance', 'due', 'payment']):
                item_section_ended = True
                logger.info(f"Found potential item section end at line {i}: '{line}'")
                continue

            # If we're in the item section, try to parse the line as an item
            if item_section_started and not item_section_ended:
                item = self._parse_item_line(line)
                if item and item["name"]:
                    items.append(item)
                    logger.info(f"Extracted item from section: {item}")

        # Second pass: If we couldn't find an item section, look for price patterns in all lines
        if not items:
            logger.info("No item section found, looking for price patterns in all lines")
            for i, line in enumerate(lines):
                # Skip lines that are likely not items
                if any(word in line.lower() for word in ['receipt', 'date', 'time', 'tel', 'phone', 'address', 'thank', 'total', 'tax', 'subtotal', 'balance', 'due', 'payment']):
                    continue

                # Look for price patterns (e.g., $12.34)
                price_match = re.search(r'\$?\d+\.\d{2}', line)
                if price_match:
                    # Try to parse as an item
                    item = self._parse_item_line(line)
                    if item and item["name"] and item["price"] > 0:
                        items.append(item)
                        logger.info(f"Extracted item from line {i}: {item}")

        # Third pass: If still no items, look for any line with numbers that might be a price
        if not items:
            logger.info("No items with price patterns found, looking for any numbers")
            for i, line in enumerate(lines):
                # Skip header/footer lines
                if any(word in line.lower() for word in ['receipt', 'date', 'time', 'tel', 'phone', 'address', 'thank', 'total', 'tax', 'subtotal']):
                    continue

                # If the line has any numbers, try to extract an item
                if re.search(r'\d', line):
                    # Try to extract a price
                    price = self._extract_amount(line)
                    if price and price > 0:
                        # Extract item name (everything before the price)
                        name = line
                        # Remove any numbers and common symbols from the name
                        name = re.sub(r'\$?\d+\.?\d*', '', name).strip()
                        # Remove common symbols
                        name = re.sub(r'[\$\*\#\@\%\&]', '', name).strip()

                        if name:
                            item = {
                                "name": name,
                                "quantity": 1,
                                "price": price
                            }
                            items.append(item)
                            logger.info(f"Extracted item from line {i} with numbers: {item}")

        logger.info(f"Total items extracted: {len(items)}")
        return items
