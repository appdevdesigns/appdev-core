/**
 * SiteUser
 *
 * @module      :: Model
 * @description :: Database store of user accounts on the site
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var crypto = require('crypto');

module.exports = {

    tableName:"site_user",
    // autoCreatedAt:true,
    // autoUpdatedAt:true,
    // autoPK:false,
    // migrate:'alter',  // don't update the tables!


    // connection:"appdev_default",


    attributes: {

        id: {
            type: 'integer',
            primaryKey: true,
            autoIncrement: true
        },
        
        // GUID from external authentication service such as CAS
        guid: {
            type: 'text'
        },
        
        username: {
            type: 'text'
        },
        
        // md5 hashed password
        password: {
            type: 'text',
            defaultsTo: ''
        },
        
        isActive: {
            type: 'integer',
            size: 1,
            defaultsTo: 1
        },
        
        languageCode : {
            type : "string",
            size : 25,
            defaultsTo: function() {
                return sails.config.appdev['lang.default'];
            }
        }

    },
    
    
    ////////////////////////////
    // Model class methods
    ////////////////////////////


    // Returns the MD5 hash value of the given string
    hash: function(clearText) {
        var md5 = crypto.createHash('md5');
        md5.update(clearText);
        return md5.digest('hex');
    },
    
    
    // Wrapper for SiteUser.find() that automatically MD5 encodes the
    // password string using MD5 if it is provided.
    //
    // (Would be nice if we could just extend the "parent" find() method)
    hashedFind: function(findOpts) {
        if (findOpts.password) {
            findOpts.password = SiteUser.hash(findOpts.password);
        }
        return SiteUser.find(findOpts);
    },
    
    
    
    ////////////////////////////
    // Model callback methods
    ////////////////////////////
    
    
    beforeCreate: function(values, next) {
        // Set username = GUID if not provided
        if (!values.username && values.guid) {
            values.username = values.guid;
        }
        
        // Set GUID = username if not provided
        if (!values.guid && values.username) {
            values.guid = values.username;
        }
        
        // Encode the password if provided
        if (values.password) {
            values.password = SiteUser.hash(values.password);
        }
        
        next();
    },
    
    
    beforeUpdate: function(values, next) {
        if (values.password) {
            values.password = SiteUser.hash(values.password);
        }
        next();
    }
};


