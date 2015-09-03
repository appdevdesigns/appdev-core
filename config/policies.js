/**
 * Policy mappings (ACL)
 *
 * Policies are simply Express middleware functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect just one of its actions.
 *
 * Any policy file (e.g. `authenticated.js`) can be dropped into the `/policies` folder,
 * at which point it can be accessed below by its filename, minus the extension, (e.g. `authenticated`)
 *
 * For more information on policies, check out:
 * http://sailsjs.org/#documentation
 */

var path = require('path');
var sessionStack = ADCore.policy.serviceStack();
var passportStack = ADCore.policy.passportStack();

module.exports = {
    // This means any route that does not have its own policy will go through
    // the session stack.
	'*': sessionStack,
        
    'appdev-core/ADCoreController': {
        configData: sessionStack,
        labelConfigFile: sessionStack,
        logout: passportStack,
        authGoogle: passportStack,
        loginPost: passportStack,
        loginForm: passportStack,
        authFail: true
    }
};
