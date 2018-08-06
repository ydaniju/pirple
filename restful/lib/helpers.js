/*
 * Helpers for various tasks
 * 
 */

// Container for helpers
const crypto = require('crypto');
const config = require('./config');
const helpers = {};

helpers.hash = (str) => {
  if(typeof(str) === 'string') {
    const hash = crypto.createHmac('sha256', config.hashingSecret)
      .update(str).digest('hex');
    return hash;
  } else {
    return false;
  };
};

// Parse a JSON string to an object in all cases, without throwing error
helpers.parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch(e) {
    return {};
  }
};

// Create a string of random alphanumeric characters of a give length
helpers.createRandomString = (strLength) => {
  const verifiedLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : 0;
  if (verifiedLength) {
    // Define all the possible characters that could go into the string
    const possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return (" ".repeat(verifiedLength)).split('').map((a) => possibleChars
      .charAt(Math.floor(Math.random() * possibleChars.length))).join('');
  } else {
    return false;
  }
}

// Export heplers
module.exports = helpers;
