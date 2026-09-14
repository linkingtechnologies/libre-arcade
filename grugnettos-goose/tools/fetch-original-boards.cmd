@echo off
cd /d "%~dp0.."
node tools\fetch-original-boards.mjs
if errorlevel 1 pause
