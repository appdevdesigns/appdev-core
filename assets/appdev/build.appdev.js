/*
 * build.appdev.js
 *
 * This file is intended to be used by the appdev build command line tool.
 *
 * This file exports the actual command() to run when trying to build this 
 * application/widget.
 *
 * Create your command() to run from the [root]/assets  directory.
 *
 */



var AD = require('ad-utils');
var path = require('path');

module.exports = {

    /* 
     * command()
     *
     * This is the actual command to execute.
     * 
     * This method is required.
     *
     * @param {obj} builder  the calling appdev build object.  
     * @param {fn} cb   The callback fn to run when command is complete.
     *                  The callback follows the usual node: cb(err) format.
     */
    command:function(builder, cb) {

        var self = this;

        // this is expected to be running the /assets directory

        // build command:  ./cjs steal/buildjs appdev -to "appdev"


        AD.log();
        AD.log('<green>building</green> appdev');
        AD.log('<green>+++++++++++++++</green>');

        AD.spawn.command({
            command:'./cjs',
            options:[path.join('steal', 'buildjs'), 'appdev', '-to', 'appdev'],
shouldEcho:true,
            // exitTrigger:'appdev/production.css'
        })
        .fail(function(err){

            AD.log.error('<red>could not complete appdev build!</red>');
            if (cb) cb(err);

        })
        .then(function(){

            AD.log();
            if (cb) cb();

        });
    }
}