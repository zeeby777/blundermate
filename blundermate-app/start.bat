@echo off

REM Starting npm
start npm start

REM Navigate to backend directory and start flask
cd backend
start flask run --reload

exit