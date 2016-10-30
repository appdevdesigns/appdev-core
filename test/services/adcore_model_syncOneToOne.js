var assert = require('chai').assert;
var AD = require('ad-utils');
var async = require('async');


var role;
var user;

var oldLangDefault = 'xx';



describe('ADCore.model.syncOneToOne tests', function(){

    function onDone(o, ntd) {
        ntd = ntd || 2;

        if (o.err) {
            o.ok(o.err);
        } else {
            o.numDone++;
            if (o.numDone == ntd) {
                o.ok();
            }
        }
    }

    function isDeferred(dfd) {

        assert.isDefined(dfd, ' should be defined ');
        assert.property(dfd, 'fail', ' should look like a deferred. .fail() ');
        assert.property(dfd, 'then', ' should look like a deferred. .then() ');

    }

    var validOptions = {
        Model:{},
        fields:[],
        records:[]
    }


    before(function(done){

      done();
    
    });
    


    ////
    //// Checking for proper Function Usage:
    ////

    it('calling without any options results in an error :', function(ok){

        // wait for both checks to complete.
        var oD = { numDone:0, ok:ok };

        var dfd = ADCore.model.syncOneToOne.afterCreate(function(err){
            assert.isNotNull(err, ' should have returned an error.');
            assert.equal(err.code, 'E_MISSINGPARAM', ' error should have code: E_MISSINGPARAM ');
            onDone(oD);
        })
        .fail(function(err){

            assert.isNotNull(err, ' should have returned an error.');
            assert.equal(err.code, 'E_MISSINGPARAM', ' error should have code: E_MISSINGPARAM ');
            onDone(oD);
        })
        .then(function(newLabel){
            assert.ok(false, 'should not have gotten here.');
            onDone(oD);
        });

        isDeferred(dfd);

    }); 



    it('calling without required option values results in an error :', function(ok){

        // wait for both checks to complete.
        var oD = { numDone:0, ok:ok };

        var fields = ['Model', 'fields', 'records'];
        var numToDo = fields.length * 2;

        function testField(field) {

            var tOpt = _.clone(validOptions);
            delete tOpt[field];


            var dfd = ADCore.model.syncOneToOne.afterCreate(tOpt, function(err){
                assert.isDefined(err, ' should have returned an error.');
                assert.isNotNull(err, ' should have returned an error.');
                assert.equal(err.code, 'E_INVALIDPARAMS', ' error should have code: E_INVALIDPARAMS ');
                onDone(oD, numToDo);
            })
            .fail(function(err){
                assert.isDefined(err, ' should have returned an error.');
                assert.isNotNull(err, ' should have returned an error.');
                assert.equal(err.code, 'E_INVALIDPARAMS', ' error should have code: E_INVALIDPARAMS ');
                onDone(oD, numToDo);
            })
            .then(function(newLabel){
                assert.ok(false, 'should not have gotten here.');
                onDone(oD, numToDo);
            });

            isDeferred(dfd);
        }

        fields.forEach(testField);

    });



    it('calling afterCreate enforces remote connection back to original object :', function(ok){

        // wait for both checks to complete.
        var oD = { numDone:0, ok:ok };


        // var dfd = ADCore.model.syncOneToOne.afterCreate({

        // }, function(err){
        //     assert.isDefined(err, ' should have returned an error.');
        //     assert.isNotNull(err, ' should have returned an error.');
        //     assert.equal(err.code, 'E_INVALIDPARAMS', ' error should have code: E_INVALIDPARAMS ');
        //     onDone(oD, numToDo);
        // })
        // .fail(function(err){
        //     assert.isDefined(err, ' should have returned an error.');
        //     assert.isNotNull(err, ' should have returned an error.');
        //     assert.equal(err.code, 'E_INVALIDPARAMS', ' error should have code: E_INVALIDPARAMS ');
        //     onDone(oD, numToDo);
        // })
        // .then(function(newLabel){
        //     assert.ok(false, 'should not have gotten here.');
        //     onDone(oD, numToDo);
        // });

        // isDeferred(dfd);


//// left off here:
// strategy: stuff a mock model into sails.models[]
// define model to connect to an existing model.field
// call afterCreate and check if remote model.field is updated with this value


    });


    




    after(function(ok){
        
        ok();
        
    });

});


