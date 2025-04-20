import pandas as pd
import numpy as np
from typing import List, Dict
import random
import os
import json
import argparse

def generate_synthetic_data(output_path: str, n_samples: int = 10000):
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Update categories to match frontend
    category_data = {
        'Food & Dining': {
            'vendors': ['McDonalds', 'Subway', 'Chipotle', 'Local Restaurant', 'Pizza Hut'],
            'keywords': ['lunch', 'dinner', 'meal', 'restaurant', 'takeout', 'delivery']
        },
        'Transportation': {
            'vendors': ['Uber', 'Lyft', 'Shell', 'BP', 'Metro'],
            'keywords': ['ride', 'taxi', 'gas', 'fuel', 'transit', 'transportation']
        },
        'Bills & Utilities': {
            'vendors': ['AT&T', 'Verizon', 'Electric Company', 'Water Service'],
            'keywords': ['bill', 'utility', 'service', 'monthly', 'payment']
        },
        'Groceries': {
            'vendors': ['Walmart', 'Kroger', 'Safeway', 'Whole Foods', 'Trader Joes'],
            'keywords': ['groceries', 'food', 'produce', 'meat', 'dairy', 'bread']
        },
        'Entertainment': {
            'vendors': ['Netflix', 'AMC Theaters', 'Spotify', 'Steam', 'Xbox'],
            'keywords': ['movie', 'game', 'music', 'streaming', 'entertainment']
        },
        'Healthcare': {
            'vendors': ['CVS', 'Walgreens', 'Local Clinic', 'Quest Diagnostics'],
            'keywords': ['medicine', 'prescription', 'health', 'medical', 'doctor']
        },
        'Shopping': {
            'vendors': ['Amazon', 'Target', 'Best Buy', 'Nike', 'H&M'],
            'keywords': ['clothes', 'electronics', 'shoes', 'accessories', 'purchase']
        },
        'Others': {
            'vendors': ['Miscellaneous', 'Unknown Vendor', 'Various Services'],
            'keywords': ['payment', 'service', 'misc', 'other', 'general']
        }
    }

    # Generate synthetic transactions
    data = []
    for _ in range(n_samples):
        # Randomly select category
        category = random.choice(list(category_data.keys()))
        cat_info = category_data[category]

        # Generate vendor and description
        vendor = random.choice(cat_info['vendors'])
        keywords = random.sample(cat_info['keywords'], k=random.randint(1, 3))
        description = ' '.join(keywords)

        # Generate amount based on category
        if category == 'Housing':
            amount = random.uniform(800, 2500)
        elif category == 'Groceries':
            amount = random.uniform(20, 200)
        elif category == 'Dining':
            amount = random.uniform(10, 100)
        elif category == 'Transportation':
            amount = random.uniform(5, 80)
        elif category == 'Shopping':
            amount = random.uniform(15, 300)
        elif category == 'Entertainment':
            amount = random.uniform(10, 50)
        elif category == 'Healthcare':
            amount = random.uniform(20, 500)
        elif category == 'Utilities':
            amount = random.uniform(50, 200)
        else:  # Others
            amount = random.uniform(10, 1000)

        # Add some noise to descriptions
        if random.random() < 0.3:
            description += f" #{random.randint(1000, 9999)}"

        data.append({
            'category': category,
            'vendor': vendor,
            'description': description,
            'amount': round(amount, 2)
        })

    # Create DataFrame and save to CSV
    df = pd.DataFrame(data)
    df.to_csv(output_path, index=False)
    print(f"Generated {n_samples} synthetic transactions and saved to {output_path}")

    # Also create XGBoost training data in the same format expected by train_xgboost.py
    xgboost_data = []
    for item in data:
        xgboost_data.append({
            'Store': item['vendor'],
            'Items': item['description'],
            'Amount': item['amount'],
            'Category': item['category']
        })

    # Save XGBoost training data
    xgboost_df = pd.DataFrame(xgboost_data)
    xgboost_path = os.path.join(os.path.dirname(output_path), 'xgboost_training_data.csv')
    xgboost_df.to_csv(xgboost_path, index=False)
    print(f"Generated XGBoost training data and saved to {xgboost_path}")

    # Create a synthetic receipts JSON file for BERT training
    receipts_path = os.path.join(os.path.dirname(output_path), 'synthetic_receipts.json')
    with open(receipts_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Generated synthetic receipts and saved to {receipts_path}")

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Generate synthetic data for training')
    parser.add_argument('--data-dir', type=str, default='data', help='Directory to store data')
    parser.add_argument('--n-samples', type=int, default=10000, help='Number of synthetic samples to generate')
    parser.add_argument('--force-generate', action='store_true', help='Force regeneration of synthetic data')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    os.makedirs(args.data_dir, exist_ok=True)
    output_path = os.path.join(args.data_dir, 'transactions.csv')
    generate_synthetic_data(output_path, args.n_samples)
