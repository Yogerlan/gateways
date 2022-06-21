#!/bin/bash

cd backend
nohup node server.js &>> server.log & echo $! > /tmp/server.pid
