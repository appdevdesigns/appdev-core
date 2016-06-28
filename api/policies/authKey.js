/**
 * authKey
 * 
 * @module      :: Policy
 * @description :: Log the current user in as an existing user if a 
 *                 preconfigured key value is present in the request headers.
 *
 */
module.exports = function(req, res, next) {
    
    var lookup = sails.config.appdev.authKeys;
    /*
        lookup == {
            'admin_guid': [ 
                'c81878992a3b08b28781ac553db6ea1212781dd0',
                'c9009fa7de950bf5fb69185ba1d5e619b7a993a3'
            ],
            'guest_guid': [
                '0ecf34c6e2c3ce84b00c40831d18f4c69289d89f'
            ],
            'some_guid': '1abf59cb5a366e0a2677be261464c8fb9f04d01f',
            ...
        }
    */
    var thisKey = req.headers['authorization'];
    
    if (lookup && thisKey) {
        
        for (var guid in lookup) {
            var keys = lookup[guid];
            if (!Array.isArray(keys)) {
                keys = [keys];
            }
            if (keys.indexOf(thisKey) >= 0) {
                ADCore.auth.loadUserByGUID(guid)
                .fail(function(err) {
                    sails.log('Failed to load user [' + guid + '] using auth key');
                    sails.log(err);
                    // Continue normally and let other policies generate
                    // the error message if the request is unauthorized.
                    next();
                })
                .done(function(user) {
                    req.user = user;
                    next();
                });
                return;
            }
        }
        
        sails.log('No matches for auth key [' + thisKey +']');
        next();
    }
    else {
        next();
    }
};
