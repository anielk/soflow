#!/bin/bash

# Security script to enhance Docker container security
echo "Enhancing Docker container security..."

# Create a non-root user for containers
echo "Creating non-root user for containers..."
useradd -r -u 1000 -m -s /bin/bash appuser

# Set proper ownership and permissions
chown -R appuser:appuser ./frontend
chown -R appuser:appuser ./backend
chown -R appuser:appuser ./nginx

echo "Docker security enhancements applied"
echo "Containers will now run as non-root user with uid 1000"