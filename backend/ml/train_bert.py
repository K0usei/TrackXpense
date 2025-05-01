"""
Script to train the BERT model for receipt field classification.
"""
import os
import json
import logging
import argparse
from pathlib import Path
from ml.bert_field_classifier import BERTFieldClassifier, generate_bert_training_data
from ml.data_generator import generate_synthetic_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Train BERT model for receipt field classification')
    parser.add_argument('--data-dir', type=str, default='data', help='Directory to store data')
    parser.add_argument('--model-dir', type=str, default='models/bert_receipt_classifier', help='Directory to store model')
    parser.add_argument('--n-samples', type=int, default=1000, help='Number of synthetic samples to generate')
    parser.add_argument('--batch-size', type=int, default=16, help='Batch size for training')
    parser.add_argument('--epochs', type=int, default=4, help='Number of epochs for training')
    parser.add_argument('--learning-rate', type=float, default=2e-5, help='Learning rate for training')
    parser.add_argument('--force-generate', action='store_true', help='Force regeneration of synthetic data')
    return parser.parse_args()

def main():
    """Main function to train the BERT model."""
    args = parse_args()

    # Create directories if they don't exist
    os.makedirs(args.data_dir, exist_ok=True)
    os.makedirs(args.model_dir, exist_ok=True)

    # Define paths
    receipts_path = os.path.join(args.data_dir, 'synthetic_receipts.json')
    bert_data_path = os.path.join(args.data_dir, 'bert_training_data.csv')
    xgboost_data_path = os.path.join(args.data_dir, 'xgboost_training_data.csv')

    # Generate synthetic data if needed or forced
    if not os.path.exists(receipts_path) or args.force_generate:
        logger.info(f"Generating {args.n_samples} synthetic receipts...")
        generate_synthetic_data(receipts_path, args.n_samples)

    # Generate BERT training data if needed or forced
    if not os.path.exists(bert_data_path) or args.force_generate:
        logger.info("Generating BERT training data...")
        generate_bert_training_data(receipts_path, bert_data_path)

    # Train BERT model
    logger.info("Training BERT model...")
    classifier = BERTFieldClassifier(model_dir=args.model_dir)
    accuracy = classifier.train(
        bert_data_path,
        batch_size=args.batch_size,
        epochs=args.epochs,
        learning_rate=args.learning_rate
    )

    logger.info(f"Training complete. Final accuracy: {accuracy:.4f}")
    logger.info(f"Model saved to {args.model_dir}")

if __name__ == "__main__":
    main()
