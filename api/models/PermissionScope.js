/**
* PermissionScope.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

    tableName:"site_perm_scope",
    // migrate:'safe',  // don't update the tables!
migrate:'alter',  // modify the tables

  attributes: {

    label : { type: 'string' }, 

    permission:{
        collection:'Permission',
        via:'scope'
    }
  }
};

