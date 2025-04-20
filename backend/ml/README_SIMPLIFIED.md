# TrackXpense AI-Powered Receipt Processing Pipeline (Simplified Version)

This directory contains a simplified version of the machine learning models and training scripts for the TrackXpense receipt extraction and categorization pipeline. This version is designed to work without requiring PyTorch or other deep learning libraries.

## Overview

The simplified pipeline consists of three main components:

1. **EasyOCR** - Scans and extracts text from receipt images
2. **Rule-based Field Classifier** - Classifies extracted lines into fields like STORE, DATE, TOTAL, ITEMS
3. **XGBoost** - Categorizes the transaction (Food, Transport, Utilities, etc.)

## Setup

1. Install the required dependencies:

```bash
pip install easyocr scikit-learn xgboost pandas numpy
```

2. Run the setup script:

```bash
python setup_pipeline.py
```

This script will:
1. Generate synthetic data
2. Train the simplified field classifier
3. Train the XGBoost model

## Command-line Options

The setup script accepts the following command-line options:

```
--data-dir DATA_DIR     Directory to store data (default: 'data')
--model-dir MODEL_DIR   Directory to store models (default: 'models')
--n-samples N_SAMPLES   Number of synthetic samples to generate (default: 10000)
--force-generate        Force regeneration of synthetic data
--skip-bert             Skip field classifier training
--skip-xgboost          Skip XGBoost training
```

## Individual Components

If you prefer to run each component separately:

### 1. Generate Synthetic Data

```bash
python data_generator.py --data-dir data --n-samples 10000
```

### 2. Train the Simplified Field Classifier

```bash
python train_simplified_bert.py --data-dir data --model-dir models/simplified_receipt_classifier
```

### 3. Train the XGBoost Model

```bash
python train_xgboost.py --data-dir data --model-dir models
```

## Using the Pipeline

Once the models are trained, the receipt processing pipeline will automatically use them. The API endpoint for receipt processing is:

```
POST /api/v1/ocr/process-receipt
```

## Troubleshooting

If you encounter issues with the pipeline:

1. **Missing Files**: Make sure the data directory exists and contains the necessary files.
2. **Import Errors**: Check that all required packages are installed.
3. **Model Loading Errors**: The system will fall back to rule-based methods if models can't be loaded.

## Upgrading to Full Version

If you want to use the full version with BERT:

1. Install PyTorch and transformers:
```bash
pip install torch transformers
```

2. Train the BERT model:
```bash
python train_bert.py --data-dir data --model-dir models/bert_receipt_classifier
```

The system will automatically use the BERT model if available.
