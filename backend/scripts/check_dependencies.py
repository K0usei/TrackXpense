#!/usr/bin/env python3
"""
Script to check for missing dependencies in the Python codebase.

Usage:
python backend/scripts/check_dependencies.py
"""

import os
import sys
import re
import importlib
import subprocess
from pathlib import Path

def get_installed_packages():
    """Get a list of installed packages using pip freeze."""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "freeze"],
            capture_output=True,
            text=True,
            check=True
        )
        packages = {}
        for line in result.stdout.splitlines():
            if "==" in line:
                name, version = line.split("==", 1)
                packages[name.lower()] = version
            elif ">=" in line:
                name, version = line.split(">=", 1)
                packages[name.lower()] = version
        return packages
    except subprocess.CalledProcessError as e:
        print(f"Error getting installed packages: {e}")
        return {}

def get_required_packages(requirements_file):
    """Parse a requirements.txt file and return a list of required packages."""
    if not os.path.exists(requirements_file):
        return {}
    
    packages = {}
    with open(requirements_file, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
                
            # Handle different version specifiers
            if "==" in line:
                name, version = line.split("==", 1)
                packages[name.lower()] = version
            elif ">=" in line:
                name, version = line.split(">=", 1)
                packages[name.lower()] = version
            elif "[" in line:  # Handle extras like python-jose[cryptography]
                name = line.split("[", 1)[0].lower()
                packages[name] = "any"
            else:
                packages[line.lower()] = "any"
    
    return packages

def find_imports_in_file(file_path):
    """Extract import statements from a Python file."""
    imports = set()
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Find standard imports
    for match in re.finditer(r"import\s+([\w\.]+)", content):
        module = match.group(1).split(".")[0]
        imports.add(module)
    
    # Find from imports
    for match in re.finditer(r"from\s+([\w\.]+)\s+import", content):
        module = match.group(1).split(".")[0]
        imports.add(module)
    
    return imports

def find_all_imports(directory):
    """Find all imports in Python files in a directory."""
    all_imports = set()
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                try:
                    imports = find_imports_in_file(file_path)
                    all_imports.update(imports)
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
    
    return all_imports

def is_standard_library(module_name):
    """Check if a module is part of the Python standard library."""
    try:
        module_path = importlib.util.find_spec(module_name)
        if module_path is None:
            return False
        
        path_str = str(module_path.origin)
        return "site-packages" not in path_str and "dist-packages" not in path_str
    except (ImportError, AttributeError):
        return False

def main():
    """Main function to check dependencies."""
    # Get the project root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)
    project_dir = os.path.dirname(backend_dir)
    
    # Paths to requirements files
    main_requirements = os.path.join(backend_dir, "requirements.txt")
    ml_requirements = os.path.join(backend_dir, "ml", "requirements.txt")
    
    # Get required packages
    main_required = get_required_packages(main_requirements)
    ml_required = get_required_packages(ml_requirements)
    all_required = {**main_required, **ml_required}
    
    # Get installed packages
    installed = get_installed_packages()
    
    # Find all imports in the codebase
    backend_imports = find_all_imports(backend_dir)
    
    # Filter out standard library imports
    third_party_imports = {imp for imp in backend_imports if not is_standard_library(imp)}
    
    print("=== TrackXpense Python Dependency Check ===")
    
    # Check for imports not in requirements
    missing_in_requirements = []
    for imp in third_party_imports:
        # Skip some common aliases and submodules
        if imp in ["app", "tests", "main", "models", "schemas", "utils", "config"]:
            continue
            
        # Convert some common package names
        pkg_name = imp.lower()
        if pkg_name == "sklearn":
            pkg_name = "scikit-learn"
        elif pkg_name == "PIL":
            pkg_name = "pillow"
        
        if pkg_name not in all_required:
            missing_in_requirements.append(imp)
    
    if missing_in_requirements:
        print("\n⚠️ Imports found in code but not listed in requirements:")
        for imp in sorted(missing_in_requirements):
            print(f"  - {imp}")
    else:
        print("\n✅ All imports found in code are listed in requirements")
    
    # Check for required packages not installed
    missing_installations = []
    for pkg in all_required:
        if pkg not in installed:
            missing_installations.append(pkg)
    
    if missing_installations:
        print("\n⚠️ Required packages not installed:")
        for pkg in sorted(missing_installations):
            print(f"  - {pkg}")
    else:
        print("\n✅ All required packages are installed")
    
    # Check for installed packages not in requirements
    extra_installations = []
    for pkg in installed:
        if pkg not in all_required and not pkg.startswith("pip") and not pkg.startswith("wheel") and not pkg.startswith("setuptools"):
            extra_installations.append(pkg)
    
    if extra_installations:
        print("\n⚠️ Installed packages not in requirements:")
        for pkg in sorted(extra_installations):
            print(f"  - {pkg}")
    else:
        print("\n✅ All installed packages are listed in requirements")
    
    print("\n=== Dependency Check Complete ===")

if __name__ == "__main__":
    main()
