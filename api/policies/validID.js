/**
 * validID
 * 
 * @module      :: Policy
 * @description :: if an :id field is present, make sure it is a valid number
 *
 */
var _ = require('lodash');

module.exports = function(req, res, next) {

	// pull the value of 'id' 
    var id = req.param('id');
    if (id) {

    	// make sure it is a number
		if (_.isFinite(id)) {

			// looks good for an ID
			next();

		} else {

			console.log('... policy/isValid():  invalid id:'+id);
			ADCore.comm.error(res, new Error('unknown id: '+id), 404);
		}

    } else {

    	// no id was expected to continue
    	next();
    }

};
