/**
 * initSession
 * 
 * @module      :: Policy
 * @description :: make sure all session related values are properly setup
 *
 */
module.exports = function(req, res, next) {

    
    // make sure the appdev session obj is created.
    req.session.appdev = req.session.appdev || ADCore.session.default();


    // if this is a socket request, then initialize the socket info:
    if (req.isSocket) {
        ADCore.socket.init(req);
    }


    // ok, user data is now an object:
    next();

};
