const http = require('http');
const url = require('url');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  const method = req.method.toLowerCase();
  const headers = req.headers

  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    const requestedRouteHandler = typeof (routes[trimmedPath]) !== 'undefined' ?
      routes[trimmedPath] : routes.fourOhFour

    const data = {
      trimmedPath,
      method,
      headers,
      payload: buffer,
    }

    requestedRouteHandler(data, (statusCode, payload) => {
      const code = typeof(statusCode) === 'number' ? statusCode : 200;
      const resPayload = typeof(payload) === 'object' ? payload : {};
      const payloadString = JSON.stringify(resPayload);

      res.setHeader('Content-Type', 'application/json')
      res.writeHead(code);
      res.end(payloadString)
    });
  });
});

const handlers = {};

handlers.hello = (data, callback) => {
  if (data.method === 'post') {
    callback(200, { message: 'Hello Friend' });
  } else {
    callback(405);
  };
};

handlers.fourOhFour = (data, callback) => callback(404);

const routes = {
  hello: handlers.hello,
  fourOhFour: handlers.fourOhFour,
};

const port = process.env.port || 8080

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
