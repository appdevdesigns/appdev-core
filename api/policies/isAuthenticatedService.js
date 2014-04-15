/**
 * isAuthenticatedService
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

    // NOTE: no authentication mechanism is in place at the moment
    // so for now:
//    return next();
console.log('isAuthenticatedService()');

    // User is allowed, proceed to the next policy,
    // or if this is the last policy, the controller
    if (ADCore.auth.isAuthenticated(req)) {
console.log('isAuthenticated() => true');
        return next();
    } else {

        // call the authentication's
        if (sails.config.appdev.authType == 'CAS') {
console.log('   ... CAS.isAuthenticate()');
            CAS.isAuthenticated(req, res, next);
        } else {
            ADCore.auth.local.isAuthenticated(req, res, next);
        }
    }

    // User is not allowed
    // This is used on services that should be alerted to reauthenticate.
//    return ADCore.comm.reauth(res);
};
