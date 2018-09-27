/* 
  Create and export configuration
*/

// Container for all the environments

const environments = {};

// Staging (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'thisIsASecret',
  maxChecks: 5,
  twilio: {
    accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006',
  }
};

// Production environment
environments.production = {
  httpPort: 5000,
  httpPort: 5001,
  envName: 'production',
  hashingSecret: 'thisIsAlsoSecret',
  maxChecks: 5,
  twilio: {
    accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006',
  }
};


// Determine which one to export

const currentEnv = typeof(process.env.NODE_ENV) == 'string' ?
  process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments
// above if not default to staging

const environmentToExport = typeof(environments[currentEnv]) == 'object' ? 
  environments[currentEnv] : environments.staging;

module.exports = environmentToExport;
