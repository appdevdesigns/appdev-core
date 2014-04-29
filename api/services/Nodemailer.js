var nodeMailer = require('nodemailer');
var path = require('path');

var AD = require('ad-utils');

// keep a list of the instantiated transports.
var transports = {};


module.exports= {


    send:function(transportKey, email) {
        // format 1:  send('smtp', { to:'', from:'', ... });
        // format 2:  send({to:'', from:'', ... });

        var dfd = AD.sal.Deferred();


        // verify params properly set
        if (typeof transportKey == 'object') {
            email = transportKey;
            transportKey = sails.config.nodemailer['default'];
        }


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




