import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
from typing import Tuple, Dict
import joblib
import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CategoryModelTrainer:
    def __init__(self, data_path: str, model_dir: str):
        self.data_path = data_path
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize encoders and model
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.label_encoder = LabelEncoder()
        self.model = None
        
    def load_and_preprocess_data(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Load and preprocess the training data"""
        logger.info("Loading and preprocessing data...")
        
        # Load data
        df = pd.read_csv(self.data_path)
        
        # Basic preprocessing
        df['description'] = df['description'].fillna('')
        df['vendor'] = df['vendor'].fillna('')
        df['amount'] = df['amount'].fillna(0)
        
        # Combine text features
        df['text_features'] = df['description'] + ' ' + df['vendor']
        df['text_features'] = df['text_features'].str.lower()
        
        # Encode labels
        df['category_encoded'] = self.label_encoder.fit_transform(df['category'])
        
        # Save category mappings
        category_mappings = dict(zip(
            self.label_encoder.classes_,
            self.label_encoder.transform(self.label_encoder.classes_)
        ))
        with open(self.model_dir / 'category_mappings.json', 'w') as f:
            json.dump(category_mappings, f)
        
        # Split features and target
        X = df[['text_features', 'amount']]
        y = df['category_encoded']
        
        # Split into train and test sets
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        return (
            pd.DataFrame({'text_features': X_train['text_features'], 'amount': X_train['amount']}, index=X_train.index),
            pd.DataFrame({'text_features': X_test['text_features'], 'amount': X_test['amount']}, index=X_test.index),
            y_train,
            y_test
        )
    
    def prepare_features(self, X: pd.DataFrame) -> np.ndarray:
        """Transform features into model-ready format"""
        # Transform text features
        text_features = self.vectorizer.fit_transform(X['text_features']).toarray()
        
        # Prepare amount features
        amount_features = X['amount'].values.reshape(-1, 1)
        
        # Combine features
        return np.hstack([text_features, amount_features])
    
    def train_model(self) -> Dict:
        """Train the XGBoost model and return metrics"""
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
        
        # Calculate metrics
        y_pred = self.model.predict(dtest)
        y_pred_labels = np.argmax(y_pred, axis=1)
        
        accuracy = np.mean(y_pred_labels == y_test)
        
        metrics = {
            'accuracy': accuracy,
            'num_categories': len(self.label_encoder.classes_),
            'model_params': params,
            'feature_dims': X_train_features.shape[1]
        }
        
        # Save metrics
        with open(self.model_dir / 'metrics.json', 'w') as f:
            json.dump(metrics, f)
        
        return metrics

def main():
    # Create data generator for synthetic data
    from data_generator import generate_synthetic_data
    
    # Generate synthetic data if needed
    data_path = 'data/transactions.csv'
    if not Path(data_path).exists():
        logger.info("Generating synthetic training data...")
        generate_synthetic_data(data_path, n_samples=10000)
    
    # Initialize and run trainer
    trainer = CategoryModelTrainer(
        data_path=data_path,
        model_dir='models'
    )
    
    # Train model and get metrics
    metrics = trainer.train_model()
    
    # Log results
    logger.info("Training completed!")
    logger.info(f"Model metrics: {json.dumps(metrics, indent=2)}")

if __name__ == "__main__":
    main()