/**
 * Filter
 *
 * @module      :: Service
 * @description :: A common filter system for our appdev core features.
 *
 */
var AD = require('ad-utils');
var _ = require('lodash');




var path = require('path');
// var Action = require(path.join(__dirname, 'permissions', 'action.js'));
// var Route = require(path.join(__dirname, 'permissions', 'route.js'));

module.exports = {



    /**
     * @function queryBuilderToSailsFilter
     *
     * this method will take an object definition, and a QueryBuilder 
     * filter definition, and return a SailsJS compatible model condition filter.
     *
     *
     * @param {obj} object  the Sails.models[key].attributes definition of the model
     * @param {obj} filterQB  The QueryBuilder definition
     * @return {obj}  The Sails filter object.
     */
    queryBuilderToSailsFilter: function(object, filterQB) {

//// LEFT OFF:
    // recursive processing:
        // if condition  
        // if basic field
        // if linked field

        return { 1:{'=':1}};
    }


};






///// 
///// HELPER FUNCTIONS
/////


/*
 * @function getTransFields
 *
 * Find the Translation fields for a given Model.
 *
 * @param {obj} Model  A Multilingual Model Object (the Data Model)
 * @return {array}  if the translation Model was found, null otherwise
 */
// var getTransFields = function(Model) {


// }


