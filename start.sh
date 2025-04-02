#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Start the application
echo "Starting FavTUBE..."
docker-compose up -d

# Wait for the services to be ready
echo "Waiting for services to start..."
sleep 10

# Open the browser
echo "Opening FavTUBE in your default browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:3000
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start http://localhost:3000
else
    echo "Please open http://localhost:3000 in your browser"
fi

echo "FavTUBE is running! To stop the application, run: docker-compose down" 