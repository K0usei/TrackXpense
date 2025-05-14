"""
Script to convert YOLOv8 format data to XGBoost training data format.
"""
import os
import argparse
import logging
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional
import cv2
import easyocr
from PIL import Image
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Convert YOLOv8 data to XGBoost training data')
    parser.add_argument('--yolo-dir', type=str, required=True, 
                        help='Directory containing YOLOv8 dataset')
    parser.add_argument('--output-dir', type=str, default='data',
                        help='Directory to save the processed data')
    parser.add_argument('--ocr', action='store_true',
                        help='Run OCR on images to extract text (required for text-based features)')
    parser.add_argument('--class-map-file', type=str, default=None,
                        help='Path to a YAML file containing class mapping')
    return parser.parse_args()

class YOLOv8Converter:
    """Convert YOLOv8 data to XGBoost training data."""
    
    def __init__(self, yolo_dir: str, output_dir: str, run_ocr: bool = False, class_map_file: str = None):
        """Initialize the converter."""
        self.yolo_dir = Path(yolo_dir)
        self.output_dir = Path(output_dir)
        self.run_ocr = run_ocr
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize OCR reader if needed
        self.reader = None
        if run_ocr:
            logger.info("Initializing EasyOCR...")
            self.reader = easyocr.Reader(['en'])
        
        # Load class mapping
        self.class_map = self.load_class_map(class_map_file)
        
    def load_class_map(self, class_map_file: str = None) -> Dict[int, str]:
        """Load class mapping from file or use default."""
        if class_map_file and os.path.exists(class_map_file):
            import yaml
            with open(class_map_file, 'r') as f:
                data = yaml.safe_load(f)
                if 'names' in data:
                    return {i: name for i, name in enumerate(data['names'])}
        
        # Default class mapping based on data.yaml
        return {
            0: 'Address',
            1: 'Date',
            2: 'Item',
            3: 'OrderId',
            4: 'Subtotal',
            5: 'Tax',
            6: 'Title',
            7: 'TotalPrice'
        }
    
    def extract_text_from_image(self, image_path: str) -> str:
        """Extract text from image using OCR."""
        if not self.reader:
            return ""
        
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                logger.warning(f"Failed to read image: {image_path}")
                return ""
            
            # Run OCR
            results = self.reader.readtext(image)
            
            # Extract text
            text = " ".join([result[1] for result in results])
            
            return text
        except Exception as e:
            logger.error(f"Error extracting text from image {image_path}: {e}")
            return ""
    
    def extract_amount(self, text: str) -> float:
        """Extract amount from text."""
        # Look for patterns like $123.45 or 123.45
        amount_pattern = r'\$?(\d+\.\d{2})'
        matches = re.findall(amount_pattern, text)
        
        if matches:
            # Return the largest amount
            return max([float(match) for match in matches])
        
        return 0.0
    
    def parse_yolo_label(self, label_path: str, image_path: str, image_width: int, image_height: int) -> Dict[str, Any]:
        """Parse YOLO label file and extract information."""
        result = {
            'Store': "",
            'Items': "",
            'Amount': 0.0,
            'Category': "Others",  # Default category
            'ImagePath': image_path
        }
        
        try:
            # Read label file
            with open(label_path, 'r') as f:
                lines = f.readlines()
            
            # Extract information from each line
            for line in lines:
                parts = line.strip().split()
                if len(parts) < 5:
                    continue
                
                class_id = int(parts[0])
                x_center = float(parts[1]) * image_width
                y_center = float(parts[2]) * image_height
                width = float(parts[3]) * image_width
                height = float(parts[4]) * image_height
                
                # Calculate bounding box coordinates
                x1 = int(x_center - width / 2)
                y1 = int(y_center - height / 2)
                x2 = int(x_center + width / 2)
                y2 = int(y_center + height / 2)
                
                # Get class name
                class_name = self.class_map.get(class_id, f"Class_{class_id}")
                
                # Extract text from this region if OCR is enabled
                if self.run_ocr:
                    try:
                        image = cv2.imread(image_path)
                        if image is not None:
                            # Ensure coordinates are within image bounds
                            x1 = max(0, x1)
                            y1 = max(0, y1)
                            x2 = min(image.shape[1], x2)
                            y2 = min(image.shape[0], y2)
                            
                            # Extract region
                            region = image[y1:y2, x1:x2]
                            
                            # Run OCR on region
                            if region.size > 0:
                                region_results = self.reader.readtext(region)
                                region_text = " ".join([r[1] for r in region_results])
                                
                                # Update result based on class
                                if class_name == 'Title':
                                    result['Store'] = region_text
                                elif class_name == 'Item':
                                    if result['Items']:
                                        result['Items'] += ", " + region_text
                                    else:
                                        result['Items'] = region_text
                                elif class_name == 'TotalPrice':
                                    amount = self.extract_amount(region_text)
                                    if amount > 0:
                                        result['Amount'] = amount
                    except Exception as e:
                        logger.error(f"Error processing region for {class_name} in {image_path}: {e}")
            
            return result
        except Exception as e:
            logger.error(f"Error parsing YOLO label {label_path}: {e}")
            return result
    
    def process_dataset(self) -> pd.DataFrame:
        """Process the entire dataset."""
        data = []
        
        # Get train directory
        train_dir = self.yolo_dir / 'train'
        images_dir = train_dir / 'images'
        labels_dir = train_dir / 'labels'
        
        if not images_dir.exists() or not labels_dir.exists():
            logger.error(f"Images or labels directory not found in {train_dir}")
            return pd.DataFrame()
        
        # Get all label files
        label_files = list(labels_dir.glob('*.txt'))
        logger.info(f"Found {len(label_files)} label files")
        
        # Process each label file
        for i, label_file in enumerate(label_files):
            if i % 100 == 0:
                logger.info(f"Processing file {i+1}/{len(label_files)}")
            
            # Get corresponding image file
            image_name = label_file.stem.split('.')[0]  # Remove .rf.XXXX suffix
            image_files = list(images_dir.glob(f"{image_name}*"))
            
            if not image_files:
                logger.warning(f"No image found for label {label_file}")
                continue
            
            image_path = str(image_files[0])
            
            # Get image dimensions
            try:
                image = cv2.imread(image_path)
                if image is None:
                    logger.warning(f"Failed to read image: {image_path}")
                    continue
                
                image_height, image_width = image.shape[:2]
                
                # Parse label file
                result = self.parse_yolo_label(str(label_file), image_path, image_width, image_height)
                
                # Add to data
                data.append(result)
            except Exception as e:
                logger.error(f"Error processing {image_path}: {e}")
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Basic cleaning
        df['Store'] = df['Store'].fillna('')
        df['Items'] = df['Items'].fillna('')
        df['Amount'] = df['Amount'].fillna(0.0)
        df['Category'] = df['Category'].fillna('Others')
        
        return df
    
    def convert(self) -> str:
        """Convert YOLOv8 data to XGBoost training data."""
        # Process dataset
        df = self.process_dataset()
        if df.empty:
            logger.error("No data processed. Exiting.")
            return ""
        
        # Save to CSV
        output_path = self.output_dir / 'xgboost_training_data.csv'
        df.to_csv(output_path, index=False)
        logger.info(f"Saved {len(df)} records to {output_path}")
        
        return str(output_path)

def main():
    """Main function."""
    args = parse_args()
    
    converter = YOLOv8Converter(
        yolo_dir=args.yolo_dir,
        output_dir=args.output_dir,
        run_ocr=args.ocr,
        class_map_file=args.class_map_file
    )
    
    output_path = converter.convert()
    
    if output_path:
        logger.info(f"Conversion complete. Data saved to {output_path}")
        logger.info("You can now train the XGBoost model using:")
        logger.info(f"python train_xgboost.py --data-dir {args.output_dir}")
    else:
        logger.error("Conversion failed.")

if __name__ == "__main__":
    main()
