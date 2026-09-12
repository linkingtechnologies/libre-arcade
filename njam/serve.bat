@echo off
where php >nul 2>nul
if %errorlevel%==0 (
  echo Serving Njam at http://127.0.0.1:8000/
  php -S 127.0.0.1:8000
  goto :eof
)
where caddy >nul 2>nul
if %errorlevel%==0 (
  echo Serving Njam at http://127.0.0.1:8000/
  caddy file-server --listen :8000
  goto :eof
)
echo Install PHP or Caddy, or serve this folder with another static HTTP server.
pause
