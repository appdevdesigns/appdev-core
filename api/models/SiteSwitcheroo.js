/**
 * SiteSwitcheroo
 *
 * @module      :: Model
 * @description :: Track any current Switcheroo requests
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var crypto = require('crypto');
var AD = require('ad-utils');
var _  = require('lodash');

module.exports = {

    tableName:"site_switcheroo",
    // autoCreatedAt:true,
    // autoUpdatedAt:true,
    // autoPK:false,
    migrate:'alter',  // don't update the tables!


    // connection:"appdev_default",


    attributes: {

        // id: {
        //     type: 'integer',
        //     primaryKey: true,
        //     autoIncrement: true
        // },
        
        
        
        username: {
            type: 'string',
            maxLength: 36,
            unique: true,
            required: true
        },
        
        toUsername: {
            type: 'string',
            maxLength: 36,
            required: true
        },


        toGuid: {
            type: 'string',
            maxLength: 36,
        },
        
        
        //// Instance model methods


    },
    
    
    ////////////////////////////
    // Model class properties
    ////////////////////////////


    
    ////////////////////////////
    // Model class methods
    ////////////////////////////

    

};


