/**
 * cookieAuth Passport strategy
 *
 * This authenticates a user based on a pre-arranged ticket delivered via cookie
 *
 * The ticket value is generated by a cooperating 3rd party site, and registered
 * with this site via a secure API. The ticket is linked to a specific user's
 * GUID.
 * 
 * The 3rd party site gives the user a cookie bearing that same ticket value. 
 * When the user visits this site, we recognize the cookie and log the
 * user in by matching the ticket to the user's GUID that was previously
 * registered.
 */

var cookieName = 'opsportal_ticket';

var util = require('util');
var path = require('path');
var fs = require('fs');

// Depending on how NPM was used, the passport-strategy.js dependency will be
// located in different places.
var Strategy;
var deepPath = path.join('..', '..', '..', 'node_modules', 'passport', 'node_modules', 'passport-strategy');
try {
    var fd = fs.openSync(path.join(__dirname, deepPath, 'package.json'), 'r');
    // 'passport-strategy.js' exists in the deep path 
    fs.closeSync(fd);
    Strategy = require(deepPath);
} catch (err) {
    // Use the flat path
    Strategy = require('passport-strategy');
}


function CookieStrategy(options, verify) {
  if (typeof options == 'function') {
    verify = options;
    options = undefined;
  }
  options = options || {};
    
  if (!verify) { throw new TypeError('CookieStrategy requires a verify callback'); }
  
  Strategy.call(this);
  this.name = 'cookieAuth';
  this.cookieName = cookieName;
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
}

/**
 * Inherit from `Strategy`.
 */
util.inherits(CookieStrategy, Strategy);


/**
 * Parse a raw cookie header string into a key-value basic object.
 *
 * @param string rawCookie
 * @return object
 */
CookieStrategy.prototype.parseCookies = function(rawCookie) {
    rawCookie = rawCookie || '';
    var namesAndValues = rawCookie.split(';');
    var cookies = {};
    for (var i=0; i<namesAndValues.length; i++) {
        var parsed = namesAndValues[i].trim().split('=');
        if (parsed.length == 2) {
            cookies[ parsed[0].trim() ] = parsed[1].trim();
        }
    }
    return cookies;
};


/**
 * Get the authentication ticket from the user's cookies.
 *
 * A basic object containing the user's cookies will be stored 
 * as req.AD.cookies
 *
 * @param httpRequest req
 * @return string
 */
CookieStrategy.prototype.getTicket = function(req) {
    if (!req.AD.cookies) {
        req.AD.cookies = this.parseCookies(req.headers.cookie);
    }
    return req.AD.cookies[cookieName];
};


/**
 *
 */
CookieStrategy.prototype.authenticate = function(req, options) {
    if (!req._passport) { return this.error(new Error('passport.initialize() middleware not in use')); }
    options = options || {};
    
    var self = this;
    
    // The provided `verify` callback will call this on completion
    var verified = function(err, user, info) {
        if (err) {
            self.error(err);
        } 
        else if (!user) {
            self.fail(info);
        }
        else {
            self.success(user, info);
        }
    };
    
    // Obtain authentication ticket from the cookie
    var ticket = this.getTicket(req);
    
    // Find the user that matches this ticket
    SiteCookieAuth.find({ ticket: ticket })
    .where({ expiration: { '>=': new Date() }})
    .then(function(list) {
        if (!list || !list[0]) {
            throw new Error('Ticket was invalid');
        }
        
        // Deliver the result via the `verify` callback
        var guid = list[0].guid;
        if (self._passReqToCallback) {
          self._verify(req, guid, verified);
        } else {
          self._verify(guid, verified);
        }
        
        // Delete the ticket, now that it has been consumed
        SiteCookieAuth.destroy({ ticket: ticket }, function(err) {
            // nothing else to do
        });
        
        return null;
    })
    .catch(function(err) {
        self.error(err);
        return null;
    });

}

module.exports.Strategy = CookieStrategy;

