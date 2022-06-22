# Gateways

REST service for storing information about gateways and their associated devices.

## Prerequisites

* [Node.js](https://nodejs.org/en/download/)
* [Angular CLI](https://angular.io/guide/setup-local)
```bash
npm install -g @angular/cli
```

## Setup

### The easy way

Run `install.bash` script to setup
```bash
install.bash
```

### The hard way

Install backend dependencies...
```bash
cd backend
npm install
```
Install frontend dependencies...
```bash
cd frontend
npm install
```
Build frontend...
```bash
ng build
```

## Test suites

Run test suites for the REST service...
```bash
cd backend
npm test
```

## Start service

Run `start.bash` to start the service locally.
Open the browser at http://localhost:3000/ to access the application.

## Stop service

Run `stop.bash` to stop the service.

## TODO

* MongoDB database support: I chose Sqlite3 because I had little time to master MongoDB.
* Improve error handling: I limited error handling in the backend to logging some of them (for simplicity).
* Frontend data validation: Data validation was not implemented in the frontend, although I tried to cover it in the backend.
* Design pattern: The backend does not respond to any specific design pattern. Some improvements would include separating endpoints by entity (gateway, device), splitting code into routes, controllers, services, models, etc.