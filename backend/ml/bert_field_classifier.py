"""
BERT-based model for classifying receipt text lines into fields.
"""
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import BertTokenizer, BertForSequenceClassification, AdamW
from transformers import get_linear_schedule_with_warmup
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import os
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import logging

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
    'ITEM': 2,
    'QTY': 3,
    'PRICE': 4,
    'SUBTOTAL': 5,
    'TAX': 6,
    'DISCOUNT': 7,
    'CHANGE': 8,
    'TOTAL': 9,
    'O': 10  # Other
}

REVERSE_LABEL_MAP = {v: k for k, v in LABEL_MAP.items()}

class ReceiptDataset(Dataset):
    """Dataset for receipt text classification."""

    def __init__(self, texts: List[str], labels: List[int], tokenizer: BertTokenizer, max_length: int = 128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

class BERTFieldClassifier:
    """BERT-based model for classifying receipt text lines into fields."""

    def __init__(self, model_dir: str = 'models/bert_receipt_classifier'):
        self.model_dir = Path(model_dir)
        self.model = None
        self.tokenizer = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")

    def load_data(self, data_path: str) -> Tuple[List[str], List[int]]:
        """Load and preprocess data for training."""
        logger.info(f"Loading data from {data_path}")

        df = pd.read_csv(data_path)

        # Convert string labels to integers
        df['label_id'] = df['label'].map(LABEL_MAP)

        # Check for missing values
        if df['label_id'].isna().any():
            logger.warning("Found missing label mappings. Check your data.")
            missing_labels = df[df['label_id'].isna()]['label'].unique()
            logger.warning(f"Missing labels: {missing_labels}")
            df = df.dropna(subset=['label_id'])

        texts = df['text'].tolist()
        labels = df['label_id'].astype(int).tolist()

        return texts, labels

    def train(self, data_path: str, batch_size: int = 16, epochs: int = 4, learning_rate: float = 2e-5):
        """Train the BERT model on receipt data."""
        # Create model directory if it doesn't exist
        os.makedirs(self.model_dir, exist_ok=True)

        # Load data
        texts, labels = self.load_data(data_path)

        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )

        logger.info(f"Training on {len(X_train)} samples, validating on {len(X_val)} samples")

        # Initialize tokenizer and model
        self.tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
        self.model = BertForSequenceClassification.from_pretrained(
            'bert-base-uncased',
            num_labels=len(LABEL_MAP),
            output_attentions=False,
            output_hidden_states=False
        )

        self.model.to(self.device)

        # Create datasets and dataloaders
        train_dataset = ReceiptDataset(X_train, y_train, self.tokenizer)
        val_dataset = ReceiptDataset(X_val, y_val, self.tokenizer)

        train_dataloader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_dataloader = DataLoader(val_dataset, batch_size=batch_size)

        # Set up optimizer and scheduler
        optimizer = AdamW(self.model.parameters(), lr=learning_rate, eps=1e-8)

        total_steps = len(train_dataloader) * epochs
        scheduler = get_linear_schedule_with_warmup(
            optimizer,
            num_warmup_steps=0,
            num_training_steps=total_steps
        )

        # Training loop
        best_val_accuracy = 0.0

        for epoch in range(epochs):
            logger.info(f"Starting epoch {epoch + 1}/{epochs}")

            # Training
            self.model.train()
            train_loss = 0

            for batch in train_dataloader:
                input_ids = batch['input_ids'].to(self.device)
                attention_mask = batch['attention_mask'].to(self.device)
                labels = batch['labels'].to(self.device)

                self.model.zero_grad()

                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )

                loss = outputs.loss
                train_loss += loss.item()

                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)

                optimizer.step()
                scheduler.step()

            avg_train_loss = train_loss / len(train_dataloader)
            logger.info(f"Average training loss: {avg_train_loss:.4f}")

            # Validation
            self.model.eval()
            val_preds = []
            val_true = []

            for batch in val_dataloader:
                input_ids = batch['input_ids'].to(self.device)
                attention_mask = batch['attention_mask'].to(self.device)
                labels = batch['labels'].to(self.device)

                with torch.no_grad():
                    outputs = self.model(
                        input_ids=input_ids,
                        attention_mask=attention_mask
                    )

                logits = outputs.logits
                preds = torch.argmax(logits, dim=1).cpu().numpy()

                val_preds.extend(preds)
                val_true.extend(labels.cpu().numpy())

            val_accuracy = accuracy_score(val_true, val_preds)
            logger.info(f"Validation accuracy: {val_accuracy:.4f}")

            # Save best model
            if val_accuracy > best_val_accuracy:
                best_val_accuracy = val_accuracy
                logger.info(f"New best validation accuracy: {best_val_accuracy:.4f}")

                # Save model and tokenizer
                self.model.save_pretrained(self.model_dir)
                self.tokenizer.save_pretrained(self.model_dir)

                # Save label map
                with open(self.model_dir / 'label_map.json', 'w') as f:
                    json.dump(LABEL_MAP, f)

                # Save metrics
                report = classification_report(val_true, val_preds, target_names=list(LABEL_MAP.keys()), output_dict=True)
                with open(self.model_dir / 'metrics.json', 'w') as f:
                    json.dump(report, f, indent=2)

        logger.info(f"Training complete. Best validation accuracy: {best_val_accuracy:.4f}")
        return best_val_accuracy

    def load_model(self):
        """Load a trained model and tokenizer."""
        if not (self.model_dir / 'pytorch_model.bin').exists():
            raise FileNotFoundError(f"No model found at {self.model_dir}")

        logger.info(f"Loading model from {self.model_dir}")

        self.tokenizer = BertTokenizer.from_pretrained(self.model_dir)
        self.model = BertForSequenceClassification.from_pretrained(self.model_dir)
        self.model.to(self.device)

        # Load label map
        with open(self.model_dir / 'label_map.json', 'r') as f:
            self.label_map = json.load(f)

        logger.info("Model loaded successfully")

    def predict(self, texts: List[str]) -> List[str]:
        """Predict labels for a list of texts."""
        if self.model is None:
            self.load_model()

        self.model.eval()

        # Tokenize texts
        encodings = self.tokenizer(
            texts,
            add_special_tokens=True,
            max_length=128,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        input_ids = encodings['input_ids'].to(self.device)
        attention_mask = encodings['attention_mask'].to(self.device)

        # Make predictions
        with torch.no_grad():
            outputs = self.model(
                input_ids=input_ids,
                attention_mask=attention_mask
            )

        logits = outputs.logits
        preds = torch.argmax(logits, dim=1).cpu().numpy()

        # Convert predictions to labels
        pred_labels = [REVERSE_LABEL_MAP[pred] for pred in preds]

        return pred_labels

def generate_bert_training_data(receipts_path: str, output_path: str):
    """Generate training data for BERT from synthetic receipts."""
    with open(receipts_path, 'r') as f:
        receipts = json.load(f)

    # Extract lines for BERT training
    bert_data = []
    for receipt in receipts:
        for line in receipt["lines"]:
            bert_data.append({
                "text": line["text"],
                "label": line["label"]
            })

    # Save BERT training data as CSV
    bert_df = pd.DataFrame(bert_data)
    bert_df.to_csv(output_path, index=False)

    logger.info(f"Generated BERT training data with {len(bert_data)} samples")
    logger.info(f"Saved to {output_path}")

def main():
    """Main function to train the BERT model."""
    # Generate synthetic data if needed
    from data_generator import generate_synthetic_receipt

    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)

    # Generate synthetic receipts
    receipts_path = 'data/synthetic_receipts.json'
    if not os.path.exists(receipts_path):
        logger.info("Generating synthetic receipts...")
        receipts = [generate_synthetic_receipt() for _ in range(1000)]
        with open(receipts_path, 'w') as f:
            json.dump(receipts, f, indent=2)

    # Generate BERT training data
    bert_data_path = 'data/bert_training_data.csv'
    if not os.path.exists(bert_data_path):
        logger.info("Generating BERT training data...")
        generate_bert_training_data(receipts_path, bert_data_path)

    # Train BERT model
    logger.info("Training BERT model...")
    classifier = BERTFieldClassifier()
    classifier.train(bert_data_path)

if __name__ == "__main__":
    main()
