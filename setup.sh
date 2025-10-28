#!/bin/bash

# Press Release AI Agent - Setup Script
# This script helps you set up the agent quickly

set -e

echo "=========================================="
echo "Press Release AI Agent - Setup"
echo "=========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Found Python $python_version"

# Create virtual environment
echo ""
echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created"
else
    echo "Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
echo ""
echo "Creating directories..."
mkdir -p logs
mkdir -p temp
mkdir -p config

echo "Directories created: logs/, temp/, config/"

# Create .env file if it doesn't exist
echo ""
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ".env file created - PLEASE EDIT IT WITH YOUR CREDENTIALS"
else
    echo ".env file already exists"
fi

# Check if config/settings.yaml exists
if [ ! -f "config/settings.yaml" ]; then
    echo "WARNING: config/settings.yaml not found!"
    echo "This should have been created automatically."
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials:"
echo "   nano .env"
echo ""
echo "2. Review configuration:"
echo "   nano config/settings.yaml"
echo ""
echo "3. Test the setup:"
echo "   source venv/bin/activate"
echo "   cd src"
echo "   python main.py --mode test"
echo ""
echo "4. Run the agent:"
echo "   python main.py --mode once"
echo ""
echo "For detailed instructions, see README.md and QUICKSTART.md"
echo ""
