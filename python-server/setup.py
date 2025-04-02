#!/usr/bin/env python
"""
Setup script for the Attendance Management System Python server.
This will create the necessary directories and install dependencies.
"""

import os
import sys
import subprocess
import platform

# Define directories to be created
DIRS = [
    "uploads",
    "uploads/students",
    "data",
    "data/attendance"
]

def create_directories():
    """Create the necessary directories for the server."""
    print("Creating directories...")
    for directory in DIRS:
        os.makedirs(directory, exist_ok=True)
        print(f"  Created {directory}/")
    print("Directories created successfully.")

def install_dependencies():
    """Install the required Python packages."""
    print("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Dependencies installed successfully.")
    except subprocess.CalledProcessError:
        print("Error installing dependencies. Please try manually running:")
        print("  pip install -r requirements.txt")
        return False
    return True

def check_dlib_dependencies():
    """Check if system dependencies for dlib are satisfied."""
    system = platform.system()
    if system == "Windows":
        print("\nNOTE: On Windows, additional setup may be required for dlib:")
        print("  1. Install Visual Studio with C++ build tools")
        print("  2. You may need to install dlib manually from:")
        print("     https://github.com/datamagic2020/Install-dlib\n")
    elif system == "Linux":
        print("\nNOTE: On Linux, you may need to install these dependencies:")
        print("  sudo apt-get install build-essential cmake libopenblas-dev liblapack-dev")
        print("  sudo apt-get install libx11-dev libgtk-3-dev python3-dev python3-pip\n")
    elif system == "Darwin":  # macOS
        print("\nNOTE: On macOS, you may need to install these dependencies:")
        print("  brew install cmake")
        print("  brew install boost")
        print("  brew install boost-python3\n")

def main():
    """Main setup function."""
    print("Setting up Attendance Management System Python server...")
    create_directories()
    check_dlib_dependencies()
    if install_dependencies():
        print("\nSetup completed successfully!")
        print("To start the server, run: python app.py")
    else:
        print("\nSetup completed with warnings. Please resolve the issues above before starting the server.")

if __name__ == "__main__":
    main() 