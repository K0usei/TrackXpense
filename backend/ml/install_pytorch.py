"""
Script to install PyTorch and transformers for the BERT model.
"""
import os
import sys
import subprocess
import platform
import argparse
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Install PyTorch and transformers')
    parser.add_argument('--cuda', action='store_true', help='Install with CUDA support')
    parser.add_argument('--cuda-version', type=str, default='11.8', help='CUDA version (11.8 or 12.1)')
    parser.add_argument('--use-conda', action='store_true', help='Use conda instead of pip')
    return parser.parse_args()

def run_command(command):
    """Run a command and log the output."""
    logger.info(f"Running command: {command}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        logger.info(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed with exit code {e.returncode}")
        logger.error(e.stderr)
        return False

def install_with_pip(cuda=False, cuda_version='11.8'):
    """Install PyTorch and transformers with pip."""
    if cuda:
        if cuda_version not in ['11.8', '12.1']:
            logger.warning(f"Unsupported CUDA version: {cuda_version}. Using 11.8 instead.")
            cuda_version = '11.8'
        
        command = f"pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu{cuda_version.replace('.', '')}"
    else:
        command = "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu"
    
    success = run_command(command)
    if success:
        logger.info("PyTorch installed successfully.")
        
        # Install transformers
        success = run_command("pip install transformers")
        if success:
            logger.info("Transformers installed successfully.")
            return True
        else:
            logger.error("Failed to install transformers.")
            return False
    else:
        logger.error("Failed to install PyTorch.")
        return False

def install_with_conda(cuda=False, cuda_version='11.8'):
    """Install PyTorch and transformers with conda."""
    if cuda:
        if cuda_version not in ['11.8', '12.1']:
            logger.warning(f"Unsupported CUDA version: {cuda_version}. Using 11.8 instead.")
            cuda_version = '11.8'
        
        command = f"conda install pytorch torchvision torchaudio pytorch-cuda={cuda_version} -c pytorch -c nvidia -y"
    else:
        command = "conda install pytorch torchvision torchaudio cpuonly -c pytorch -y"
    
    success = run_command(command)
    if success:
        logger.info("PyTorch installed successfully.")
        
        # Install transformers
        success = run_command("pip install transformers")
        if success:
            logger.info("Transformers installed successfully.")
            return True
        else:
            logger.error("Failed to install transformers.")
            return False
    else:
        logger.error("Failed to install PyTorch.")
        return False

def verify_installation():
    """Verify that PyTorch and transformers are installed correctly."""
    try:
        # Create a temporary script to verify installation
        script = """
import torch
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"CUDA version: {torch.version.cuda}")
    print(f"GPU: {torch.cuda.get_device_name(0)}")

import transformers
print(f"Transformers version: {transformers.__version__}")
"""
        
        with open("verify_pytorch.py", "w") as f:
            f.write(script)
        
        # Run the script
        result = subprocess.run([sys.executable, "verify_pytorch.py"], capture_output=True, text=True)
        
        # Print the output
        print("\nVerification results:")
        print(result.stdout)
        
        # Clean up
        os.remove("verify_pytorch.py")
        
        return "PyTorch version" in result.stdout and "Transformers version" in result.stdout
    except Exception as e:
        logger.error(f"Error verifying installation: {e}")
        return False

def main():
    """Main function to install PyTorch and transformers."""
    args = parse_args()
    
    logger.info("Starting PyTorch and transformers installation...")
    
    # Detect platform
    system = platform.system()
    logger.info(f"Detected platform: {system}")
    
    if args.use_conda:
        logger.info("Using conda for installation...")
        success = install_with_conda(args.cuda, args.cuda_version)
    else:
        logger.info("Using pip for installation...")
        success = install_with_pip(args.cuda, args.cuda_version)
    
    if success:
        logger.info("Installation completed. Verifying...")
        if verify_installation():
            logger.info("Verification successful. PyTorch and transformers are installed correctly.")
            
            # Print next steps
            print("\nNext steps:")
            print("1. Train the BERT model:")
            print("   python train_bert.py --data-dir data --model-dir models/bert_receipt_classifier")
            print("\n2. The system will automatically use the BERT model for receipt field classification.")
        else:
            logger.warning("Verification failed. Please check the installation manually.")
    else:
        logger.error("Installation failed. Please try again or install manually.")
        
        # Print manual installation instructions
        print("\nManual installation instructions:")
        print("1. For CPU-only:")
        print("   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu")
        print("   pip install transformers")
        print("\n2. For CUDA 11.8:")
        print("   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118")
        print("   pip install transformers")

if __name__ == "__main__":
    main()
