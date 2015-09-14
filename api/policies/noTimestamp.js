/**
 * noTimestamp.js
 *
 * @module      :: Policy
 * @description :: Removes _ from the query
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
