#!/bin/bash

echo Installing backend dependencies...
cd backend
npm install

echo Installing frontend dependencies...
cd ../frontend
npm install

echo Building frontend...
ng build

echo Finish!!!
echo
echo Run start.bash to start local expressjs server.
echo Open the browser at http://localhost:3000/ to access the application.
