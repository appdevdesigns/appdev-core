/**
 * PermissionScopeObjectTrans.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName:'site_perm_scope_object_trans',

  // connection:'appdev_default',

  attributes: {

    permissionscopeobject: { model: 'PermissionScopeObject' },

    name : { type: 'string' },

    language_code : { type: 'string' }
  }
};

