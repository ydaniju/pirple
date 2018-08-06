const http = require('http');
const url = require('url');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    const requestedRouteHandler = typeof (routes[trimmedPath]) !== 'undefined' ?
      routes[trimmedPath] : routes.fourOhFour

    requestedRouteHandler({}, (statusCode, payload) => {
      const code = typeof(statusCode) === 'number' ? statusCode : 200;
      const resPayload = typeof(payload) === 'object' ? payload : {};
      const payloadString = JSON.stringify(resPayload);

      res.setHeader('Content-Type', 'application/json')
      res.writeHead(code);
      res.end(payloadString)
    });
  });
});
 
const routes = {
  hello: (data, callback) => callback(200, { message: 'Hello Friend' }),
  fourOhFour: (data, callback) => callback(404),
};

const port = process.env.port || 8080

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
