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

// Timer to execute the process once per minute
workers.loop = () => setInterval(() => workers.gatherAllChecks, 1000 * 60);

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
            console.log("Error reading one of the check's data")
          }
        });
      });
    } else {
      console.log('Could not find any checks to process');
    };
  });
};

// Sanity-check the check data
workers.validateCheckData = (checkData) => {
  const originalCheckData = typeof(checkData) == 'object' && checkData !== null ?
    checkData : {};
  originalCheckData.id = typeof(checkData.id) == 'string' &&
    checkData.id.length === 20 ? checkData.id : false;
  originalCheckData.userPhone = typeof(checkData.id) == 'string' &&
    checkData.id.length === 20 ? checkData.id : false;
  originalCheckData.id = typeof(checkData.id) == 'string' &&
    checkData.id.length === 20 ? checkData.id : false;
  
};
// Init script
workers.init = () => {
  // Execute all the checks immediately
  workers.gatherAllChecks();

  // Call the loop so the check will execute later on
};

// Export workers
module.exports = workers;
