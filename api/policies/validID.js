/**
 * validID
 * 
 * @module      :: Policy
 * @description :: if an :id field is present, make sure it is a valid number, object, or array
 *
 */
var _ = require('lodash');

module.exports = function(req, res, next) {

	// pull the value of 'id' 
    var id = req.param('id');
    if (id) {
// console.log('... .validID: id:'+ typeof id);
    	// make sure it is a number
		if ((_.isFinite(id))
			|| ( (_.isString(id)) && (_.isFinite(_.toInteger(id))))) {

			// looks good for an ID
			next();

		} else {

			if (_.isArray(id)) {

				// looks like we are requesting specific ids:
				// id:[1,2,3]
console.log('... policy/.validID: id looks like an array query:', id );

				next();
				
			} else if (_.isPlainObject(id)) {

				// this could be a complex ID query:
				// id: { '!':[1,2,3]}
console.log('... policy/.validID: id looks like a complex ID query:', id );

				next();

			} else {

				console.log('... policy/.validID():  invalid id:'+id);
				console.log('    for path:'+req.method + ' ' + req.url);
				ADCore.comm.error(res, new Error('unknown id: '+id), 404);
			}
		}

    } else {

    	// no id was expected so continue
    	next();
    }

};
