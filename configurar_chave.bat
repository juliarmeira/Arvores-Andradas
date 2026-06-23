@echo off
title Configurar Chave Gemini - Vistoria Ambiental
cd /d "%~dp0"
echo ============================================
echo  Configurar chave da API Google Gemini
echo ============================================
echo.
echo  Para usar o sistema de vistoria, voce precisa
echo  de uma chave gratuita do Google Gemini.
echo.
echo   1. Acesse: https://aistudio.google.com/apikey
echo   2. Clique em "Create API Key"
echo   3. Copie a chave gerada
echo.
set /p CHAVE="Cole sua chave Gemini aqui: "

if "%CHAVE%"=="" (
    echo.
    echo Nenhuma chave fornecida.
    echo.
    pause
    exit /b
)

echo GEMINI_API_KEY=%CHAVE%> .env
echo GEMINI_API_KEY=%CHAVE%> %USERPROFILE%\.gemini_api_key

setx GEMINI_API_KEY "%CHAVE%" >nul

echo.
echo [OK] Chave salva em tres lugares:
echo   1. .env           (pasta do sistema)
echo   2. ~\.gemini_api_key (backup)
echo   3. Variavel de ambiente do Windows (permanente)
echo.
echo Feche e reabra o terminal se for usar via node.
echo Se for usar o .exe, ja pode testar!
echo.
pause
