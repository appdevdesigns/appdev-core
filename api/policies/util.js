/**
 * Util
 * 
 * @module      :: Policy
 * @description :: Adds utility properties and methods to the `req` and 
 *                 `res` objects. For brevity and convenience.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */

var url = require('url');
var AD = require('ad-utils');

module.exports = function(req, res, next) {
    
    req.AD = req.AD || {};
    res.AD = res.AD || {};


    //// URL utils
    
    // The URL to reach this site from outside of any proxies
    var reqURL = url.parse(req.url, true);
    req.externalURL = url.format({
      protocol: req.headers['x-proxied-protocol'] || req.protocol || 'http',
      host: req.headers['x-forwarded-host'] || req.headers.host || reqURL.host,
      pathname: req.headers['x-proxied-request-uri'] || reqURL.pathname,
      query: reqURL.query
    });
    
    // The URL minus the CAS ticket
    delete reqURL.query['ticket'];
    req.externalCleanURL = url.format({
      protocol: req.headers['x-proxied-protocol'] || req.protocol || 'http',
      host: req.headers['x-forwarded-host'] || req.headers.host || reqURL.host,
      pathname: req.headers['x-proxied-request-uri'] || reqURL.pathname,
      query: reqURL.query
    });
    
    // The external URL with no path or query
    req.externalBaseURL = url.format({
      protocol: req.headers['x-proxied-protocol'] || req.protocol || 'http',
      host: req.headers['x-forwarded-host'] || req.headers.host || reqURL.host,
      pathname: '',
      query: {}
    });
    
    // Wrapper for res.redirect
    res.AD.redirect = function(url) {
        if (!req.wantsJSON && req.headers['user-agent'].match(/8[.\d]+ Safari/)) {
            // Workaround for Safari 8 cookies bug:
            // "Allow from current website only" blocks cookies from 3XX header
            // redirects. That can result in an infinite redirect loop during
            // authentication.
            // So this uses the meta refresh redirect method instead.
            res.send(
                '<html><head>'
                + '<meta http-equiv="refresh" content="0; '
                + 'url=' + url +'" />'
                + '</head></html>'
            );
        } else {
            res.redirect(url);
        }
    };
    
    // Socket
    req.AD.socketInit = function() {
        return ADCore.socket.init(req);
    };
    req.AD.socketID = function() {
        return ADCore.socket.id(req);
    };

    // User
    req.AD.user = function() {
        return ADCore.user.current(req);
    }
    
    
    //// Auth
    req.AD.isAuthenticated = function() {
        return ADCore.auth.isAuthenticated(req);
    };
    
    /**
     * Wrapper for passport-cas2 CasStrategy.getProxyTicket().
     * Only useful if user has authenticated via CAS.
     * 
     * Example usage:
     *
     *    var myURL = 'http://example.com/user/info';
     *    req.AD.getProxyTicket(myURL)
     *    .fail(function(err) { throw err; })
     *    .done(function(ticket) {
     *        request.get({ url: myURL + '?ticket=' + ticket })
     *        // ...
     *    });
     *          
     *
     * @param {string} targetURL
     * @return Deferred
     *      Resolves with the CAS ticket for the given target URL
     */
    req.AD.getProxyTicket = function(targetURL) {
        var dfd = AD.sal.Deferred();
        ADCore.auth.cas.getProxyTicket(req, targetURL, function(err, ticket) {
            if (err) {
                dfd.reject(err);
            } else {
                dfd.resolve(ticket);
            }
        });
        return dfd;
    };
    
    
    //// Comm
    res.AD.error = function(err, code) {
        return ADCore.comm.error(res, err, code);
    };
    res.AD.reauth = function() {
        return ADCore.comm.reauth(res);
    };
    res.AD.success = function(data, code) {
        return ADCore.comm.success(res, data, code);
    };
    
    

    process.nextTick(next);

};
