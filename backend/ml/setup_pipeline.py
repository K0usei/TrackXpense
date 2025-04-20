"""
Script to set up the entire receipt processing pipeline.
This script will:
1. Generate synthetic data
2. Train the simplified BERT model
3. Train the XGBoost model
"""
import os
import logging
import argparse
import subprocess
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Set up the receipt processing pipeline')
    parser.add_argument('--data-dir', type=str, default='data', help='Directory to store data')
    parser.add_argument('--model-dir', type=str, default='models', help='Directory to store models')
    parser.add_argument('--n-samples', type=int, default=10000, help='Number of synthetic samples to generate')
    parser.add_argument('--force-generate', action='store_true', help='Force regeneration of synthetic data')
    parser.add_argument('--skip-bert', action='store_true', help='Skip BERT training')
    parser.add_argument('--skip-xgboost', action='store_true', help='Skip XGBoost training')
    return parser.parse_args()

def run_command(command):
    """Run a command and log the output."""
    logger.info(f"Running command: {command}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        logger.info(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed with exit code {e.returncode}")
        logger.error(e.stderr)
        return False

def main():
    """Main function to set up the pipeline."""
    args = parse_args()
    
    # Create directories if they don't exist
    os.makedirs(args.data_dir, exist_ok=True)
    os.makedirs(args.model_dir, exist_ok=True)
    os.makedirs(os.path.join(args.model_dir, 'simplified_receipt_classifier'), exist_ok=True)
    
    # Step 1: Generate synthetic data
    logger.info("Step 1: Generating synthetic data...")
    data_path = os.path.join(args.data_dir, 'transactions.csv')
    force_flag = '--force-generate' if args.force_generate else ''
    
    if not os.path.exists(data_path) or args.force_generate:
        success = run_command(f"python data_generator.py --data-dir {args.data_dir} --n-samples {args.n_samples} {force_flag}")
        if not success:
            logger.error("Failed to generate synthetic data. Exiting.")
            return
    else:
        logger.info(f"Data already exists at {data_path}. Skipping generation.")
    
    # Step 2: Train the simplified BERT model
    if not args.skip_bert:
        logger.info("Step 2: Training simplified BERT model...")
        bert_model_dir = os.path.join(args.model_dir, 'simplified_receipt_classifier')
        success = run_command(f"python train_simplified_bert.py --data-dir {args.data_dir} --model-dir {bert_model_dir} {force_flag}")
        if not success:
            logger.warning("Failed to train simplified BERT model. Continuing with pipeline.")
    else:
        logger.info("Skipping BERT training as requested.")
    
    # Step 3: Train the XGBoost model
    if not args.skip_xgboost:
        logger.info("Step 3: Training XGBoost model...")
        success = run_command(f"python train_xgboost.py --data-dir {args.data_dir} --model-dir {args.model_dir} {force_flag}")
        if not success:
            logger.warning("Failed to train XGBoost model. Continuing with pipeline.")
    else:
        logger.info("Skipping XGBoost training as requested.")
    
    logger.info("Pipeline setup complete!")

if __name__ == "__main__":
    main()
