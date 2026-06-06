@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo   Studio One 7 AI Dictionary - Launcher
echo ============================================
echo.
echo Current folder:
cd
echo.

REM --- Check this is the correct folder ---
if not exist "package.json" (
  echo [ERROR] package.json not found in this folder.
  echo Please make sure START_HERE.bat is inside the
  echo unzipped "studio-one-ai" folder, then run it again.
  echo.
  pause
  exit /b
)

REM --- Check Node.js ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found.
  echo Install it from https://nodejs.org then run again.
  echo.
  pause
  exit /b
)

REM --- Create .env if missing ---
if not exist ".env" (
  echo PORT=3200> .env
  echo.
  echo Created .env file.
  echo.
)

REM --- Install dependencies (first time only) ---
if not exist "node_modules" (
  echo First-time setup. Installing... please wait 1-2 minutes.
  call npm install
  echo.
)

REM --- Build ---
echo Building...
call npm run build
echo.

REM --- Open browser ---
echo Opening browser: http://localhost:3200
start "" http://localhost:3200

echo.
echo ============================================
echo  Server starting.
echo  DO NOT CLOSE this window (closing stops it).
echo ============================================
echo.

REM --- Start server ---
call npm start

pause
