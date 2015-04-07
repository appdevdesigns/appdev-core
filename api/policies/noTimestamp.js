/**
 * noTimestamp.js
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

    // jQuery tends to add a  _ = ######### timestamp which will 
    // confuse our blueprint routes thinking this is supposed to be
    // a field value ...

    if (req.param('_')) {

        // jQuery adds the '_' to the query string
        // so delete it there:
        delete req.query._;

    }

    next();

};
