# Group Work Peer Assessment System

Imperial College MSc Computing Science Individual Project

## Getting Started

The system is already deployed to https://imperialfair.herokuapp.com/ for presenting purpose.

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Node.js - for the web server and running server side JavaScript
MongoDB - the database

Once Node.js and MongoDB is stored, we need package managers NPM (for server side) and bower (for client side). NPM usually comes with Node.js. To install bower, simply run

```
$ npm install -g bower
```

### Installing

After prerequisites are installed, run

```
npm install
```

and

```
bower install
```

to install the project dependencies in package.json and bower.json.


## Run the system

In the config.js file, use your stantard MongoDB URI as the connection string and "http://localhost:5000/api" as the API URL.

Run

```
node server.js
```

to run the server locally.

Note: the system uses the college accounts to log in.
