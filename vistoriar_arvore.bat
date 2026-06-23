@echo off
title Vistoria Ambiental - Parecer de Corte
cd /d "%~dp0"

if exist "vistoriar_arvore.exe" (
  set EXE=vistoriar_arvore.exe
) else (
  set EXE=node vistoriar_arvore.cjs
)

if not "%~1"=="" goto :rodar

echo ============================================
echo  VISTORIA AMBIENTAL
echo ============================================
echo.
echo  Duas formas de usar:
echo   1. Arraste uma foto para esta janela
echo   2. Digite o caminho da foto
echo.
set /p FOTO="Foto: "
if "%FOTO%"=="" exit /b
%EXE% "%FOTO%"
goto :fim

:rodar
%EXE% "%~1"

:fim
echo.
pause
