"""
Script to train the XGBoost model for receipt categorization.
"""
import os
import json
import logging
import argparse
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import joblib
from typing import Dict, List, Any, Tuple
from data_generator import generate_synthetic_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CategoryModelTrainer:
    """Trainer for the XGBoost category prediction model."""
    
    def __init__(self, data_path: str, model_dir: str = 'models'):
        """Initialize the trainer."""
        self.data_path = data_path
        self.model_dir = Path(model_dir)
        self.model = None
        self.vectorizer = None
        self.label_encoder = None
    
    def load_and_preprocess_data(self) -> Tuple[pd.DataFrame, pd.DataFrame, np.ndarray, np.ndarray]:
        """Load and preprocess data for training."""
        logger.info(f"Loading data from {self.data_path}")
        
        # Load data
        df = pd.read_csv(self.data_path)
        
        # Combine store and items into a single text field
        df['text'] = df['Store'] + " " + df['Items']
        
        # Encode categories
        self.label_encoder = LabelEncoder()
        df['CategoryEncoded'] = self.label_encoder.fit_transform(df['Category'])
        
        # Save label encoder classes
        os.makedirs(self.model_dir, exist_ok=True)
        with open(self.model_dir / 'categories.json', 'w') as f:
            json.dump(self.label_encoder.classes_.tolist(), f)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            df[['text', 'Amount']], 
            df['CategoryEncoded'],
            test_size=0.2,
            random_state=42,
            stratify=df['CategoryEncoded']
        )
        
        logger.info(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples")
        
        return X_train, X_test, y_train, y_test
    
    def prepare_features(self, X: pd.DataFrame) -> np.ndarray:
        """Prepare features for training or prediction."""
        if self.vectorizer is None:
            # Initialize vectorizer
            self.vectorizer = TfidfVectorizer(
                max_features=5000,
                min_df=2,
                max_df=0.8,
                ngram_range=(1, 2)
            )
            
            # Fit vectorizer on training data
            text_features = self.vectorizer.fit_transform(X['text']).toarray()
        else:
            # Transform using pre-fitted vectorizer
            text_features = self.vectorizer.transform(X['text']).toarray()
        
        # Scale amount
        amount_scaler = StandardScaler()
        amount_features = amount_scaler.fit_transform(X[['Amount']])
        
        # Combine features
        features = np.hstack([text_features, amount_features])
        
        return features
    
    def train_model(self) -> Dict:
        """Train the XGBoost model and return metrics."""
        # Load and preprocess data
        X_train, X_test, y_train, y_test = self.load_and_preprocess_data()
        
        # Prepare features
        logger.info("Preparing features...")
        X_train_features = self.prepare_features(X_train)
        X_test_features = self.prepare_features(X_test)
        
        # Define model parameters
        params = {
            'objective': 'multi:softprob',
            'num_class': len(self.label_encoder.classes_),
            'max_depth': 6,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'eval_metric': ['mlogloss', 'merror'],
            'tree_method': 'hist'  # for faster training
        }
        
        # Create DMatrix for XGBoost
        dtrain = xgb.DMatrix(X_train_features, label=y_train)
        dtest = xgb.DMatrix(X_test_features, label=y_test)
        
        # Train model
        logger.info("Training model...")
        num_rounds = 100
        evallist = [(dtrain, 'train'), (dtest, 'eval')]
        
        self.model = xgb.train(
            params,
            dtrain,
            num_rounds,
            evallist,
            early_stopping_rounds=10,
            verbose_eval=10
        )
        
        # Save model and vectorizer
        logger.info("Saving model artifacts...")
        self.model.save_model(str(self.model_dir / 'category_model.json'))
        joblib.dump(self.vectorizer, self.model_dir / 'vectorizer.joblib')
        
        # Create a joblib model that includes both the XGBoost model and vectorizer
        combined_model = {
            'model': self.model,
            'vectorizer': self.vectorizer,
            'label_encoder': self.label_encoder
        }
        joblib.dump(combined_model, self.model_dir / 'category_model.joblib')
        
        # Calculate metrics
        y_pred = self.model.predict(dtest)
        y_pred_labels = np.argmax(y_pred, axis=1)
        
        accuracy = np.mean(y_pred_labels == y_test)
        
        metrics = {
            'accuracy': float(accuracy),
            'num_categories': len(self.label_encoder.classes_),
            'categories': self.label_encoder.classes_.tolist(),
            'model_params': params,
            'feature_dims': X_train_features.shape[1]
        }
        
        # Save metrics
        with open(self.model_dir / 'metrics.json', 'w') as f:
            json.dump(metrics, f, indent=2)
        
        return metrics

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Train XGBoost model for receipt categorization')
    parser.add_argument('--data-dir', type=str, default='data', help='Directory to store data')
    parser.add_argument('--model-dir', type=str, default='models', help='Directory to store model')
    parser.add_argument('--n-samples', type=int, default=10000, help='Number of synthetic samples to generate')
    parser.add_argument('--force-generate', action='store_true', help='Force regeneration of synthetic data')
    return parser.parse_args()

def main():
    """Main function to train the XGBoost model."""
    args = parse_args()
    
    # Create directories if they don't exist
    os.makedirs(args.data_dir, exist_ok=True)
    os.makedirs(args.model_dir, exist_ok=True)
    
    # Define paths
    data_path = os.path.join(args.data_dir, 'xgboost_training_data.csv')
    
    # Generate synthetic data if needed or forced
    if not os.path.exists(data_path) or args.force_generate:
        logger.info(f"Generating synthetic training data with {args.n_samples} samples...")
        receipts_path = os.path.join(args.data_dir, 'synthetic_receipts.json')
        generate_synthetic_data(receipts_path, args.n_samples)
    
    # Initialize and run trainer
    trainer = CategoryModelTrainer(
        data_path=data_path,
        model_dir=args.model_dir
    )
    
    # Train model and get metrics
    metrics = trainer.train_model()
    
    # Log results
    logger.info("Training completed!")
    logger.info(f"Model metrics: {json.dumps(metrics, indent=2)}")
    logger.info(f"Model saved to {args.model_dir}/category_model.joblib")

if __name__ == "__main__":
    main()
