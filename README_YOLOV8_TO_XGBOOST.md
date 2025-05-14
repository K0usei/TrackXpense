# Training XGBoost Model from YOLOv8 Dataset

This guide explains how to use your YOLOv8 annotated receipt dataset to train an XGBoost model for receipt categorization.

## Overview

The process involves three main steps:

1. **Convert YOLOv8 annotations to XGBoost training format**
2. **Train the XGBoost model**
3. **Evaluate and save the model**

## Prerequisites

- Python 3.8+
- Required packages: pandas, numpy, opencv-python, easyocr, scikit-learn, xgboost, joblib
- YOLOv8 format dataset (with images and labels)

## Installation

Install the required packages:

```bash
pip install pandas numpy opencv-python easyocr scikit-learn xgboost joblib
```

## Usage

### Option 1: Using the Combined Script

We've created a combined script `train_xgboost_from_yolov8.py` that handles all three steps:

```bash
python train_xgboost_from_yolov8.py --yolo-dir "D:\TrackXpense Ver 2.v1i.yolov8" --ocr
```

### Script Arguments

- `--yolo-dir`: Directory containing YOLOv8 dataset (required)
- `--data-dir`: Directory to store processed data (default: 'data')
- `--model-dir`: Directory to store model (default: 'models')
- `--skip-conversion`: Skip converting annotations
- `--skip-training`: Skip training the model
- `--class-map-file`: Path to a YAML file containing class mapping
- `--ocr`: Run OCR on images to extract text (required for text-based features)

### Option 2: Step-by-Step Process

If you prefer to run each step separately:

#### 1. Convert YOLOv8 Annotations to XGBoost Training Format

```bash
python backend/ml/yolov8_to_xgboost.py --yolo-dir "D:\TrackXpense Ver 2.v1i.yolov8" --output-dir data --ocr
```

This script:
- Loads YOLOv8 annotations from label files
- Extracts text from images using OCR (if enabled)
- Processes annotations to extract store names, items, and amounts
- Creates a DataFrame with the required columns: Store, Items, Amount, Category
- Saves the data to a CSV file for XGBoost training

#### 2. Train the XGBoost Model

```bash
python backend/ml/train_xgboost.py --data-dir data --model-dir models
```

This script:
- Loads the training data
- Preprocesses the data (combines store and items, encodes categories)
- Prepares features (TF-IDF vectorization for text, scaling for amount)
- Trains the XGBoost model with appropriate parameters
- Saves the model and related artifacts

## Model Output

After training, the following files will be created in the `models` directory:

- `category_model.joblib`: The trained XGBoost model
- `vectorizer.joblib`: The TF-IDF vectorizer for text features
- `category_model.json`: The raw XGBoost model (can be used with XGBoost directly)

## Using the Trained Model

The trained model can be used with the existing `CategoryPredictor` class:

```python
from services.category_predictor import CategoryPredictor

# Initialize the category predictor
predictor = CategoryPredictor(model_path='models/category_model.joblib')

# Predict category
category, confidence = predictor.predict(
    description="Grocery items from Walmart",
    amount=45.67,
    vendor="Walmart"
)

print(f"Predicted category: {category} (confidence: {confidence:.2f})")
```

## Troubleshooting

### Common Issues

1. **OCR is slow**: OCR processing can be time-consuming. If you have a large dataset, consider processing it in batches or using a more powerful machine.

2. **Memory errors**: If you encounter memory errors, try reducing the batch size or processing fewer images at a time.

3. **Model performance issues**: If the model doesn't perform well, try:
   - Adding more training data
   - Adjusting XGBoost parameters
   - Improving feature engineering
   - Using a different text vectorization approach

### Improving Model Performance

To improve model performance:

1. **Add more training data**: The more diverse receipt examples you have, the better the model will perform.

2. **Improve OCR quality**: Better text extraction leads to better features for the model.

3. **Add manual category labels**: Add a 'Category' column to the CSV file with correct categories for each receipt.

4. **Tune XGBoost parameters**: Adjust parameters like max_depth, learning_rate, etc. to improve model performance.

## License

This project is licensed under the same license as the TrackXpense project.
