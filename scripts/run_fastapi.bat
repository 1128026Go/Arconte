@echo off
cd /d "C:\Users\User\Herd\Aplicacion Juridica"
if exist apps\ingest_py\.venv\Scripts\activate.bat (call apps\ingest_py\.venv\Scripts\activate.bat)
uvicorn apps.ingest_py.src.main:app --host 127.0.0.1 --port 8001 --reload
pause
