/**
 * PermissionScopeController
 *
 * @description :: Server-side logic for managing Permissionscopes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    _config: {
        model: "permissionscope", // all lowercase model name
        actions: false,
        shortcuts: false,
        rest: true
    },

    // this method is used in unit tests to test if your 
    // actions are enabled or not.
    _unitTestAccessActions: function(req, res) {
        res.AD.success();
    }
	
};

