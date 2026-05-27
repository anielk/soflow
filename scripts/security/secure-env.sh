#!/bin/bash

# Security script to set proper permissions on environment files
echo "Setting secure permissions on environment files..."

# Make .env files readable only by owner
chmod 600 .env
chmod 600 .env.production

# Create a backup of the original files
cp .env .env.backup
cp .env.production .env.production.backup

echo "Environment files secured with 600 permissions"
echo "Backups created: .env.backup and .env.production.backup"