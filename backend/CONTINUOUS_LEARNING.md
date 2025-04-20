# TrackXpense Continuous Learning System

This document explains how the continuous learning system works in TrackXpense, allowing the AI models to improve over time based on user feedback.

## Overview

The continuous learning system consists of the following components:

1. **Feedback Collection**: Collects user corrections to extracted receipt data
2. **Feedback Storage**: Stores the feedback in a structured format
3. **Model Retraining**: Periodically retrains the models using the collected feedback
4. **Model Deployment**: Automatically deploys the improved models

## How It Works

### 1. Feedback Collection

When a user corrects extracted receipt data, the frontend sends both the original and corrected data to the backend. The backend stores this feedback for later use in model retraining.

#### Frontend Component

The `ReceiptFeedback` component allows users to correct:
- Vendor name
- Date
- Total amount
- Category
- Item details (name, price, quantity)

#### Backend API

The `/api/v1/ocr/submit-feedback` endpoint receives the feedback and passes it to the `FeedbackCollector` service.

### 2. Feedback Storage

Feedback is stored in CSV files:
- `data/feedback/field_feedback.csv`: Feedback on field classification (STORE, DATE, TOTAL, ITEM)
- `data/feedback/category_feedback.csv`: Feedback on category prediction
- `data/feedback/receipts/`: Full receipt feedback as JSON files

### 3. Model Retraining

The `ModelRetrainer` service periodically checks if there's enough feedback to retrain the models. If there is, it:

1. Incorporates the feedback into the training data
2. Retrains the models
3. Backs up and clears the feedback files

#### Scheduled Task

The `retrain_models.py` script can be scheduled to run periodically (e.g., daily or weekly) to check for new feedback and retrain the models if needed.

```bash
# Run manually
python tasks/retrain_models.py

# Or schedule with cron (Linux/Mac)
# 0 0 * * 0 cd /path/to/trackxpense/backend && python tasks/retrain_models.py >> logs/retraining.log 2>&1

# Or schedule with Task Scheduler (Windows)
# Create a scheduled task that runs: python C:\path\to\trackxpense\backend\tasks\retrain_models.py
```

### 4. Model Deployment

The improved models are automatically deployed to the `models` directory, and the system will use them for future receipt processing.

## Configuration

The continuous learning system can be configured by modifying the following parameters:

- `min_feedback_count`: Minimum number of feedback entries required for retraining (default: 10)
- `feedback_dir`: Directory to store feedback data (default: 'data/feedback')
- `data_dir`: Directory containing training data (default: 'data')
- `model_dir`: Directory containing models (default: 'models')

These parameters can be set when running the retraining script:

```bash
python tasks/retrain_models.py --min-feedback 20 --feedback-dir data/custom_feedback
```

## PyTorch Support

The system supports both PyTorch-based BERT models and simplified rule-based classifiers. If PyTorch is available, the system will use BERT for better accuracy. If not, it will fall back to the simplified classifier.

To install PyTorch:

```bash
# CPU-only (smaller download, works on all systems)
python ml/install_pytorch.py

# With CUDA support (for systems with NVIDIA GPUs)
python ml/install_pytorch.py --cuda
```

See `ml/PYTORCH_SETUP.md` for more details.

## Monitoring

The continuous learning system logs all activities to help monitor its performance:

- Feedback collection logs
- Retraining logs
- Model performance metrics

Check the logs to ensure the system is working correctly and to track improvements over time.

## Extending the System

The continuous learning system can be extended in several ways:

1. **Add more feedback types**: Collect feedback on other aspects of receipt processing
2. **Implement active learning**: Proactively ask users for feedback on uncertain predictions
3. **Add A/B testing**: Compare different models to determine which performs better
4. **Implement user-specific models**: Train personalized models for different users or businesses

## Troubleshooting

If you encounter issues with the continuous learning system:

1. **Check the logs**: Look for error messages in the logs
2. **Verify feedback files**: Ensure the feedback files exist and have the correct format
3. **Check model directories**: Ensure the model directories exist and have the correct permissions
4. **Test retraining manually**: Run the retraining script manually to see if it works
