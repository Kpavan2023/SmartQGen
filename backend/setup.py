"""
Setup script for Smart AI MCQ Generator Backend
Run this script to set up the backend environment
"""

import os
import sys
import subprocess
import platform


def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")


def check_python_version():
    """Check if Python version is 3.8 or higher"""
    print_header("Checking Python Version")

    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")

    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Error: Python 3.8 or higher is required")
        print("Please install Python 3.8+ from python.org")
        return False

    print("✓ Python version is compatible")
    return True


def check_pip():
    """Check if pip is installed"""
    print_header("Checking pip")

    try:
        subprocess.run([sys.executable, "-m", "pip", "--version"],
                      check=True, capture_output=True)
        print("✓ pip is installed")
        return True
    except subprocess.CalledProcessError:
        print("❌ Error: pip is not installed")
        return False


def create_env_file():
    """Create .env file from example"""
    print_header("Setting up Environment File")

    if os.path.exists(".env"):
        print("ℹ .env file already exists")
        overwrite = input("Overwrite? (y/N): ").strip().lower()
        if overwrite != 'y':
            print("Keeping existing .env file")
            return True

    if not os.path.exists(".env.example"):
        print("❌ Error: .env.example not found")
        return False

    # Copy .env.example to .env
    with open(".env.example", "r") as src:
        content = src.read()

    with open(".env", "w") as dst:
        dst.write(content)

    print("✓ Created .env file from template")
    print("⚠ Please edit .env and add your Supabase credentials")
    return True


def install_dependencies():
    """Install Python dependencies"""
    print_header("Installing Dependencies")

    if not os.path.exists("requirements.txt"):
        print("❌ Error: requirements.txt not found")
        return False

    print("Installing packages... This may take 10-15 minutes")
    print("AI models will be downloaded automatically (~1-2GB)")
    print()

    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "--upgrade", "pip"],
            check=True
        )

        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            check=True
        )

        print("\n✓ All dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error installing dependencies: {e}")
        return False


def create_directories():
    """Create necessary directories"""
    print_header("Creating Directories")

    dirs = ["temp", "exports"]

    for directory in dirs:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"✓ Created {directory}/ directory")
        else:
            print(f"ℹ {directory}/ directory already exists")

    return True


def verify_setup():
    """Verify the setup"""
    print_header("Verifying Setup")

    # Check critical imports
    critical_packages = [
        "fastapi",
        "uvicorn",
        "transformers",
        "torch",
        "supabase"
    ]

    all_ok = True
    for package in critical_packages:
        try:
            __import__(package)
            print(f"✓ {package} is importable")
        except ImportError:
            print(f"❌ {package} import failed")
            all_ok = False

    return all_ok


def main():
    """Main setup function"""
    print("\n")
    print("╔═══════════════════════════════════════════════════════╗")
    print("║   Smart AI MCQ Generator - Backend Setup             ║")
    print("╚═══════════════════════════════════════════════════════╝")

    # Run setup steps
    steps = [
        ("Checking Python version", check_python_version),
        ("Checking pip", check_pip),
        ("Creating environment file", create_env_file),
        ("Installing dependencies", install_dependencies),
        ("Creating directories", create_directories),
        ("Verifying setup", verify_setup),
    ]

    failed = False
    for step_name, step_func in steps:
        if not step_func():
            failed = True
            print(f"\n❌ Setup failed at: {step_name}")
            break

    if not failed:
        print_header("Setup Complete!")
        print("✓ Backend is ready to run")
        print()
        print("Next steps:")
        print("1. Edit .env file with your Supabase credentials")
        print("2. Run the server: python main.py")
        print()
        print("For detailed instructions, see SETUP_GUIDE.md")
        print()
    else:
        print_header("Setup Failed")
        print("Please fix the errors and run setup again")
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()
