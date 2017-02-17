var assert = require('chai').assert;
var AD = require('ad-utils');

var request = null;
var urlService = '/site/permission/scopeobject/:id/definition';
function urlForObject(id) {
    return urlService.replace(':id', id);
}

describe('PermissionScopeObjectController tests :: ', function(){

    before(function(done){
        this.timeout(4000);

        request = AD.test.request(function(err){
            done(err);
        });

    });
    

    // only accessible by users with permission
    it('only accessible by users with permission :: ', function(ok) {
        this.timeout(16000);
        var url = urlForObject(1);
        AD.test.common.accessedOnlyWithPermission({request:request, url:url}, assert, ok);
    });


    // only get operations

    // returns proper data format
    it('returns proper data format :: ', function(ok) {
        this.timeout(8000);
        var url = urlForObject(1);
        request
            .get(url)
            .set('Accept', 'application/json')
            .expect(200)
            .end(function(err, res){

                assert.isNull(err, ' --> err should be undefined');
                assert.isDefined(res, ' --> response should be defined ');


                // response should resemble:
                var model = {
                    "status":"success",
                    "data" : {
                        "id": 1,            // the PermissionScopeObject.id
                        "name":"SiteUser",  // the current language name of the object
                        "keyModel": "siteuser",
                        "translations": {   // any translation fields
                            "name": {'type':'string'}, 
                            "language_code":{'type':'string'}
                        },

                        "attributes":{      // list of attributes:
                            // matching attributes here:
                            // field:'type',
                            // field: { collection:'model', via:'fieldName' },
                            // field: { model:'model' }
                            'keyModel': { 'type':'string' },
                            'id' : {'type':'integer'},
                            'createdAt' : { 'type': 'datetime' },
                            'updatedAt' : { 'type': 'datetime' }
                        }
                    }
                }

                assert.isDefined(res.body, ' --> expect a body in the response');
// console.log('... res.body:', res.body);
                // recursive fn to check the expected keys on our model and res.body:
                function checkKeys(keys, oModel, oRes) {
                    if (keys.length > 0) {

                        var key = keys.shift();
// if (_.isUndefined(oRes[key])) {
//     console.log('... key:', key);
//     console.log('... oModel:', oModel);
//     console.log('... oRes:', oRes);
// }
                        assert.isDefined(oRes[key], ' --> expect '+key+' field');
                        checkKeys(keys, oModel, oRes);

                        // go deep with embedded objects:
                        if (_.isObject(oModel[key])) {
                            checkKeys(_.keys(oModel[key]), oModel[key], oRes[key]);
                        }
                    }
                }

                checkKeys(_.keys(model), model, res.body);

                ok(err);
            });
    })


    // should not return special fields for SiteUser
    it('should not return special fields for SiteUser :: ', function(ok) {
        this.timeout(16000);
        var url = urlForObject(2);
        request
            .get(url)
            .set('Accept', 'application/json')
            .expect(200)
            .end(function(err, res){

                assert.isNull(err, ' --> err should be undefined');
                assert.isDefined(res, ' --> response should be defined ');

                assert.isDefined(res.body, ' --> expect a body in the response');
                assert.isDefined(res.body.data, ' --> expect data in the response');
                assert.isDefined(res.body.data.attributes, ' --> expect attributes in the response');
                assert.isUndefined(res.body.data.attributes.password, ' --> should NOT have .password');
                assert.isUndefined(res.body.data.attributes.salt, ' --> should NOT have .password');

                ok(err);
            });
    })


    // returns an error if invalid url id:
    it('returns an error if invalid url id :: ', function(ok) {
        var url = urlForObject(2000);
        request
            .get(url)
            .set('Accept', 'application/json')
            .expect(404)
            .end(function(err, res){

                assert.isNull(err, ' --> err should be undefined');

                assert.isDefined(res.body, ' --> expect a body in the response');
                assert.isDefined(res.body.data, ' --> expect data in the response');

                assert.equal(res.body.status, 'error', ' --> expect an error status');
                assert.equal(res.body.data.code, 'E_NOTFOUND', ' --> expect an E_NOTFOUND error code.');

                ok(err);
            });
    })


    // returns an error if defined model is invalid
    it('returns an error if invalid url id :: ', function(ok) {
        var url = urlForObject(3);
        request
            .get(url)
            .set('Accept', 'application/json')
            .expect(500)
            .end(function(err, res){

                assert.isNull(err, ' --> err should be undefined');

                assert.isDefined(res.body, ' --> expect a body in the response');
                assert.isDefined(res.body.data, ' --> expect data in the response');

                assert.equal(res.body.status, 'error', ' --> expect an error status');
                assert.equal(res.body.data.code, 'E_NOTFOUND', ' --> expect an E_NOTFOUND error code.');

                ok(err);
            });
    })



    // on
// UNIT TESTS:
// /site/permission/scopeobject  
//      only accessable by users with permission 
//      only get operations
//      returns proper data format
//






//// jQuery QueryBuilder  :  http://querybuilder.js.org

//// Filters: The AppDev Core will provide a Filter Processing Service.
////    it will offer generic services to convert a raw unprocessed filter (jQuery QueryBuilder format)
////    into a sails compatible condition {} for use on a model
////
//// Filter.resolve({
////    object:'objectKey',
////    condition: {QBCondition},
////    key:'uniqueFilterKey'    
////  }, [ array of other possible embedded Filter objects {object:'', condition:'', key:'' }])
////    .fail()
////    .then(function({sailsCompatibleCondition}))


//// Filters can be self contained:
    // their definitions refer to only their own properties
    // scope: 'Men'   object: person     filter: gender = 'male'


//// Filters can define linked object definitions:
    // their definitions can refer to an object they are associated with:

    // option 1: @hasOne
    // scope 'Men in BJ'  object: person  
    // filter: { gender:'male', 'location.city':'BJ' }  @hasOne location
    // step1: Location.find({city:'BJ'})
    // step2: update Filter { gender:'male', 'location':[ location.ids ] }
    // 
    // option 2: @hasMany
    // scope: 'Men with expired Passports'
    // filter: { gender:'male', 'passport.dateExpire': { '<=': today() }} @hasMany passports
    // step1: process Passport.find({dateExpire <= today()}).populate(owner)
    // update filter: { id: [ passports.owner.id ], gender:'male' }
    //
    // option 3: many2many  --> same as option 2



//// Filters can reuse other filters
    // option 1: current scope.object == otherScope.object
        // scope.name: "Men in BJ Region"
        // scope.object:  Person
        // otherScope.object: Person
        // otherScope.name: 'PeopleInBJRegion'
        // [no]: filter { gender:'male', id:[PeopleInBJRegion]}    // {scope:{id:5}},  { 'and':[ {scope:{id:1}}, {scope:{id:3}}]}
        // [yes]: filter { [PeopleInBJRegion]:{scope:{id:5}}, gender:'male' }
        // 1) process scope.id=5, returns [array otherScope.object]
        // 2) if objects are same:  { id: [otherScope.object.id]}

    // option 2: current scope.object  links to otherScope.object
    // option 3: otherScope.object links to current scope.object


//// Steps
// implement Scope UI, be able to add a basic jsQB filter and get the return values.
// use that return value to begin implmenting simple self contained Filters
// 

// url:
// /
// permissions
// Scopes.addScopeObject('name', 'key')
// Scopes.removeScopeObject('key')


    ////
    //// Sample
    ////

    // // calling without a labelDef results in an error/rejected deferred
    // it('calling without a labelDef results in an error/rejected deferred', function(ok){

    //     // wait for both checks to complete.
    //     var oD = AD.test.util.newOnDone(ok);


    //     var dfd = Multilingual.label.create(function(err, newLabel){
    //         assert.isNotNull(err, ' should have returned an error.');
    //         assert.equal(err.code, 'E_MISSINGPARAM', ' error should have code: E_MISSINGPARAM ');
    //         assert.isUndefined(newLabel, ' should not have returned a new area.'); 
    //         AD.test.util.onDone(oD);
    //     })
    //     .fail(function(err){

    //         assert.isNotNull(err, ' should have returned an error.');
    //         assert.equal(err.code, 'E_MISSINGPARAM', ' error should have code: E_MISSINGPARAM ');
    //         AD.test.util.onDone(oD);
    //     })
    //     .then(function(newLabel){
    //         assert.ok(false, 'should not have gotten here.');
    //         AD.test.util.onDone(oD);
    //     })

    //     AD.test.util.isDeferred(dfd, assert);

    // });


});


