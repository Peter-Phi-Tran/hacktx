#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "Error: .env file not found. Please create one from .env.example"
  exit 1
fi

# Extract database connection details from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not found in .env file"
  exit 1
fi

echo "Starting PostgreSQL database container..."

# Start docker compose
docker-compose up -d db

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 3

# Check if container is running
if [ "$(docker ps -q -f name=hacktx-postgres)" ]; then
  echo "✓ PostgreSQL database is running!"
  echo "✓ Connection string: $DATABASE_URL"
  echo ""
  echo "To stop the database, run: docker-compose down"
  echo "To view logs, run: docker-compose logs -f db"
else
  echo "✗ Failed to start PostgreSQL container"
  exit 1
fi
