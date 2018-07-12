var mathLib = require('./lib/math');
var jokesLib = require('./lib/jokes');

// App object
var app = {};

// Application config
app.config = {
  'timeBetweenJokes' : 1000,
};

// function that prints a random joke

app.printAJoke = function() {
  var allJokes = jokesLib.allJokes();

  var numberOfJokes = allJokes.length;

  var randomNumber = mathLib.getRandomNumber(1, numberOfJokes);

  var selectedJoke = allJokes[randomNumber - 1]

  console.log(selectedJoke);
  console.log(process.env.NODE_ENV);
}

app.indefinitLoop = function() {
  setInterval(app.printAJoke, app.config.timeBetweenJokes);
}

app.indefinitLoop();
