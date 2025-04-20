from sklearn.model_selection import GridSearchCV
import xgboost as xgb
import numpy as np
from train import CategoryModelTrainer

def tune_hyperparameters(X_train, y_train):
    param_grid = {
        'max_depth': [3, 4, 5, 6],
        'learning_rate': [0.01, 0.1, 0.3],
        'subsample': [0.8, 0.9, 1.0],
        'colsample_bytree': [0.8, 0.9, 1.0],
        'min_child_weight': [1, 3, 5]
    }
    
    xgb_model = xgb.XGBClassifier(
        objective='multi:softprob',
        eval_metric='mlogloss',
        use_label_encoder=False
    )
    
    grid_search = GridSearchCV(
        estimator=xgb_model,
        param_grid=param_grid,
        cv=5,
        scoring='accuracy',
        verbose=2,
        n_jobs=-1
    )
    
    grid_search.fit(X_train, y_train)
    
    return grid_search.best_params_

if __name__ == "__main__":
    trainer = CategoryModelTrainer('data/transactions.csv', 'models')
    X_train, _, y_train, _ = trainer.load_and_preprocess_data()
    X_train_features = trainer.prepare_features(X_train)
    
    best_params = tune_hyperparameters(X_train_features, y_train)
    print(f"Best parameters: {best_params}")