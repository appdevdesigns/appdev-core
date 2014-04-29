/**
 * Global adapter nodemailer
 *
 * The `nodemailer` configuration object lets you create different global "saved settings"
 * that you can use for sending emails.
 *
 */

module.exports.nodemailer = {

    // If you try sending an email without specifying the transport
    // this is the one that will be used.
    'default': 'smtp',


    // Setup a default smtp connection:
    smtp: {

        type:'SMTP',          // [ 'SMTP', 'SES' (Amazon SES), 'Sendmail' ]

//      service: 'gmail',     // use a well known service identifier

        // if you don't use a service, you need to specify host & port:
        host: "SMTP.HOST.ADDR",                   // hostname
        secureConnection: false,                  // true:  use SSL
        port: 25,                                 // 465: port for secure SMTP

        // NOTE: better to use config/local.js to override this info:
//        auth: {
//            user: "SMTP.USER.ACCOUNT",
//            pass: "SMTP.USER.PWORD"
//        }
//      debug:false,
//      maxConnections:5
    }
};