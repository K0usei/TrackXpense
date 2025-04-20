"""
Feedback collector service for receipt processing.
This service collects user corrections to extracted receipt data and stores them for model retraining.
"""
import os
import json
import logging
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FeedbackCollector:
    """Collects and stores user feedback for continuous learning."""
    
    def __init__(self, feedback_dir: str = 'data/feedback'):
        """Initialize the feedback collector."""
        self.feedback_dir = Path(feedback_dir)
        self.field_feedback_path = self.feedback_dir / 'field_feedback.csv'
        self.category_feedback_path = self.feedback_dir / 'category_feedback.csv'
        
        # Create feedback directory if it doesn't exist
        os.makedirs(self.feedback_dir, exist_ok=True)
        
        # Initialize feedback dataframes if they don't exist
        self._initialize_feedback_files()
    
    def _initialize_feedback_files(self):
        """Initialize feedback files if they don't exist."""
        # Field feedback file
        if not self.field_feedback_path.exists():
            field_feedback_df = pd.DataFrame(columns=[
                'text', 'predicted_label', 'corrected_label', 'timestamp', 'user_id'
            ])
            field_feedback_df.to_csv(self.field_feedback_path, index=False)
            logger.info(f"Created field feedback file at {self.field_feedback_path}")
        
        # Category feedback file
        if not self.category_feedback_path.exists():
            category_feedback_df = pd.DataFrame(columns=[
                'vendor', 'description', 'amount', 'predicted_category', 
                'corrected_category', 'timestamp', 'user_id'
            ])
            category_feedback_df.to_csv(self.category_feedback_path, index=False)
            logger.info(f"Created category feedback file at {self.category_feedback_path}")
    
    def collect_field_feedback(self, text: str, predicted_label: str, 
                              corrected_label: str, user_id: str) -> bool:
        """
        Collect feedback on field classification.
        
        Args:
            text: The text that was classified
            predicted_label: The label predicted by the model
            corrected_label: The label corrected by the user
            user_id: The ID of the user providing feedback
            
        Returns:
            bool: True if feedback was successfully collected, False otherwise
        """
        try:
            # Only collect feedback if the prediction was wrong
            if predicted_label != corrected_label:
                # Load existing feedback
                field_feedback_df = pd.read_csv(self.field_feedback_path)
                
                # Add new feedback
                new_feedback = pd.DataFrame([{
                    'text': text,
                    'predicted_label': predicted_label,
                    'corrected_label': corrected_label,
                    'timestamp': datetime.now().isoformat(),
                    'user_id': user_id
                }])
                
                # Append to existing feedback
                field_feedback_df = pd.concat([field_feedback_df, new_feedback], ignore_index=True)
                
                # Save updated feedback
                field_feedback_df.to_csv(self.field_feedback_path, index=False)
                
                logger.info(f"Collected field feedback: '{text}' - {predicted_label} -> {corrected_label}")
                return True
            
            return False
        except Exception as e:
            logger.error(f"Error collecting field feedback: {e}")
            return False
    
    def collect_category_feedback(self, vendor: str, description: str, amount: float,
                                 predicted_category: str, corrected_category: str, 
                                 user_id: str) -> bool:
        """
        Collect feedback on category prediction.
        
        Args:
            vendor: The vendor name
            description: The transaction description
            amount: The transaction amount
            predicted_category: The category predicted by the model
            corrected_category: The category corrected by the user
            user_id: The ID of the user providing feedback
            
        Returns:
            bool: True if feedback was successfully collected, False otherwise
        """
        try:
            # Only collect feedback if the prediction was wrong
            if predicted_category != corrected_category:
                # Load existing feedback
                category_feedback_df = pd.read_csv(self.category_feedback_path)
                
                # Add new feedback
                new_feedback = pd.DataFrame([{
                    'vendor': vendor,
                    'description': description,
                    'amount': amount,
                    'predicted_category': predicted_category,
                    'corrected_category': corrected_category,
                    'timestamp': datetime.now().isoformat(),
                    'user_id': user_id
                }])
                
                # Append to existing feedback
                category_feedback_df = pd.concat([category_feedback_df, new_feedback], ignore_index=True)
                
                # Save updated feedback
                category_feedback_df.to_csv(self.category_feedback_path, index=False)
                
                logger.info(f"Collected category feedback: '{vendor} {description}' - {predicted_category} -> {corrected_category}")
                return True
            
            return False
        except Exception as e:
            logger.error(f"Error collecting category feedback: {e}")
            return False
    
    def collect_receipt_feedback(self, original_data: Dict[str, Any], 
                                corrected_data: Dict[str, Any],
                                user_id: str) -> bool:
        """
        Collect feedback on the entire receipt.
        
        Args:
            original_data: The original extracted receipt data
            corrected_data: The corrected receipt data
            user_id: The ID of the user providing feedback
            
        Returns:
            bool: True if feedback was successfully collected, False otherwise
        """
        try:
            success = False
            
            # Collect feedback on vendor
            if original_data.get('vendor') != corrected_data.get('vendor'):
                self.collect_field_feedback(
                    text=original_data.get('vendor', ''),
                    predicted_label='STORE',
                    corrected_label='STORE',  # Label is still STORE, but the text is corrected
                    user_id=user_id
                )
                success = True
            
            # Collect feedback on date
            if original_data.get('date') != corrected_data.get('date'):
                self.collect_field_feedback(
                    text=original_data.get('date', ''),
                    predicted_label='DATE',
                    corrected_label='DATE',  # Label is still DATE, but the text is corrected
                    user_id=user_id
                )
                success = True
            
            # Collect feedback on total
            if original_data.get('total') != corrected_data.get('total'):
                self.collect_field_feedback(
                    text=str(original_data.get('total', '')),
                    predicted_label='TOTAL',
                    corrected_label='TOTAL',  # Label is still TOTAL, but the value is corrected
                    user_id=user_id
                )
                success = True
            
            # Collect feedback on category
            if original_data.get('category') != corrected_data.get('category'):
                self.collect_category_feedback(
                    vendor=corrected_data.get('vendor', ''),
                    description=', '.join([item.get('name', '') for item in corrected_data.get('items', [])]),
                    amount=float(corrected_data.get('total', 0)),
                    predicted_category=original_data.get('category', 'Others'),
                    corrected_category=corrected_data.get('category', 'Others'),
                    user_id=user_id
                )
                success = True
            
            # Store the entire receipt feedback for future use
            if success:
                # Create a directory for full receipt feedback if it doesn't exist
                receipt_feedback_dir = self.feedback_dir / 'receipts'
                os.makedirs(receipt_feedback_dir, exist_ok=True)
                
                # Generate a unique filename
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"receipt_feedback_{user_id}_{timestamp}.json"
                
                # Save the feedback
                with open(receipt_feedback_dir / filename, 'w') as f:
                    json.dump({
                        'original': original_data,
                        'corrected': corrected_data,
                        'user_id': user_id,
                        'timestamp': datetime.now().isoformat()
                    }, f, indent=2)
                
                logger.info(f"Stored full receipt feedback in {filename}")
            
            return success
        except Exception as e:
            logger.error(f"Error collecting receipt feedback: {e}")
            return False
    
    def get_field_feedback_count(self) -> int:
        """Get the number of field feedback entries."""
        try:
            field_feedback_df = pd.read_csv(self.field_feedback_path)
            return len(field_feedback_df)
        except Exception as e:
            logger.error(f"Error getting field feedback count: {e}")
            return 0
    
    def get_category_feedback_count(self) -> int:
        """Get the number of category feedback entries."""
        try:
            category_feedback_df = pd.read_csv(self.category_feedback_path)
            return len(category_feedback_df)
        except Exception as e:
            logger.error(f"Error getting category feedback count: {e}")
            return 0
    
    def get_field_feedback(self) -> pd.DataFrame:
        """Get all field feedback."""
        try:
            return pd.read_csv(self.field_feedback_path)
        except Exception as e:
            logger.error(f"Error getting field feedback: {e}")
            return pd.DataFrame()
    
    def get_category_feedback(self) -> pd.DataFrame:
        """Get all category feedback."""
        try:
            return pd.read_csv(self.category_feedback_path)
        except Exception as e:
            logger.error(f"Error getting category feedback: {e}")
            return pd.DataFrame()
