/**
 * Primary file for the api
 */

// Dependencies

const server = require('./lib/server');
// const workers = require('./lib/worker');

// Declare the app
const app = {};

// Init function
app.init = () => {
  // Start the server
  server.init();

  // Start the worker
  // workers.init();
};

// Execute 
app.init();

// Export the app
module.exports = app;
