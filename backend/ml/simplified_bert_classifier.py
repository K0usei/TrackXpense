"""
Simplified version of the BERT field classifier that doesn't require PyTorch.
This is a rule-based classifier that mimics the behavior of the BERT model.
"""
import re
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
import os
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define constants
LABEL_MAP = {
    'STORE': 0,
    'DATE': 1,
    'TOTAL': 2,
    'ITEM': 3,
    'O': 4  # Other
}

REVERSE_LABEL_MAP = {v: k for k, v in LABEL_MAP.items()}

class SimplifiedFieldClassifier:
    """Rule-based classifier for receipt fields."""
    
    def __init__(self, model_dir: str = 'models/simplified_receipt_classifier'):
        """Initialize the classifier."""
        self.model_dir = Path(model_dir)
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Define patterns for each field
        self.patterns = {
            'STORE': [
                r'^[A-Z\s]+$',  # All caps store names
                r'^[A-Z][a-z]+\s?[A-Za-z]*$',  # Capitalized store names
                r'(store|restaurant|cafe|shop|market)',  # Keywords
            ],
            'DATE': [
                r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',  # MM/DD/YYYY or DD/MM/YYYY
                r'\d{4}[/-]\d{1,2}[/-]\d{1,2}',  # YYYY/MM/DD
                r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}',  # Month DD, YYYY
                r'\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}',  # DD Month YYYY
                r'date:?\s*\d',  # Date: followed by digits
            ],
            'TOTAL': [
                r'total:?\s*\$?\d+\.?\d*',  # Total: $123.45
                r'amount:?\s*\$?\d+\.?\d*',  # Amount: $123.45
                r'sum:?\s*\$?\d+\.?\d*',  # Sum: $123.45
                r'^\$?\d+\.\d{2}$',  # Just a price like $123.45
            ],
            'ITEM': [
                r'.+\s+\d+\s*x\s*\$?\d+\.\d{2}',  # Item 2 x $3.99
                r'.+\s+\$?\d+\.\d{2}',  # Item $3.99
                r'.+\(\d+\)\s+\$?\d+\.\d{2}',  # Item (2) $3.99
            ]
        }
    
    def train(self, data_path: str):
        """Train the classifier (just saves the patterns)."""
        # Save patterns to JSON file
        with open(self.model_dir / 'patterns.json', 'w') as f:
            json.dump(self.patterns, f, indent=2)
        
        logger.info(f"Saved patterns to {self.model_dir / 'patterns.json'}")
        
        # Save label map
        with open(self.model_dir / 'label_map.json', 'w') as f:
            json.dump(LABEL_MAP, f, indent=2)
        
        logger.info(f"Saved label map to {self.model_dir / 'label_map.json'}")
        
        return 1.0  # Perfect accuracy for rule-based system
    
    def load_model(self):
        """Load the patterns."""
        if (self.model_dir / 'patterns.json').exists():
            with open(self.model_dir / 'patterns.json', 'r') as f:
                self.patterns = json.load(f)
            
            logger.info(f"Loaded patterns from {self.model_dir / 'patterns.json'}")
        
        if (self.model_dir / 'label_map.json').exists():
            with open(self.model_dir / 'label_map.json', 'r') as f:
                label_map = json.load(f)
                global LABEL_MAP, REVERSE_LABEL_MAP
                LABEL_MAP = {k: int(v) for k, v in label_map.items()}
                REVERSE_LABEL_MAP = {v: k for k, v in LABEL_MAP.items()}
            
            logger.info(f"Loaded label map from {self.model_dir / 'label_map.json'}")
    
    def predict(self, texts: List[str]) -> List[str]:
        """Predict labels for a list of texts."""
        predictions = []
        
        for text in texts:
            # Check each pattern
            label = 'O'  # Default to Other
            
            for field, patterns in self.patterns.items():
                for pattern in patterns:
                    if re.search(pattern, text, re.IGNORECASE):
                        label = field
                        break
                
                if label != 'O':
                    break
            
            predictions.append(label)
        
        return predictions

def generate_bert_training_data(receipts_path: str, output_path: str):
    """Generate training data for BERT from synthetic receipts."""
    with open(receipts_path, 'r') as f:
        receipts = json.load(f)
    
    # Extract lines for BERT training
    bert_data = []
    
    for receipt in receipts:
        # Generate some labeled lines
        vendor = receipt['vendor']
        bert_data.append({
            "text": vendor,
            "label": "STORE"
        })
        
        # Date
        date_str = receipt['date']
        bert_data.append({
            "text": f"Date: {date_str}",
            "label": "DATE"
        })
        
        # Total
        total = receipt['amount']
        bert_data.append({
            "text": f"Total: ${total:.2f}",
            "label": "TOTAL"
        })
        
        # Items (use description as an item)
        description = receipt['description']
        bert_data.append({
            "text": f"{description} ${total:.2f}",
            "label": "ITEM"
        })
        
        # Other lines
        bert_data.append({
            "text": f"Thank you for your purchase!",
            "label": "O"
        })
        
        bert_data.append({
            "text": f"Receipt #: {np.random.randint(10000, 99999)}",
            "label": "O"
        })
    
    # Save BERT training data as CSV
    bert_df = pd.DataFrame(bert_data)
    bert_df.to_csv(output_path, index=False)
    
    logger.info(f"Generated BERT training data with {len(bert_data)} samples")
    logger.info(f"Saved to {output_path}")

def main():
    """Main function to train the simplified classifier."""
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Generate BERT training data
    bert_data_path = 'data/bert_training_data.csv'
    receipts_path = 'data/synthetic_receipts.json'
    
    if not os.path.exists(receipts_path):
        logger.warning(f"Receipts file not found at {receipts_path}")
        logger.warning("Please run data_generator.py first")
        return
    
    if not os.path.exists(bert_data_path):
        logger.info("Generating BERT training data...")
        generate_bert_training_data(receipts_path, bert_data_path)
    
    # Train simplified classifier
    logger.info("Training simplified classifier...")
    classifier = SimplifiedFieldClassifier()
    classifier.train(bert_data_path)
    
    logger.info("Training complete!")

if __name__ == "__main__":
    main()
