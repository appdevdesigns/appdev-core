var nodeMailer = require('nodemailer');
var path = require('path');
var fs = require('fs');

var AD = require('ad-utils');

// keep a list of the instantiated transports.
var transports = {};

var outputPath = 'email_output';

// Accept the same arguments as the normal send() method, but don't actually
// send out any email. Instead write the output to html files in the filesystem
// for inspection.
var dryRun = function(transportKey, email) {
    var dfd = AD.sal.Deferred();
    
    AD.log('Email dry run: ' + email.subject);
    
    var outputHTML = email.html.replace(/^(\s*<body>)?/, '$1<div><ul>'
        + '<li><b>From:</b> ' + email.from + '</li>'
        + '<li><b>To:</b> ' + email.to + '</li>'
        + '<li><b>Cc:</b> ' + email.cc + '</li>'
        + '<li><b>Bcc:</b> ' + email.bcc + '</li>'
        + '<li><b>Subject:</b> ' + email.subject + '</li>'
        + '</ul></div>');
    
    var outputFileName = 'Email-' + email.subject.replace(/\W/g, '') + '.html';

    async.series([
        // Make sure output path exists
        function(next){
            fs.exists(outputPath, function(exists){
                if (!exists) {
                    fs.mkdir(outputPath, function(){
                        next();
                    });
                } else {
                    next();
                }
            });
        },
        
        // Find a filename that is not yet being used
        function(next){
            fs.readdir(outputPath, function(err, files){
                if (err) next(err);
                var counter = 1;
                var nameCheck = outputFileName;
                while (files.indexOf(nameCheck) >= 0) {
                    nameCheck = nameCheck.replace(/(\-\d+)?\.html$/, '-' + counter + '.html');
                    counter += 1;
                }
                outputFileName = nameCheck;
                next();
            });
        },
        
        // Write email to the file
        function(next){
            var path = outputPath + '/' + outputFileName;
            var attempts = 0;
            var saveIt = function() {
                fs.writeFile(path, outputHTML, function(err){
                    if (err) {
                        if (err.errno == 20 && (attempts < 15)) {
                            // Too many files currently open. So wait a bit 
                            // and try again.
                            attempts += 1;
                            setTimeout(saveIt, parseInt(Math.random() * 1000));
                        } else {
                            // Some other error. Fail and report.
                            next(err);
                        }
                    } else {
                        next();
                    }
                });
            }
            saveIt();
        }
    
    ], function(err){
        if (err) {
            AD.log(err);
            dfd.reject(err);
        }
        else {
            dfd.resolve('Email dry run successful: ' + outputPath + '/' + outputFileName);
        }
    });
    
    return dfd;
}


module.exports= {


    send:function(transportKey, email) {
        // format 1:  send('smtp', { to:'', from:'', ... });
        // format 2:  send({to:'', from:'', ... });
        
        // verify params properly set
        if (typeof transportKey == 'object') {
            email = transportKey;
            transportKey = sails.config.nodemailer['default'];
        }

        // If the site has been configured for test mode then perform a dry run
        // instead.
        if (sails.config.nodemailer.dryRun) {
            return dryRun(transportKey, email);
        }
        

        var dfd = AD.sal.Deferred();

        // make sure transport is defined
        if (!sails.config.nodemailer[transportKey]) {

            var msg = ' Error: unknown nodemailer transport['+transportKey+']';
            AD.log.error(msg);
            AD.log('<yellow><bold>nodemailer:</bold>  ---> be sure to define it in <bold>config/nodemailer.js</bold></yellow>');
            var err = new Error(msg);
            dfd.reject(err);

        } else {


            // make sure an instance of transport is created
            if (!transports[transportKey]) {
                var opts = sails.config.nodemailer[transportKey];
                opts.type = opts.type || "SMTP";
                transports[transportKey] = nodeMailer.createTransport(opts.type, opts);
            }


            // use the specified transport
            var transport = transports[transportKey];


            // send the mail
            transport.sendMail(email, function(err, responseStatus) {
               if (err) {
                   dfd.reject(err);
               } else {
                   dfd.resolve(responseStatus);
               }
            });

        }

        return dfd;
    },


};




