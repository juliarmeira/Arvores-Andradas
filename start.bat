@echo off
title Servidor de Vistoria de Arvores - Andradas
cd /d "%~dp0"
echo ============================================================
echo   SISTEMA DE VISTORIA E CADASTRO DE ARVORES - ANDRADAS
echo ============================================================
echo.
echo   Instalando dependencias (na primeira execucao)...
echo.
call npm install --no-audit --no-fund
echo.
echo   Iniciando o servidor...
echo.
node server.js
pause
