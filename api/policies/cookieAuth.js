/**
 * cookieAuth
 * 
 * @module      :: Policy
 * @description :: Authenticate a user based on a prearranged ticket that is
 *                 delivered via cookie.
 *
 */
module.exports = function(req, res, next) {
    
    if (req.AD.isAuthenticated()) {
        next();
    }
    else {
        
        // Check if a ticket is present in the cookies
        var ticket = ADCore.auth.cookieAuth.getTicket(req);
        if (ticket) {
            var auth = ADCore.auth.passport.authenticate('cookieAuth');
            auth(req, res, function() {
                // Remove the expended ticket from cookie
                res.cookie(ADCore.auth.cookieAuth.cookieName, '', {
                    expires: new Date(Date.now() - 1000)
                });
                next();
            });
        }
        else {
            next();
        }
    
    }
};
