@echo off
REM ============================================
REM RFC RESTAURANT APP - FULL STARTUP
REM ============================================
echo.
echo ============================================
echo THB Restaurant (The Hunger Bite Istanbul) - Full Stack Startup
echo ============================================
echo.
echo This will open 3 terminal windows for:
echo   1. API Server (Port 8080)
echo   2. Admin Panel (Port 3000)
echo   3. Website (Port 3001)
echo.
echo Make sure your phone is on the same WiFi network!
echo Your LAN IP: 192.168.0.119
echo.
echo ============================================
echo.

REM Start all three servers in separate windows
start "API Server" cmd /c "E:\THB_WEB_APP\resturant-app-main\resturant-app-main\start-api.bat"
timeout /t 3

start "Admin Panel" cmd /c "E:\THB_WEB_APP\resturant-app-main\resturant-app-main\start-admin.bat"
timeout /t 3

start "Website" cmd /c "E:\THB_WEB_APP\resturant-app-main\resturant-app-main\start-website.bat"

echo.
echo ============================================
echo All servers started!
echo ============================================
echo.
echo Access from your phone:
echo   - Website:  http://192.168.0.119:3001
echo   - App:      Install via EAS build (running now)
echo.
echo Access from this PC:
echo   - Admin:    http://localhost:3000
echo   - Website:  http://localhost:3001
echo   - API:      http://localhost:8080
echo.
echo Keep these windows open while testing!
echo ============================================
echo.
pause
