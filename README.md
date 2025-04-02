# FavTUBE

A web application for downloading and cutting YouTube videos.

## Prerequisites

- Docker Desktop (includes both Docker and Docker Compose)
  - For Windows: Download from [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
  - For macOS: Download from [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
  - For Linux: Follow the [Docker installation guide](https://docs.docker.com/engine/install/)

## Installation

1. Make sure you have Docker Desktop installed on your system.
2. Clone this repository or download the source code.
3. For Linux/macOS users, make the start script executable:
   ```bash
   chmod +x start.sh
   ```

## Usage

### Windows Users
1. Double-click `start.bat` or run it from Command Prompt:
   ```cmd
   start.bat
   ```

### Linux/macOS Users
1. Double-click `start.sh` or run it from Terminal:
   ```bash
   ./start.sh
   ```

2. The application will start and automatically open in your default web browser at http://localhost:3000

3. To stop the application, run:
   ```bash
   docker-compose down
   ```

## Features

- Download YouTube videos in various formats and qualities
- Cut videos into segments
- Extract audio from videos
- Download video thumbnails
- Search YouTube videos

## Development

To run the application in development mode:

1. Start the backend:
   ```bash
   cd backend
   python app.py
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Troubleshooting

If you encounter any issues:

1. Make sure Docker Desktop is running
2. Check if ports 3000 and 5000 are available
3. Try running `docker-compose down` first, then start the application again
4. For Windows users, make sure you're running the script as an administrator if you encounter permission issues

## License

MIT License
