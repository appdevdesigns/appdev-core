/**
 * relayAuth
 * 
 * Used by app_builder.
 * When it receives a request through the secure relay, it turns around and
 * re-submits that request to itself on behalf of the relay user.
 * @see app_builder/api/services/ABRelay.js :: _formatServerRequest()
 * 
 * @module      :: Policy
 * @description :: Check to see if the AppBuilder ABRelayUser is provided, and
 * verify if the proper access token is provided..
 *
 */
 
module.exports = function(req, res, next) {
    
    var auth = req.headers['authorization'];

    // Skip if ABRelayUser is not implemented on this OpsPortal server.
    if (!sails.models['abrelayuser']) {
        next();
        return;
    }

    // Skip if the authorization header is the wrong format
    if (!auth || auth.slice(0, 8) != "relay@@@") {
        next();
        return;
    }

    if (!sails.config.appbuilder) {
        next();
        return;
    }

    // Expected format is "relay@@@<mcc access token>@@@<ABRelayUser UUID>"
    var authParts = auth.split("@@@");
    var mccToken = authParts[1];
    var userUUID = authParts[2];

    if (mccToken != sails.config.appbuilder.mcc.accessToken) {
        sails.log.debug("relayAuth: incorrect MCC access token");
        next();
        return;
    }
        

    ABRelayUser.findOne({user: userUUID})
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

            if (user) {
                sails.log('relayAuth: User [' + relayUser.siteuser_guid + '] loaded using auth key');
                req.user = user;
                
            } else {

                var data = {
                    message: '!!! relayAuth: User ['+ relayUser.siteuser_guid + '] NOT LOADED using auth key ['+token+']',
                    relayUser:relayUser,
                    token:token
                }
                ADCore.error.log('AppBuilder:Policy[relayAuth]:'+data.message, data);
            }
            
            next();
        });

    })

};
