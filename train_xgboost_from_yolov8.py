"""
Script to train XGBoost model using YOLOv8 dataset.
This script:
1. Converts YOLOv8 annotations to XGBoost training format
2. Trains the XGBoost model
3. Evaluates and saves the model
"""
import os
import argparse
import logging
import subprocess
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Train XGBoost model using YOLOv8 dataset')
    parser.add_argument('--yolo-dir', type=str, required=True, 
                        help='Directory containing YOLOv8 dataset')
    parser.add_argument('--data-dir', type=str, default='data', 
                        help='Directory to store data')
    parser.add_argument('--model-dir', type=str, default='models', 
                        help='Directory to store model')
    parser.add_argument('--skip-conversion', action='store_true', 
                        help='Skip converting annotations')
    parser.add_argument('--skip-training', action='store_true', 
                        help='Skip training the model')
    parser.add_argument('--class-map-file', type=str, default=None,
                        help='Path to a YAML file containing class mapping')
    parser.add_argument('--ocr', action='store_true',
                        help='Run OCR on images to extract text (required for text-based features)')
    return parser.parse_args()

def convert_annotations(yolo_dir, output_dir, class_map_file=None, run_ocr=False):
    """Convert YOLOv8 annotations to XGBoost training format."""
    logger.info("Converting YOLOv8 annotations to XGBoost training format")
    
    # Run the conversion script
    cmd = [
        sys.executable,
        "backend/ml/yolov8_to_xgboost.py",
        "--yolo-dir", yolo_dir,
        "--output-dir", output_dir
    ]
    
    if class_map_file:
        cmd.extend(["--class-map-file", class_map_file])
    
    if run_ocr:
        cmd.append("--ocr")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        logger.error(f"Conversion failed: {result.stderr}")
        return False
    
    logger.info(f"Conversion output: {result.stdout}")
    return True

def train_model(data_dir, model_dir):
    """Train the XGBoost model."""
    logger.info("Training XGBoost model")
    
    # Run the training script
    cmd = [
        sys.executable,
        "backend/ml/train_xgboost.py",
        "--data-dir", data_dir,
        "--model-dir", model_dir
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        logger.error(f"Training failed: {result.stderr}")
        return False
    
    logger.info(f"Training output: {result.stdout}")
    return True

def main():
    """Main function."""
    args = parse_args()
    
    # Create directories
    os.makedirs(args.data_dir, exist_ok=True)
    os.makedirs(args.model_dir, exist_ok=True)
    
    # Step 1: Convert annotations
    if not args.skip_conversion:
        success = convert_annotations(
            yolo_dir=args.yolo_dir,
            output_dir=args.data_dir,
            class_map_file=args.class_map_file,
            run_ocr=args.ocr
        )
        if not success:
            logger.error("Failed to convert annotations. Exiting.")
            return
    
    # Step 2: Train model
    if not args.skip_training:
        success = train_model(
            data_dir=args.data_dir,
            model_dir=args.model_dir
        )
        if not success:
            logger.error("Failed to train model. Exiting.")
            return
    
    logger.info("Process completed successfully!")
    logger.info(f"Model saved to {args.model_dir}/category_model.joblib")

if __name__ == "__main__":
    main()
