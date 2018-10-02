/**
 * Server-related tasks
 */


// Dependencies

const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const path = require('path');
const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');

// Instantiate the server module object
const server = {};

// instantiating the http server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

// instantiating the https server
server.httpsServer = https.createServer(
  server.httpsServerOptions, (req, res) => server.unifiedServer(req, res)
);

// all the logic for both http and https servers
server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // get query string as an object
  const queryStringObject = parsedUrl.query;

  // get the headers as an object
  const headers = req.headers;
  const method = req.method.toLowerCase();

  // get payload if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // choose which handler request should go to
    const chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ?
      server.router[trimmedPath] : server.router.notFound

    // construct data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
    }

    // Route the routes to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      // use status code from handler or use default of 200
      const code = typeof (statusCode) === 'number' ? statusCode : 200;

      // use the payload from handler or default to an empty handler
      const resPayload = typeof (payload) === 'object' ? payload : {};

      // convert payload to string
      const payloadString = JSON.stringify(resPayload);

      // return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(code);
      res.end(payloadString);

      console.log('We are returning ', code, payloadString);
    });
  });
}

// Define a req router
server.router = {
  ping: handlers.ping,
  notFound: handlers.notFound,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
};

// Init script
server.init = () => {
  // Start http server
  server.httpServer.listen(config.httpPort, () => {
    console.log(`Server is listening at port ${config.httpPort}`);
  });

  // Start https server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(`Server is listening at port ${config.httpsPort}`);
  });
};

// Export server
module.exports = server;
