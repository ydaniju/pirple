// Dependencies
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const _data = require('./data');
const helpers = require('./helpers');

// Initilaize workers
const workers = {};

// Lookup all checks, get their data, end to a validator
workers.gatherAllChecks = () => {
  // Get all the checks
  _data.list('checks', (err, checks) => {
    if (!err && checks && checks.length) {
      checks.map((check) => {
        // Read in the check data
        _data.read('checks', check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            // Pass it to the check validator, and let the function
            // continue or log error as needed
            workers.validateCheckData(originalCheckData);

          } else {
            console.log("Error: Reading one of the check's data")
          }
        });
      });
    } else {
      console.log('Error: Could not find any checks to process');
    };
  });
};

// Sanity-check the check data
workers.validateCheckData = (checkData) => {
  const originalCheckData = typeof(checkData) == 'object' && checkData !== null ?
    checkData : {};
  originalCheckData.id = typeof(checkData.id) == 'string' &&
    checkData.id.length === 20 ? checkData.id : false;
  originalCheckData.userPhone = typeof(checkData.userPhone) == 'string' &&
    checkData.userPhone.length ? checkData.userPhone : false;
  originalCheckData.protocol = typeof(checkData.protocol) === 'string' && ['http', 'https']
    .indexOf(checkData.protocol) > -1 ? checkData.protocol.trim() : false;
  originalCheckData.url = typeof(checkData.url) === 'string' &&
    checkData.url.trim().length > 0 ? checkData.url.trim() : false;
  originalCheckData.method = typeof(checkData.method) === 'string' && ['post', 'get', 'put', 'delete']
    .indexOf(checkData.method) > -1 ? checkData.method.trim() : false;
  originalCheckData.successCodes = typeof(checkData.successCodes) === 'object' &&
    checkData.successCodes instanceof Array && checkData.successCodes.length > 0
    ? checkData.successCodes : false;
  originalCheckData.timeoutSeconds = typeof(checkData.timeoutSeconds) === 'number' &&
    checkData.timeoutSeconds % 1 === 0 && checkData.timeoutSeconds >= 1 &&
    checkData.timeoutSeconds <= 5 ? checkData.timeoutSeconds : false;

  // Set the keys that may not be set (if the workers have never seen this check before)
  originalCheckData.state = typeof(checkData.state) === 'string' && ['up', 'down']
    .indexOf(checkData.state) > -1 ? checkData.state : 'down';
  originalCheckData.lastChecked = typeof(checkData.lastChecked) === 'number' &&
    checkData.lastChecked > 0 ? checkData.lastChecked : false;

  // if all the checks passed, pass the check to the next step in the process
  if (originalCheckData.id && originalCheckData.userPhone &&
      originalCheckData.protocol && originalCheckData.url &&
      originalCheckData.method && originalCheckData.successCodes &&
      originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData);
  } else {
    callback("Error: one of the checks is not formatted properly");
  };
};

// perform the check, send the originalCheckData and outcome of the check
workers.performCheck = (originalCheckData) => {
  // prepare the initial check outcome
  const checkOutcome = {
    error: false,
    responseCode: false,
  };

  // mark that the outcome has not been sent
  let outcomeSent = false;

  // parse the hostname and the path of the original check data
  const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`);
  const hostName = parsedUrl.hostname;
  const path = parsedUrl.path; // Using the path and not pathname because we want query string

  // construct the request
  const requestDetails = {
    protocol: `${originalCheckData.protocol}:`,
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    timeout: originalCheckData.timeoutSeconds * 1000,
    path: path,
  };

  // instantiate the request object using http or https request module
  const _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
  const req = _moduleToUse.request(requestDetails, (res) => {
    // Grab the status of the sent request
    const status = res.statusCode;

    // update the outcome object and pass the data along
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    };
  });

  // Bind to the err event so it doesn't get thrown
  req.on('error', (err) => {
    // Update the checkOutcome object and pass the data along
    checkOutcome.error = {
      error: true,
      value: err,
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    };
  });

  // Bind to the timeout event
  req.on('timeout', (err) => {
    // Update the checkOutcome object and pass the data along
    checkOutcome.error = {
      error: true,
      value: 'timeout',
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    };
  });

  // end / send the request
  req.end();
};

// Process the check outcome, update the check data as needed, trigger an alert
// if needed
// Special logic for accommodating a check that has not been tested before.
// (don't alert on that one) 
workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
  // decide if the check is up or down
  const state = !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ?
    'up' : 'down';
  
  // Decide if an alert is waranted
  const alertWarranted = originalCheckData.lastChecked &&
    originalCheckData.state !== state;
  
  // Update the check data
  const newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // save the updates
  _data.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      // send the new data to the next phase in the process if needed
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log('Check outcome has not changed. No alert needed');
      };
    } else {
      console.log('Error: Trying to save updates to one of the checks');
    };
  });
};

workers.alertUserToStatusChange = (checkData) => {
  const msg = `Alert! Your check for ${checkData.method.toUpperCase()} is
    currently ${checkData.state}`;
  
  helpers.sendTwilioSms(checkData.userPhone, msg, (err) => {
    if (!err) {
      console.log('Success: User was alerted to a status change in their check');
    } else {
      console.log('Error: Could not send sms alert to user after state change');
    };
  });
};

// Timer to execute the process once per minute
workers.loop = () => setInterval(() => workers.gatherAllChecks(), 1000 * 60);

// Init script
workers.init = () => {
  // Execute all the checks immediately
  workers.gatherAllChecks();

  // Call the loop so the check will execute later on
  workers.loop();
};

// Export workers
module.exports = workers;
