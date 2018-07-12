## Homework Assignment #1

### Task

Please create a simple "Hello World" API. Meaning:

1. It should be a RESTful JSON API that listens on a port of your choice. 

2. When someone posts anything to the route /hello, you should return 
a welcome message, in JSON format. This message can be anything you want. 

### Solution

The following steps were involved in parsing the request and giving the right 
response

- Getting the request's path
- Parsing the routes to remove unwanted slashes
- Using the path to send the request to the appropriate route
- Setting the payload on the requested route
- Sending the appropriate response (404 if not found and 200 if found)
- Setting the content type for the response to be of JSON
- Setting the port to user defined or 8080 if not defined
- Make the app listen on the appropriate port

:pizza: That's all folks
