@echo off
title KASIRKITA - Kasir Pintar & Manajemen Kafe
color 06

echo ========================================================
echo        KASIRKITA - KASIR PINTAR & MANAJEMEN KAFE        
echo ========================================================
echo.

cd /d "%~dp0"

if not exist node_modules (
    echo [INFO] Folder node_modules belum ada. Menjalankan npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Gagal menginstal dependencies.
        pause
        exit /b %errorlevel%
    )
)

echo [INFO] Membuka browser ke http://localhost:5173 ...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

echo [INFO] Menjalankan server dan aplikasi frontend...
echo.
call npm run dev

pause
