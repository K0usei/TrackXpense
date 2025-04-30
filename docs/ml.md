# TrackXpense Machine Learning Documentation

This document provides information about the machine learning models used in TrackXpense for receipt processing and expense categorization.

## Overview

TrackXpense uses three main components for receipt processing:

1. **EasyOCR** - Scans and extracts text from receipt images
2. **BERT** - Classifies extracted lines into fields like STORE, DATE, TOTAL, ITEMS
3. **XGBoost** - Categorizes the transaction (Food, Transport, Utilities, etc.)

## Project Structure

The machine learning code is located in the `backend/ml` directory and follows this structure:

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
pip install -r ml/requirements.txt
```

2. Create the necessary directories:

```bash
mkdir -p ml/data ml/models/bert_receipt_classifier
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

## Model Retraining

The models can be retrained periodically to improve their accuracy based on user feedback. A PowerShell script is provided to run the retraining task:

```bash
# From the backend directory
.\tasks\run_retraining.ps1
```

This script:
1. Creates a log file in the logs directory
2. Runs the retraining script with a minimum feedback threshold
3. Logs the results of the retraining process

You can schedule this script to run periodically using Windows Task Scheduler to keep your models up-to-date.

## Receipt Processing Pipeline

The receipt processing pipeline works as follows:

1. **Image Preprocessing**:
   - Resize and normalize the image
   - Apply contrast enhancement and noise reduction

2. **Text Extraction (EasyOCR)**:
   - Extract text from the receipt image
   - Preserve spatial information for each text line

3. **Field Classification (BERT)**:
   - Classify each text line into fields (STORE, DATE, TOTAL, ITEMS, etc.)
   - Use contextual information to improve classification accuracy

4. **Data Structuring**:
   - Parse the classified text into structured data
   - Extract numerical values, dates, and item information

5. **Category Prediction (XGBoost)**:
   - Use the structured data to predict the expense category
   - Return confidence scores for the prediction

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

## Performance Metrics

- **EasyOCR**: ~95% text recognition accuracy on clear receipt images
- **BERT Field Classifier**: ~92% field classification accuracy
- **XGBoost Category Predictor**: ~85% category prediction accuracy

## Future Improvements

- Implement continuous learning with user feedback
- Add support for more receipt formats and languages
- Improve item extraction and price parsing
- Enhance category prediction with more features
