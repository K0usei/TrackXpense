import joblib
import json
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt
from pathlib import Path
import xgboost as xgb
import logging
from typing import Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelEvaluator:
    def __init__(self, model_dir: str):
        self.model_dir = Path(model_dir)
        self.load_model_artifacts()
    
    def load_model_artifacts(self):
        """Load the trained model and associated artifacts"""
        self.model = xgb.Booster()
        self.model.load_model(str(self.model_dir / 'category_model.json'))
        self.vectorizer = joblib.load(self.model_dir / 'vectorizer.joblib')
        
        with open(self.model_dir / 'category_mappings.json', 'r') as f:
            self.category_mappings = json.load(f)
        
        self.reverse_mappings = {v: k for k, v in self.category_mappings.items()}
    
    def prepare_features(self, text: str, amount: float) -> np.ndarray:
        """Prepare features for prediction"""
        text_features = self.vectorizer.transform([text]).toarray()
        amount_feature = np.array([[amount]])
        return np.hstack([text_features, amount_feature])
    
    def predict_single(self, text: str, amount: float) -> Dict[str, float]:
        """Make prediction for a single transaction"""
        features = self.prepare_features(text, amount)
        probabilities = self.model.predict(xgb.DMatrix(features))
        
        # Convert probabilities to category-probability pairs
        predictions = {
            self.reverse_mappings[i]: float(prob)
            for i, prob in enumerate(probabilities[0])
        }
        
        return dict(sorted(predictions.items(), key=lambda x: x[1], reverse=True))
    
    def evaluate_test_set(self, test_data_path: str):
        """Evaluate model on test dataset"""
        # Load test data
        df = pd.read_csv(test_data_path)
        
        # Prepare features
        text_features = df['description'] + ' ' + df['vendor']
        X = np.hstack([
            self.vectorizer.transform(text_features).toarray(),
            df['amount'].values.reshape(-1, 1)
        ])
        
        # Get predictions
        y_pred = self.model.predict(xgb.DMatrix(X))
        y_pred_labels = np.argmax(y_pred, axis=1)
        
        # Convert true labels to encoded form
        y_true = df['category'].map(self.category_mappings).values
        
        # Generate classification report
        report = classification_report(
            y_true,
            y_pred_labels,
            target_names=list(self.category_mappings.keys()),
            output_dict=True
        )
        
        # Generate confusion matrix
        cm = confusion_matrix(y_true, y_pred_labels)
        
        # Plot confusion matrix
        plt.figure(figsize=(10, 8))
        sns.heatmap(
            cm,
            annot=True,
            fmt='d',
            xticklabels=list(self.category_mappings.keys()),
            yticklabels=list(self.category_mappings.keys())
        )
        plt.title('Confusion Matrix')
        plt.ylabel('True Category')
        plt.xlabel('Predicted Category')
        plt.tight_layout()
        plt.savefig(self.model_dir / 'confusion_matrix.png')
        
        # Save detailed metrics
        with open(self.model_dir / 'evaluation_metrics.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        return report

def main():
    # Initialize evaluator
    evaluator = ModelEvaluator('models')
    
    # Test single prediction
    test_transaction = {
        'text': 'walmart groceries food',
        'amount': 123.45
    }
    
    prediction = evaluator.predict_single(test_transaction['text'], test_transaction['amount'])
    logger.info(f"Single prediction test:")
    logger.info(f"Input: {test_transaction}")
    logger.info(f"Predictions: {json.dumps(prediction, indent=2)}")
    
    # Evaluate on test set
    if Path('data/test_transactions.csv').exists():
        logger.info("\nEvaluating on test set...")
        metrics = evaluator.evaluate_test_set('data/test_transactions.csv')
        logger.info(f"Test set metrics:\n{json.dumps(metrics, indent=2)}")

if __name__ == "__main__":
    main()