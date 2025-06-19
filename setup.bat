@echo off
echo ========================================
echo AI Nutrition Assistant Setup Script
echo ========================================
echo.

echo Installing root dependencies...
npm install

echo.
echo Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
cd ..

echo.
echo Creating environment file...
if not exist "backend\.env" (
    copy "backend\env.example" "backend\.env"
    echo Environment file created from template.
    echo Please edit backend\.env with your actual configuration.
) else (
    echo Environment file already exists.
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the development servers:
echo   npm run dev
echo.
echo To start only the frontend:
echo   npm run dev:frontend
echo.
echo To start only the backend:
echo   npm run dev:backend
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at: http://localhost:5000
echo.
pause 