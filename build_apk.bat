@echo off
cd /d C:\Adausta\mobile
C:\flutter\bin\flutter.bat build apk --release
echo.
echo ============================================
echo APK hazir: build\app\outputs\flutter-apk\app-release.apk
echo ============================================
pause
