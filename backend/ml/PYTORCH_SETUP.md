# Setting Up PyTorch for TrackXpense

This guide will help you set up PyTorch and the transformers library to enable the full BERT-based receipt field classification in TrackXpense.

## Why PyTorch?

PyTorch is a powerful deep learning framework that enables us to use state-of-the-art models like BERT (Bidirectional Encoder Representations from Transformers) for more accurate receipt field classification. While the simplified rule-based classifier works well for basic receipts, BERT provides significantly better results for complex receipts with unusual formats.

## Installation Options

### Option 1: Install with pip (Recommended for most users)

```bash
# For CPU-only (smaller download, works on all systems)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install transformers
pip install transformers
```

### Option 2: Install with CUDA support (For systems with NVIDIA GPUs)

If you have an NVIDIA GPU and want to leverage it for faster model training and inference:

```bash
# For CUDA 11.8
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# For CUDA 12.1
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install transformers
pip install transformers
```

### Option 3: Install with conda (Alternative approach)

If you prefer using conda:

```bash
# CPU-only
conda install pytorch torchvision torchaudio cpuonly -c pytorch

# With CUDA
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia

# Install transformers
pip install transformers
```

## Verifying Installation

To verify that PyTorch is installed correctly, run the following Python code:

```python
import torch
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"CUDA version: {torch.version.cuda}")
    print(f"GPU: {torch.cuda.get_device_name(0)}")

import transformers
print(f"Transformers version: {transformers.__version__}")
```

## Troubleshooting Common Issues

### Issue: "DLL load failed" or "not a valid Win32 application" on Windows

This usually happens when there's a mismatch between your Python version and the PyTorch wheel.

**Solution:**
1. Uninstall PyTorch: `pip uninstall torch torchvision torchaudio`
2. Reinstall with the CPU-only version: `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu`

### Issue: "No module named 'torch'" after installation

**Solution:**
1. Check if you're using the same Python environment where you installed PyTorch
2. Try reinstalling: `pip install torch --force-reinstall`

### Issue: CUDA out of memory

**Solution:**
1. Reduce batch size in `train_bert.py` (change `batch_size=16` to a smaller value like `batch_size=4`)
2. Use CPU-only version if your GPU has limited memory

## Training the BERT Model

After installing PyTorch and transformers, you can train the BERT model:

```bash
python train_bert.py --data-dir data --model-dir models/bert_receipt_classifier
```

The system will automatically detect and use the BERT model if available.

## Switching Between Models

The receipt processing pipeline will automatically use:
1. BERT model if PyTorch is available and the model is trained
2. Simplified classifier if PyTorch is not available or BERT model is not trained
3. Rule-based parsing as a last resort

You don't need to manually switch between these options - the system handles it automatically based on what's available.
