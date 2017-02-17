/**
 * PermissionScopeTrans.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName:'site_perm_scope_trans',
migrate:'alter',

  attributes: {

    permissionscope: { model: 'PermissionScope' },

    // {string} the multilingual label of this scope.
    label : { type: 'string' },

    language_code : { type: 'string' }
  }
};

