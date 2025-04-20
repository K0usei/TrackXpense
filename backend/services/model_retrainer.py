"""
Model retraining service for continuous learning.
This service retrains the models using collected feedback.
"""
import os
import sys
import json
import logging
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import subprocess
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the parent directory to the path to import the ML modules
sys.path.append(str(Path(__file__).parent.parent))

class ModelRetrainer:
    """Retrains models using collected feedback for continuous learning."""
    
    def __init__(self, 
                 feedback_dir: str = 'data/feedback',
                 data_dir: str = 'data',
                 model_dir: str = 'models',
                 min_feedback_count: int = 10):
        """
        Initialize the model retrainer.
        
        Args:
            feedback_dir: Directory containing feedback data
            data_dir: Directory containing training data
            model_dir: Directory containing models
            min_feedback_count: Minimum number of feedback entries required for retraining
        """
        self.feedback_dir = Path(feedback_dir)
        self.data_dir = Path(data_dir)
        self.model_dir = Path(model_dir)
        self.min_feedback_count = min_feedback_count
        
        # Check if directories exist
        os.makedirs(self.feedback_dir, exist_ok=True)
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Paths to feedback files
        self.field_feedback_path = self.feedback_dir / 'field_feedback.csv'
        self.category_feedback_path = self.feedback_dir / 'category_feedback.csv'
        
        # Check if PyTorch is available
        self.pytorch_available = self._check_pytorch_available()
        if self.pytorch_available:
            logger.info("PyTorch is available. Will use BERT for field classification.")
        else:
            logger.info("PyTorch is not available. Will use simplified classifier for field classification.")
    
    def _check_pytorch_available(self) -> bool:
        """Check if PyTorch is available."""
        try:
            import torch
            import transformers
            return True
        except ImportError:
            return False
    
    def check_retraining_needed(self) -> Tuple[bool, bool]:
        """
        Check if retraining is needed based on feedback count.
        
        Returns:
            Tuple[bool, bool]: (field_retraining_needed, category_retraining_needed)
        """
        field_feedback_count = 0
        category_feedback_count = 0
        
        # Check field feedback
        if self.field_feedback_path.exists():
            try:
                field_feedback_df = pd.read_csv(self.field_feedback_path)
                field_feedback_count = len(field_feedback_df)
            except Exception as e:
                logger.error(f"Error reading field feedback: {e}")
        
        # Check category feedback
        if self.category_feedback_path.exists():
            try:
                category_feedback_df = pd.read_csv(self.category_feedback_path)
                category_feedback_count = len(category_feedback_df)
            except Exception as e:
                logger.error(f"Error reading category feedback: {e}")
        
        logger.info(f"Field feedback count: {field_feedback_count}")
        logger.info(f"Category feedback count: {category_feedback_count}")
        
        field_retraining_needed = field_feedback_count >= self.min_feedback_count
        category_retraining_needed = category_feedback_count >= self.min_feedback_count
        
        return field_retraining_needed, category_retraining_needed
    
    def incorporate_field_feedback(self) -> bool:
        """
        Incorporate field feedback into training data.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Check if field feedback exists
            if not self.field_feedback_path.exists():
                logger.warning("Field feedback file does not exist.")
                return False
            
            # Load field feedback
            field_feedback_df = pd.read_csv(self.field_feedback_path)
            if len(field_feedback_df) == 0:
                logger.warning("No field feedback available.")
                return False
            
            # Load existing BERT training data
            bert_data_path = self.data_dir / 'bert_training_data.csv'
            if not bert_data_path.exists():
                logger.warning(f"BERT training data not found at {bert_data_path}")
                return False
            
            bert_df = pd.read_csv(bert_data_path)
            
            # Convert feedback to training data format
            feedback_training_data = []
            for _, row in field_feedback_df.iterrows():
                feedback_training_data.append({
                    'text': row['text'],
                    'label': row['corrected_label']
                })
            
            feedback_df = pd.DataFrame(feedback_training_data)
            
            # Combine with existing training data
            combined_df = pd.concat([bert_df, feedback_df], ignore_index=True)
            
            # Remove duplicates (keep the latest version if text is the same)
            combined_df = combined_df.drop_duplicates(subset=['text'], keep='last')
            
            # Save combined training data
            combined_df.to_csv(bert_data_path, index=False)
            logger.info(f"Incorporated {len(feedback_df)} field feedback entries into training data.")
            
            # Backup the feedback file
            backup_dir = self.feedback_dir / 'backups'
            os.makedirs(backup_dir, exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_path = backup_dir / f"field_feedback_{timestamp}.csv"
            shutil.copy2(self.field_feedback_path, backup_path)
            
            # Clear the feedback file
            empty_df = pd.DataFrame(columns=field_feedback_df.columns)
            empty_df.to_csv(self.field_feedback_path, index=False)
            
            logger.info(f"Backed up field feedback to {backup_path} and cleared the feedback file.")
            return True
        except Exception as e:
            logger.error(f"Error incorporating field feedback: {e}")
            return False
    
    def incorporate_category_feedback(self) -> bool:
        """
        Incorporate category feedback into training data.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Check if category feedback exists
            if not self.category_feedback_path.exists():
                logger.warning("Category feedback file does not exist.")
                return False
            
            # Load category feedback
            category_feedback_df = pd.read_csv(self.category_feedback_path)
            if len(category_feedback_df) == 0:
                logger.warning("No category feedback available.")
                return False
            
            # Load existing XGBoost training data
            xgboost_data_path = self.data_dir / 'xgboost_training_data.csv'
            if not xgboost_data_path.exists():
                logger.warning(f"XGBoost training data not found at {xgboost_data_path}")
                return False
            
            xgboost_df = pd.read_csv(xgboost_data_path)
            
            # Convert feedback to training data format
            feedback_training_data = []
            for _, row in category_feedback_df.iterrows():
                feedback_training_data.append({
                    'Store': row['vendor'],
                    'Items': row['description'],
                    'Amount': row['amount'],
                    'Category': row['corrected_category']
                })
            
            feedback_df = pd.DataFrame(feedback_training_data)
            
            # Combine with existing training data
            combined_df = pd.concat([xgboost_df, feedback_df], ignore_index=True)
            
            # Save combined training data
            combined_df.to_csv(xgboost_data_path, index=False)
            logger.info(f"Incorporated {len(feedback_df)} category feedback entries into training data.")
            
            # Backup the feedback file
            backup_dir = self.feedback_dir / 'backups'
            os.makedirs(backup_dir, exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_path = backup_dir / f"category_feedback_{timestamp}.csv"
            shutil.copy2(self.category_feedback_path, backup_path)
            
            # Clear the feedback file
            empty_df = pd.DataFrame(columns=category_feedback_df.columns)
            empty_df.to_csv(self.category_feedback_path, index=False)
            
            logger.info(f"Backed up category feedback to {backup_path} and cleared the feedback file.")
            return True
        except Exception as e:
            logger.error(f"Error incorporating category feedback: {e}")
            return False
    
    def retrain_field_classifier(self) -> bool:
        """
        Retrain the field classifier.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Determine which model to train based on PyTorch availability
            if self.pytorch_available:
                logger.info("Retraining BERT field classifier...")
                script_path = Path(__file__).parent.parent / 'ml' / 'train_bert.py'
                model_dir = self.model_dir / 'bert_receipt_classifier'
            else:
                logger.info("Retraining simplified field classifier...")
                script_path = Path(__file__).parent.parent / 'ml' / 'train_simplified_bert.py'
                model_dir = self.model_dir / 'simplified_receipt_classifier'
            
            # Create model directory if it doesn't exist
            os.makedirs(model_dir, exist_ok=True)
            
            # Run the training script
            cmd = [
                sys.executable,
                str(script_path),
                '--data-dir', str(self.data_dir),
                '--model-dir', str(model_dir)
            ]
            
            logger.info(f"Running command: {' '.join(cmd)}")
            process = subprocess.run(cmd, capture_output=True, text=True)
            
            if process.returncode == 0:
                logger.info("Field classifier retraining successful.")
                logger.info(process.stdout)
                return True
            else:
                logger.error(f"Field classifier retraining failed with exit code {process.returncode}")
                logger.error(process.stderr)
                return False
        except Exception as e:
            logger.error(f"Error retraining field classifier: {e}")
            return False
    
    def retrain_category_classifier(self) -> bool:
        """
        Retrain the category classifier.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            logger.info("Retraining XGBoost category classifier...")
            script_path = Path(__file__).parent.parent / 'ml' / 'train_xgboost.py'
            
            # Run the training script
            cmd = [
                sys.executable,
                str(script_path),
                '--data-dir', str(self.data_dir),
                '--model-dir', str(self.model_dir)
            ]
            
            logger.info(f"Running command: {' '.join(cmd)}")
            process = subprocess.run(cmd, capture_output=True, text=True)
            
            if process.returncode == 0:
                logger.info("Category classifier retraining successful.")
                logger.info(process.stdout)
                return True
            else:
                logger.error(f"Category classifier retraining failed with exit code {process.returncode}")
                logger.error(process.stderr)
                return False
        except Exception as e:
            logger.error(f"Error retraining category classifier: {e}")
            return False
    
    def retrain_models(self) -> Dict[str, bool]:
        """
        Retrain models based on feedback.
        
        Returns:
            Dict[str, bool]: Results of retraining each model
        """
        results = {
            'field_classifier': False,
            'category_classifier': False
        }
        
        # Check if retraining is needed
        field_retraining_needed, category_retraining_needed = self.check_retraining_needed()
        
        # Retrain field classifier if needed
        if field_retraining_needed:
            logger.info("Field classifier retraining needed.")
            if self.incorporate_field_feedback():
                results['field_classifier'] = self.retrain_field_classifier()
        else:
            logger.info("Field classifier retraining not needed.")
        
        # Retrain category classifier if needed
        if category_retraining_needed:
            logger.info("Category classifier retraining needed.")
            if self.incorporate_category_feedback():
                results['category_classifier'] = self.retrain_category_classifier()
        else:
            logger.info("Category classifier retraining not needed.")
        
        return results
