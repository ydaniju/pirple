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
}

// Export heplers
module.exports = helpers;
