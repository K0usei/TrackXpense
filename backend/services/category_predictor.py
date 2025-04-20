import xgboost as xgb
import numpy as np
from typing import Dict, Tuple, List, Any, Optional
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import os
import json
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CategoryPredictor:
    """Predictor for expense categories using XGBoost."""

    def __init__(self, model_path: str = 'models/category_model.joblib'):
        """Initialize the category predictor."""
        try:
            # Try to load the combined model (model, vectorizer, and label_encoder)
            model_data = joblib.load(model_path)

            if isinstance(model_data, dict) and 'model' in model_data:
                # New format with combined model
                self.model = model_data['model']
                self.vectorizer = model_data['vectorizer']
                self.label_encoder = model_data['label_encoder']
                self.categories = self.label_encoder.classes_.tolist()
                logger.info(f"Loaded combined model with {len(self.categories)} categories")
            else:
                # Old format with separate model and vectorizer
                self.model = model_data
                self.vectorizer = joblib.load(os.path.join(os.path.dirname(model_path), 'vectorizer.joblib'))

                # Try to load categories from JSON file
                categories_path = os.path.join(os.path.dirname(model_path), 'categories.json')
                if os.path.exists(categories_path):
                    with open(categories_path, 'r') as f:
                        self.categories = json.load(f)
                else:
                    # Default categories
                    self.categories = [
                        'Food & Dining',
                        'Transportation',
                        'Bills & Utilities',
                        'Groceries',
                        'Entertainment',
                        'Healthcare',
                        'Shopping',
                        'Others'
                    ]
                logger.info(f"Loaded model with {len(self.categories)} categories")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            logger.warning("Using rule-based categorization only")
            self.model = None
            self.vectorizer = None

            # Default categories
            self.categories = [
                'Food & Dining',
                'Transportation',
                'Bills & Utilities',
                'Groceries',
                'Entertainment',
                'Healthcare',
                'Shopping',
                'Others'
            ]

        # Update rule-based category patterns to match new categories
        self.category_rules = {
            'Food & Dining': [
                r'restaurant|cafe|coffee|dining|food delivery|takeout|pizza|burger',
                r'mcdonalds|subway|chipotle|starbucks|dunkin|dominos'
            ],
            'Groceries': [
                r'supermarket|grocery|market|food|produce|fruits|vegetables|meat|dairy',
                r'walmart|kroger|safeway|costco|aldi|trader|joes|whole foods'
            ],
            'Transportation': [
                r'gas|fuel|parking|toll|fare|uber|lyft|taxi|transit|train|bus',
                r'shell|bp|chevron|exxon|mobil|metro|amtrak'
            ],
            'Shopping': [
                r'clothing|shoes|apparel|electronics|furniture|retail|store',
                r'amazon|target|walmart|best buy|nike|adidas|h&m|zara'
            ],
            'Entertainment': [
                r'movie|cinema|theater|concert|show|game|music|streaming|subscription',
                r'netflix|spotify|hulu|disney|amc|xbox|playstation|steam'
            ],
            'Healthcare': [
                r'doctor|medical|health|dental|pharmacy|prescription|hospital|clinic',
                r'cvs|walgreens|rite aid|medicare|insurance'
            ],
            'Bills & Utilities': [
                r'electric|water|gas|internet|phone|cable|utility|bill',
                r'at&t|verizon|comcast|pg&e|sprint|t-mobile'
            ]
        }

    def _apply_rules(self, description: str, vendor: str, amount: float) -> str:
        """Apply rule-based categorization as a fallback"""
        text = f"{description} {vendor}".lower()

        # Check amount-based rules first
        if amount > 1000:
            if any(term in text for term in ['rent', 'lease', 'utilities']):
                return 'Bills & Utilities'
            if any(term in text for term in ['car', 'auto', 'vehicle']):
                return 'Transportation'

        # Check pattern-based rules
        for category, patterns in self.category_rules.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    return category

        return 'Others'

    def predict(self, description: str, amount: float, vendor: str) -> Tuple[str, float]:
        """Predict category for a transaction."""
        # If model is not available, use rule-based categorization
        if self.model is None or self.vectorizer is None:
            rule_based_category = self._apply_rules(description, vendor, amount)
            return rule_based_category, 1.0  # Rule-based predictions get 1.0 confidence

        try:
            # Prepare features
            text = f"{description} {vendor}".lower()

            # Create a DataFrame with the expected structure
            data = {
                'text': [text],
                'Amount': [amount]
            }

            # Transform text using pre-trained vectorizer
            text_features = self.vectorizer.transform([text]).toarray()
            amount_feature = np.array([[amount]])

            # Combine features
            features = np.hstack([text_features, amount_feature])

            # Create DMatrix for XGBoost
            dmatrix = xgb.DMatrix(features)

            # Make prediction
            prediction = self.model.predict(dmatrix)

            # Get predicted category and confidence
            category_idx = np.argmax(prediction[0])
            confidence = prediction[0][category_idx]

            predicted_category = self.categories[category_idx]

            # If confidence is low, use rule-based categorization
            if confidence < 0.5:
                rule_based_category = self._apply_rules(description, vendor, amount)
                return rule_based_category, 1.0  # Rule-based predictions get 1.0 confidence

            return predicted_category, float(confidence)
        except Exception as e:
            logger.error(f"Error predicting category: {e}")
            # Fallback to rule-based categorization
            rule_based_category = self._apply_rules(description, vendor, amount)
            return rule_based_category, 1.0

    def _prepare_text_features(self, description: str, vendor: str) -> np.ndarray:
        """Prepare text features for prediction."""
        # Combine description and vendor
        text = f"{description} {vendor}".lower()

        # Transform text using pre-trained vectorizer
        return self.vectorizer.transform([text]).toarray() if self.vectorizer else np.array([[0]])

