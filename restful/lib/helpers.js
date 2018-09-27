/*
 * Helpers for various tasks
 * 
 */
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');
// Container for helpers
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
};

// Send an SMS message via Twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
  // Validate parameters
  const phoneNumber = typeof(phone) == 'string' && phone.trim().length ?
    phone.trim() : false;
  const message = typeof(msg) == 'string' && msg.trim().length &&
    msg.trim().length <= 11 ? msg.trim() : false;

  if (phoneNumber && message) {
    // Configure the request payload
    const payload = {
      From: config.twilio.fromPhone,
      To: '+234' + phoneNumber,
      Body: message,
    };

    // Stringify the payload
    const stringPayload = querystring.stringify(payload);

    // Configure the request details
    const requestDetails = {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'POST',
      path: '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      auth: config.twilio.accountSid + ':' + config.twilio.authToken,
      headers: {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(stringPayload),
      },
    };

    // instantiate the request object
    const req = https.request(requestDetails, (res) => {
      // Grab the status of the response
      const status = res.statusCode;
      // Callback successful if the request went through
      if (status === 200 || status === 201) {
        callback(false);
      } else {
        callback('Status code returened was ' + status);
      };
    });

    req.on('error', e => callback(e));

    req.write(stringPayload);

    req.end();
  } else {
    callback('Giving parameters were missing or invalid')
  };
};

// Export heplers
module.exports = helpers;
