"""
Script to train the simplified BERT model for receipt field classification.
"""
import os
import json
import logging
import argparse
from pathlib import Path
from simplified_bert_classifier import SimplifiedFieldClassifier, generate_bert_training_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Train simplified classifier for receipt field classification')
    parser.add_argument('--data-dir', type=str, default='data', help='Directory to store data')
    parser.add_argument('--model-dir', type=str, default='models/simplified_receipt_classifier', help='Directory to store model')
    parser.add_argument('--force-generate', action='store_true', help='Force regeneration of training data')
    return parser.parse_args()

def main():
    """Main function to train the simplified classifier."""
    args = parse_args()
    
    # Create directories if they don't exist
    os.makedirs(args.data_dir, exist_ok=True)
    os.makedirs(args.model_dir, exist_ok=True)
    
    # Define paths
    receipts_path = os.path.join(args.data_dir, 'synthetic_receipts.json')
    bert_data_path = os.path.join(args.data_dir, 'bert_training_data.csv')
    
    # Check if receipts file exists
    if not os.path.exists(receipts_path):
        logger.warning(f"Receipts file not found at {receipts_path}")
        logger.warning("Please run data_generator.py first")
        return
    
    # Generate BERT training data if needed or forced
    if not os.path.exists(bert_data_path) or args.force_generate:
        logger.info("Generating BERT training data...")
        generate_bert_training_data(receipts_path, bert_data_path)
    
    # Train simplified classifier
    logger.info("Training simplified classifier...")
    classifier = SimplifiedFieldClassifier(model_dir=args.model_dir)
    accuracy = classifier.train(bert_data_path)
    
    logger.info(f"Training complete. Accuracy: {accuracy:.4f}")
    logger.info(f"Model saved to {args.model_dir}")

if __name__ == "__main__":
    main()
