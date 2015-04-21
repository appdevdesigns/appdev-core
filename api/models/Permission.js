/**
* Permission.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  tableName:"site_permission",

  attributes: {

    user : {
        model:'SiteUser'
    },

    role : {
        model:'PermissionRole'
    },

    scope : { type: 'string' }
  }
};

