@echo off
REM ============================================
REM ADMIN PANEL STARTUP
REM ============================================
title THB Restaurant - Admin Panel
color 0C

cd /d "E:\THB_WEB_APP\resturant-app-main\resturant-app-main\artifacts\admin"

echo.
echo ====================================
echo Starting Admin Panel...
echo Port: 3000
echo URL: http://192.168.0.119:3000
echo ====================================
echo.

npx vite --config vite.config.ts --host 0.0.0.0
