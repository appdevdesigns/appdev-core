/**
 * Filter
 *
 * @module      :: Service
 * @description :: A common filter system for our appdev core features.
 *
 */
var AD = require('ad-utils');
var _ = require('lodash');
var moment = require('moment');

var EXPECTED_DATE_FORMAT = 'MM/DD/YYYY';


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
    queryBuilderToSailsFilter: function(object, filterQB, cb) {

        var filter = {};

        // if the top element is a condition statement:
        if (filterQB.condition) {

            // find all the embedded rules
            var rules = [];


            switch (filterQB.condition.toLowerCase())
            {
                case 'and':
                    filter.and = rules;
                    break;

                case 'or':
                    filter.or = rules;
                    break;
            }

            var numDone = 0;
            filterQB.rules.forEach(function(r){

                Filter.queryBuilderToSailsFilter(object, r, function(err, f){

                    if (err) {
                        cb(err);
                    } else {

                        rules.push(f);
                        numDone++;
                        if (numDone >= filterQB.rules.length) {

//// TODO: test out our waterline-sequel patch and see if
//// { and:[] } filter now works:

//// NOTE: there is a PR waiting to be accepted that will support
//// { and:[] } conditions in waterline-sequel
//// https://github.com/balderdashy/waterline-sequel/pull/68
//// when that is supported, then we don't need our own fork.


                            // // reduce the .and filter here:
                            // if (filter.and) {

                            //     var newFilter = {};
                            //     filter.and.forEach(function(r){
                            //         _.assign(newFilter, r);
                            //     })
                            //     filter = newFilter;
                            // }

                            cb(null, filter);
                        }
                    }

                });
            })


        } else {

            // if basic field condition
            // a basic field condition is a field on the current
            // object definition with a direct condition.
            var field = filterQB.field;
            if (object[field]) {

                // check if object[field] references a collection or model
                // which really shouldn't happen.  Should prevent this on the client!

                filter = convertQBConditionToSails(field, filterQB.operator, filterQB.value);
                cb(null, filter);

            } else {


                // check if field is a . field representation. eg: passport.expirationDate
                // if so:  
                    // find external model: object[passport].model or object[passport].collection
                    // reduce field to remove outer layer of referece: passport.expirationDate -> expirationDate
                    // reduce current QBfilter to a sails filter. eg: {expirationDate:{ '>': DATE }}
                    // run filter on current model. eg: Passport.find({expirationDate:....})
                    // reduce to passport:[ passport.id, ... ]

// TODO: recursively reduce 
cb(null,{1:1});

            }
        }

    }


};






///// 
///// HELPER FUNCTIONS
/////


/*
 * @function convertQBCondition
 *
 * return the proper sails query modifier for the given condition & value;
 *
 * @param {string} field  the QB field this is applied to. eg. 'name'
 * @param {string} condition  the QB condition string.  eg 'not_contains'
 * @param {string} value  the QB value for this condition. eg. 'neo'
 * @return {obj}   eg. { name: {'!':{contains:'neo'}}}
 */
var convertQBConditionToSails = function(field, condition, value) {

    var filter = {};

function unsupported(){
    console.log('!!!! UNSUPPORTED SAILS CONDITION!: ',field, condition, value );
}


    function trimValues(values) {
        var trimmedValues = [];
        values.forEach(function(v){
            if (v.trim) {
                trimmedValues.push(v.trim());
            } else {
                trimmedValues.push(v);
            }
        })
        return trimmedValues;
    }


    function convertToDate(values) {

        function _convertIt(value) {
            if (moment(value, EXPECTED_DATE_FORMAT, true).isValid()) {
                value = new Date(value);
            }
            return value;
        }

        if (_.isArray(values)) {
            var nValues = [];
            values.forEach(function(v){
                nValues.push(_convertIt(v));
            })
            return nValues;
        } else {
            return convertIt(values);
        }
    }


    switch(condition.toLowerCase()) {

        case 'equal' :
            filter[field] = value;
            break;

        case 'not_equal' :
            filter[field] = { '!': value };
            break;

        case 'in' :
            // {"id":"guid","field":"guid","type":"string","input":"text","operator":"in","value":"Neo, Morpheous, Trinity"}],"valid":"true"}
            values = value.split(',');
            filter[field] = trimValues(values);
            break;

        case 'not_in':
            values = value.split(',');
            filter[field] = { '!' : trimValues(values) };
            break;

        case 'less':
            filter[field] = { '<': value };
            break;

        case 'less_or_equal':
            filter[field] = { '<=': value };
            break;

        case 'greater':
            filter[field] = { '>': value };
            break;

        case 'greater_or_equal':
            filter[field] = { '>=': value };
            break;

        case 'between':
            // {"id":"lastLogin","field":"lastLogin","type":"datetime","input":"text","operator":"between","value":["02/01/1970","03/01/2016"]}
            // { date: { '>': new Date('2/4/2014'), '<': new Date('2/7/2014') } }
            value = convertToDate(value);
            filter[field] = { '>': value[0], '<': value[1]}
            break;

        case 'not_between':
            // {"id":"lastLogin","field":"lastLogin","type":"datetime","input":"text","operator":"between","value":["02/01/1970","03/01/2016"]}
            // { date: { '>': new Date('2/4/2014'), '<': new Date('2/7/2014') } }
            
            value = convertToDate(value);
            
/// this didn't seem to work:
            // filter[field] = { '!': { '>': new Date(value[0]), '<': new Date(value[1])}};

            // so lets try  boolean logic:  { '<=', new Date(value[0]) OR  '>=': new Date(value[1])};
            var lowerDate = {};
            lowerDate[field] = { '<=': value[0] };

            var upperDate = {};
            upperDate[field] = { '>=': value[1] };


            filter['or'] = [lowerDate, upperDate];
            break;

        case 'begins_with':
            filter[field] = { startsWith: value };
            break;

        case 'not_begins_with':
unsupported();
            filter[field] = { '!': { startsWith: value }};
            break;

        case 'contains':
            filter[field] = { contains: value };
            break;

        case 'not_contains':
unsupported();
            filter[field] = { '!': { contains: value }};
            break;

        case 'ends_with':
            filter[field] = { endsWith: value };
            break;

        case 'not_ends_with':
unsupported();
            filter[field] = { '!': { endsWith: value }};
            break;

        case 'is_empty':
// QUESTION: does is_empty mean '' ?

            // {"id":"guid","field":"guid","type":"string","input":"text","operator":"is_empty","value":""},
            filter[field] = "";
            break;

        case 'is_not_empty':
            filter[field] = { '!': "" };
            break;

        case 'is_null':

            // {"id":"guid","field":"guid","type":"string","input":"text","operator":"is_not_null","value":""}
            filter[field] = null;
            break;

        case 'is_not_null':
            filter[field] = { '!': null };
            break;

    }


    return filter;

}


