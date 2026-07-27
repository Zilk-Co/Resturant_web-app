@echo off
set JWT_SECRET=rfc-jwt-secret-2026-production-key-xK9mPz
set JWT_REFRESH_SECRET=rfc-jwt-refresh-secret-2026-qL3nRw

cd /d "E:\THB_WEB_APP\resturant-app-main\resturant-app-main\artifacts\api-server"
start "API Server" cmd /k "node --enable-source-maps ./dist/index.mjs"

cd /d "E:\THB_WEB_APP\resturant-app-main\resturant-app-main\artifacts\admin"
start "Admin Panel" cmd /k "npx vite --config vite.config.ts --host 0.0.0.0"

cd /d "E:\THB_WEB_APP\resturant-app-main\resturant-app-main\artifacts\web"
start "Website" cmd /k "npx vite --config vite.config.ts --host 0.0.0.0 --port 3001"

echo All servers started!
pause