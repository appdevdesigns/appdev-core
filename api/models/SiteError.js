/**
 * SiteError.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName:'site_error',

  connection:'appdev_default',

  attributes: {

    message : { type: 'text' },

    data : { type: 'json' },

    reviewed: { type: 'boolean' }
  }

};

