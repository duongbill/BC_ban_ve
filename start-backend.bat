@echo off
echo Starting Festival Marketplace Backend...
echo.

REM Check if MongoDB is running
echo Checking MongoDB...
mongod --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: MongoDB not found! Please install MongoDB first.
    echo Visit: https://www.mongodb.com/try/download/community
    pause
    exit /b 1
)

echo MongoDB found.
echo.

REM Start MongoDB if not running
echo Starting MongoDB...
net start MongoDB >nul 2>&1
if errorlevel 1 (
    echo MongoDB already running or manual start required.
    echo To start manually: mongod --dbpath=C:\data\db
)

echo.
echo Starting Backend Server...
cd backend
node server.js
