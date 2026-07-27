@echo off
REM ============================================
REM WEBSITE STARTUP
REM ============================================
title THB Restaurant - Website
color 0B

cd /d "E:\THB_WEB_APP\resturant-app-main\resturant-app-main\artifacts\web"

echo.
echo ====================================
echo Starting Website...
echo Port: 3001
echo URL: http://192.168.0.119:3001
echo ====================================
echo.

npx vite --config vite.config.ts --host 0.0.0.0 --port 3001
