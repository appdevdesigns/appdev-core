var path = require('path');
var AD = require('ad-utils');

var Barrels = require('barrels');

var sails,
    cwd;

//
// Global Before() and After() routines to setup sails for all our tests:
//


before(function(done) {

  // Increase the Mocha timeout so that Sails has enough time to lift.
  this.timeout(120000);


  // sails should lift from directory above:
  cwd = process.cwd();
  process.chdir(path.join('..','..'));


  AD.test.sails.lift({
    models:{
      connection:'test',
      migrate:'drop'
    }
  })
  .fail(function(err){
      done(err);
  })
  .then(function(server) {

    sails = server;

      // Load fixtures
      var barrels = new Barrels(path.join(__dirname, 'fixtures'));

      // Populate the DB with the fixture data
      barrels.populate(function(err){
        ADCore.queue.publish(AD.test.events.TEST_BARRELS_POPULATED, {});
        done(err);
      })
        
  });
});

after(function(done) {

  //
  // here you can clear fixtures, etc.
  // 

  sails.lower(function() {
     process.chdir(cwd);
     done();
  });
});
