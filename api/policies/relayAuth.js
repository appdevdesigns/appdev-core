/**
 * relayAuth
 * 
 * @module      :: Policy
 * @description :: Check to see if the AppBuilder ABRelayUser is provided, and
 * verify if the proper access token is provided..
 *
 */
 var _ = require('lodash');

module.exports = function(req, res, next) {
    
    var token = req.headers['authorization'];

    if (_.isUndefined(sails.models['abrelayuser']) || !token) {
        next();
        return;
    }
        

    ABRelayUser.findOne({publicAuthToken: token})
    .then((relayUser)=>{

        // if we didn't find one, continue:
        if (!relayUser) {
            sails.log.debug('relayAuth: token provided, but no user matching token:'+token);
            next();
            return;
        }

        ADCore.auth.loadUserByGUID(relayUser.siteuser_guid)
        .fail(function(err) {
            sails.log('relayAuth: Failed to load user [' + relayUser.siteuser_guid + '] using auth key');
            sails.log(err);
            // Continue normally and let other policies generate
            // the error message if the request is unauthorized.
            next();
        })
        .done(function(user) {
            sails.log('relayAuth: User [' + relayUser.siteuser_guid + '] loaded using auth key');
            req.user = user;
            next();
        });

    })

};
