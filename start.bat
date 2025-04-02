@echo off
echo Checking for Docker...

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker is not installed. Please install Docker Desktop for Windows first.
    pause
    exit /b 1
)

where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker Compose is not installed. Please install Docker Desktop for Windows first.
    pause
    exit /b 1
)

echo Starting FavTUBE...
docker-compose up -d

echo Waiting for services to start...
timeout /t 10 /nobreak

echo Opening FavTUBE in your default browser...
start http://localhost:3000

echo FavTUBE is running! To stop the application, run: docker-compose down
pause 