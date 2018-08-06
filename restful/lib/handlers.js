/*
 * Request handlers 
 * 
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define the handlers
const handlers = {};

// users handler
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  };
};

// Container for users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
  // Check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) === 'string' &&
    data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) === 'string' &&
    data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) === 'string' &&
    data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) === 'string' &&
    data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' &&
    data.payload.tosAgreement ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user does not already exist
    _data.read('users', phone, (err, data) => {
      if (err) {
        // hash the password
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          // create the user object
          const userObject = {
            firstName,
            lastName,
            phone,
            tosAgreement,
            hashedPassword,
          };

          // Store the user
          _data.create('users', phone, userObject, (err) => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(422, { 'Error': 'Could not create the new user' });
            };
          });
        } else {
          callback(422, { 'Error': 'Could not hash the users password' });
        }
      } else {
        callback(404, { 'Error': 'A user with that phone number already exists' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
}

// Users - get
// Required data: phone
// Optional data: none
// @TODO let only authenticated user access their object and not anyone else's
handlers._users.get = (data, callback) => {
  // Check if phone number passed is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' ?
    data.queryStringObject.phone.trim() : false;
  if (phone) {
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        // Remove the hashed password from user object before returning
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(404, { 'Error': 'Missing field required' });
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO let only authenticated user update their object and not anyone else's
handlers._users.put = (data, callback) => {
  // Check if phone number passed is valid
  const phone = typeof(data.payload.phone) === 'string' ?
    data.payload.phone.trim() : false;
  const firstName = typeof(data.payload.firstName) === 'string' &&
    data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) === 'string' &&
    data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) === 'string' &&
    data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if the phone is invalid
  if(phone) {
    // Error if nothing is sent for update
    if(firstName || lastName || password) {
      // Lookup the user
      _data.read('users', phone, (err, userData) => {
        if (!err && userData) {
          // updates the necessary field
          if (firstName) {
            userData.firstName = firstName;
          };
          if(lastName) {
            userData.lastName = lastName;
          };
          if(password) {
            userData.hashedPassword = helpers.hash(password);
          };
          // Store the new updates
          _data.update('users', phone, userData, (err) => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { 'Error': 'Could not update the user' });
            }
          });
        } else {
          callback(400, { 'Error': 'The specified user does not exist' });
        }
      })
    } else {
      callback(400, { 'Error': 'Missing fields to update' });
    };
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Users - delete
// Required data: phone
// Optional data: none
// @TODO let authenticated user delete their data and no one else
// @TODO delete any other data related to user
handlers._users.delete = (data, callback) => {
  // Check if phone number passed is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' ?
    data.queryStringObject.phone.trim() : false;
  if(phone) {
    _data.delete('users', phone, (err) => {
      if(!err) {
        callback(200);
      } else {
        callback(500, { 'Error': 'Could not delete the specified user' });
      };
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  };
};

// Tokens
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  };
}

// Container for all the token methods
handlers._tokens = {};

// Tokens - post
// Required data: phone and password
handlers._tokens.post = (data, callback) => {
  const phone = typeof(data.payload.phone) === 'string' &&
    data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) === 'string' &&
    data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (phone && password) {
    // lookup the user who matches the phone
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        // Hash the sent password and compare to the stored user password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          // If valid create a new token with a randome name and set validity 
          // for one hour from now
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60
          const tokenObject = {
            phone,
            id: tokenId,
            expires,
          };
          // Store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { 'Error': 'Could not create the random string '});
            };
          });
        } else {
          callback(400, { 'Error': 'Password did not match the specified user stored password' });
        };
      } else {
        callback(400, { 'Error': 'Could not find user specified' });
      };
    });
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  };
};

// REquired data: id
// Optional data: none
handlers._tokens.get = (data, callback) => {
  // Check if phone number passed is valid
  console.log(data.queryStringObject.id)
  const id = typeof(data.queryStringObject.id) === 'string' && 
    data.queryStringObject.id.trim().length === 20 ? 
    data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(404, { 'Error': 'Missing field required' });
  }
};


// ping handler
handlers.ping = (data, callback) => {
  // callback a http status code, and a payload object
  callback(200);
};

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Export the handlers
module.exports = handlers;