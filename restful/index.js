// Dependency

const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// instantiating the http server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
};

// instantiating the https server
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

httpServer.listen(config.httpPort, () => {
  console.log(`Server is listening at port ${config.httpPort}`);
});

httpsServer.listen(config.httpsPort, () => {
  console.log(`Server is listening at port ${config.httpsPort}`);
});


// all the logic for both http and https servers
const unifiedServer = (req, res) => {
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
    const chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ?
      router[trimmedPath] : router.notFound

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
const router = {
  ping: handlers.ping,
  notFound: handlers.notFound,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
};