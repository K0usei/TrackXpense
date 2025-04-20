# TrackXpense AI-Powered Receipt Extraction and Categorization

This directory contains the machine learning models and training scripts for the TrackXpense receipt extraction and categorization pipeline.

## Overview

The pipeline consists of three main components:

1. **EasyOCR** - Scans and extracts text from receipt images
2. **BERT** - Classifies extracted lines into fields like STORE, DATE, TOTAL, ITEMS
3. **XGBoost** - Categorizes the transaction (Food, Transport, Utilities, etc.)

## Directory Structure

```
ml/
├── data/                      # Directory for training data
│   ├── synthetic_receipts.json        # Synthetic receipt data
│   ├── bert_training_data.csv         # Training data for BERT
│   └── xgboost_training_data.csv      # Training data for XGBoost
├── models/                    # Directory for trained models
│   ├── bert_receipt_classifier/       # BERT model for field classification
│   ├── category_model.joblib          # XGBoost model for categorization
│   └── vectorizer.joblib              # TF-IDF vectorizer for text features
├── bert_field_classifier.py   # BERT model implementation
├── data_generator.py          # Synthetic data generator
├── train_bert.py              # Script to train BERT model
└── train_xgboost.py           # Script to train XGBoost model
```

## Setup

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Create the necessary directories:

```bash
mkdir -p data models/bert_receipt_classifier
```

## Training the Models

### 1. Generate Synthetic Data

```bash
python data_generator.py
```

This will generate synthetic receipt data for training both the BERT and XGBoost models.

### 2. Train the BERT Model

```bash
python train_bert.py --data-dir data --model-dir models/bert_receipt_classifier --n-samples 1000
```

Options:

- `--data-dir`: Directory to store data (default: 'data')
- `--model-dir`: Directory to store model (default: 'models/bert_receipt_classifier')
- `--n-samples`: Number of synthetic samples to generate (default: 1000)
- `--batch-size`: Batch size for training (default: 16)
- `--epochs`: Number of epochs for training (default: 4)
- `--learning-rate`: Learning rate for training (default: 2e-5)
- `--force-generate`: Force regeneration of synthetic data

### 3. Train the XGBoost Model

```bash
python train_xgboost.py --data-dir data --model-dir models --n-samples 10000
```

Options:

- `--data-dir`: Directory to store data (default: 'data')
- `--model-dir`: Directory to store model (default: 'models')
- `--n-samples`: Number of synthetic samples to generate (default: 10000)
- `--force-generate`: Force regeneration of synthetic data

## Using the Models

The models are used by the receipt processing pipeline in `services/receipt_processor.py`. The pipeline:

1. Uses EasyOCR to extract text from receipt images
2. Uses BERT to classify the extracted text lines into fields
3. Uses XGBoost to categorize the transaction based on the extracted data

## API Endpoints

The API endpoints for receipt processing are defined in `app/api/endpoints/ocr.py`:

- `POST /api/v1/ocr/process-receipt`: Process a receipt image and extract structured data
- `POST /api/v1/ocr/save-receipt`: Save a processed receipt to the database

## Example Usage

```python
from services.receipt_processor import ReceiptProcessor

# Initialize the receipt processor
processor = ReceiptProcessor()

# Process a receipt image
with open('path/to/receipt.jpg', 'rb') as f:
    image_bytes = f.read()

# Extract structured data
receipt_data = processor.process_image(image_bytes)

print(f"Vendor: {receipt_data['vendor']}")
print(f"Date: {receipt_data['date']}")
print(f"Total: ${receipt_data['total']:.2f}")
print(f"Category: {receipt_data['category']} (confidence: {receipt_data['confidence']:.2f})")
print(f"Items: {len(receipt_data['items'])}")
for item in receipt_data['items']:
    print(f"  - {item['name']}: {item['quantity']} x ${item['price']:.2f}")
```
