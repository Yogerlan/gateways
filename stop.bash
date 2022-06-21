#!/bin/bash

kill -9 $(cat /tmp/server.pid)
rm /tmp/server.pid
