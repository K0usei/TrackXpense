"""
Scheduled task to retrain models using collected feedback.
"""
import os
import sys
import logging
import argparse
from pathlib import Path
from datetime import datetime

# Add the parent directory to the path to import the services
sys.path.append(str(Path(__file__).parent.parent))
from services.model_retrainer import ModelRetrainer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Retrain models using collected feedback')
    parser.add_argument('--feedback-dir', type=str, default='data/feedback', help='Directory containing feedback data')
    parser.add_argument('--data-dir', type=str, default='data', help='Directory containing training data')
    parser.add_argument('--model-dir', type=str, default='models', help='Directory containing models')
    parser.add_argument('--min-feedback', type=int, default=10, help='Minimum number of feedback entries required for retraining')
    parser.add_argument('--force', action='store_true', help='Force retraining even if minimum feedback count is not met')
    return parser.parse_args()

def main():
    """Main function to retrain models."""
    args = parse_args()
    
    logger.info("Starting model retraining task...")
    
    # Initialize model retrainer
    retrainer = ModelRetrainer(
        feedback_dir=args.feedback_dir,
        data_dir=args.data_dir,
        model_dir=args.model_dir,
        min_feedback_count=0 if args.force else args.min_feedback
    )
    
    # Check if retraining is needed
    field_retraining_needed, category_retraining_needed = retrainer.check_retraining_needed()
    
    if args.force:
        logger.info("Forcing retraining regardless of feedback count.")
        field_retraining_needed = True
        category_retraining_needed = True
    
    if not field_retraining_needed and not category_retraining_needed:
        logger.info("No retraining needed. Exiting.")
        return
    
    # Retrain models
    results = retrainer.retrain_models()
    
    # Log results
    for model, success in results.items():
        if success:
            logger.info(f"{model} retraining successful.")
        else:
            logger.warning(f"{model} retraining failed.")
    
    logger.info("Model retraining task completed.")

if __name__ == "__main__":
    main()
