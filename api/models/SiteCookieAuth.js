/**
 * SiteCookieAuth
 *
 * @module      :: Model
 * @description :: Database store of cookie authentication tickets
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var AD = require('ad-utils');

// This keeps track of the auto-cleanup
var timeout = null;

module.exports = {

    migrate: 'alter',
    tableName: "site_cookie_auth",
    autoCreatedAt: false,
    autoUpdatedAt: false,
    
    // autoPK:false,
    // migrate:'alter',  // don't update the tables!


    // connection:"appdev_default",


    attributes: {

        // id: {
        //     type: 'integer',
        //     primaryKey: true,
        //     autoIncrement: true
        // },
        
        guid: {
            type: 'string',
            maxLength: 36,
            unique: true
        },
        
        ticket: {
            type: 'string',
            maxLength: 80,
        },
        
        expiration: {
            type: 'datetime',
            defaultsTo: function() {
                // Tickets expire after 60 seconds
                return new Date(Date.now() + 60 * 1000);
            }
        },
        
        // This table's entries should never be transferred to the client side
        toJSON:function() {
            return {};
        },
        
        
    },
    
    
    ////////////////////////////
    // Model class methods
    ////////////////////////////


    /**
     * Deletes all tickets that are past expiration.
     */
    cleanUp: function() {
        SiteCookieAuth.destroy({ 
            expiration: {
                '<=': new Date()
            }
        }, function(err) {
            if (err) {
                sails.log(err);
            }
            timeout = null;
        });
    },
        
    
    ////////////////////////////
    // Model lifecycle callbacks
    ////////////////////////////
    
    /**
     * Clean up all old tickets 120 seconds after a new one is created
     */
    afterCreate: function(newlyInsertedRecord, next) {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(SiteCookieAuth.cleanUp, 120 * 1000);
        next();
    },
    
};


