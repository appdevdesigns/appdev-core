/**
 * SiteUserController
 *
 * @description :: Server-side logic for managing Siteusers
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


// Returns error message text if password has a problem
// or null if all clear.
var passwordCheck = function(password, password2) {
    var errMessage = null;
    
    if (!password) {
        errMessage = 'Password is required';
    }
    else if (password.length < SiteUser.minPasswordLength) {
        errMessage = 'Password must be at least ' + 
            SiteUser.minPasswordLength + ' characters';
    }
    else if (password.length == 1024) {
        // Passwords exactly 1024 chars in length will be mistakenly
        // seen as already hashed by the model.
        errMessage = 'Long passwords are good, but yours is a bit much';
    }
    else if (password != password2) {
        errMessage = 'Passwords do not match';
    }
    
    return errMessage;
}


module.exports = {

    _config: {
        model: "siteuser", // all lowercase model name
 //       actions: true,
 //       shortcuts: true,
        rest: true
    },
    
    
    // Register a new account
    register: function(req, res) {
        var username = req.param('username');
        var password = req.param('password');
        var password2 = req.param('password2');
        var isActive = 1;
        if (sails.config.appdev.localAuth.requireApproval) {
            isActive = 0;
        }
        
        async.series([
            // Preliminary validation
            function(next) {
                if (sails.config.appdev.authType != 'local') {
                    next(new Error('Can only register new accounts under local auth'));
                }
                else if (!sails.config.appdev.localAuth.canRegister) {
                    next(new Error('Account registration is not open'));
                }
                else if (!username) {
                    next(new Error('Username is required'));
                }
                else {
                    var errMessage = passwordCheck(password, password2);
                    if (errMessage) {
                        next(new Error(errMessage));
                    } else {
                        next();
                    }
                }
            },
            
            // Unique username
            function(next) {
                SiteUser.find({ username: username })
                .then(function(list) {
                    if (list.length > 0) {
                        next(new Error('That username is already taken'));
                    } else {
                        next();
                    }
                    return null;
                })
                .catch(next);
            },
            
            // Create account
            function(next) {
                SiteUser.create({
                    username: username,
                    password: password,
                    isActive: isActive
                })
                .then(function() {
                    next();
                    return null;
                })
                .catch(next);
            }
        
        ], function(err) {
            if (err && req.wantsJSON) {
                res.AD.error(err);
            } else if (err) {
                req.session.authErrMessage = err.message;
                res.AD.redirect('/site/login#signup');
            } else {
                res.view({
                    isActive: isActive
                });
            }
        });
    },
    
    
    // Deliver the current user's profile info
    selfInfo: function(req, res) {
       var info = {};
       var languages = [];
       
       async.parallel([
           // User info
           function(next) {
               SiteUser.find({
                    guid: req.user.GUID()
               })
               .then(function(list) {
                   info = {
                        username: list[0].username,
                        languageCode: list[0].languageCode,
                        email: list[0].email
                   };
                   next();
                   return null;
               })
               .catch(function(err) {
                    next(err);
               });
            },
            // Language list
            function(next) {
                SiteMultilingualLanguage.find()
                .then(function(list) {
                    languages = list;
                    next();
                    return null;
                })
                .catch(function(err) {
                    next(err);
                });
            }
        ], function(err) {
            if (err) res.AD.error(err);
            else {
                res.AD.success({
                    user: info,
                    languages: languages
                });
            }
        });
    },
    
    
    // Save changes to the current user's profile info
    selfSave: function(req, res) {
        var languageCode = req.param('language');
        var email = req.param('email');
        
        var data = {};
        if (languageCode) {
            data.languageCode = languageCode;
        }
        if (email) {
            data.email = email;
        }
        
        async.series([
            // Make sure language code is valid
            function(next) {
                if (!languageCode) next();
                else {
                    SiteMultilingualLanguage.find({
                        language_code: languageCode
                    })
                    .then(function(list) {
                        if (list.length > 0) {
                            next();
                        } else {
                            next(new Error('Language [' + languageCode + '] not supported'));
                        }
                        return null;
                    })
                    .catch(next);
                }
            },
            
            function(next) {
                SiteUser.update({
                    guid: req.user.GUID()
                }, data)
                .then(function() {
                    next();
                    return null;
                })
                .catch(next);
            }
        
        ], function(err) {
            if (err) res.AD.error(err);
            else {
                res.AD.success({});
            }
        });
        
    },
    
    
    // Change the current user's password
    changePW: function(req, res) {
        var password = req.param('password');
        var password2 = req.param('password2');
        var errMessage = passwordCheck(password, password2);
        
        // TODO: require old password to be given?
        
        if (errMessage) {
            res.AD.error(new Error(errMessage));
        } else {
            SiteUser.update({
                guid: req.user.GUID()
            }, {
                password: password
            })
            .then(function() {
                res.AD.success({});
                return null;
            })
            .catch(function(err) {
                res.AD.error(err);
                return null;
            });
        }
    },
    
    
    // POST /appdev-core/authTicket
    registerAuthTicket: function(req, res) {
        var guid = req.param('guid');
        var ticket = req.param('ticket');
        
        async.series([
            function(next) {
                SiteCookieAuth.destroy({ 
                    or: [
                        { guid: guid },
                        { ticket: ticket }
                    ]
                })
                .then(function() {
                    next();
                    return null;
                })
                .catch(function(err) {
                    next(err);
                    return null;
                });
            },
            
            function(next) {
                SiteCookieAuth.create({
                    guid: guid,
                    ticket: ticket
                })
                .then(function() {
                    next();
                    return null;
                })
                .catch(function(err) {
                    next(err);
                    return null;
                });
            },
            
        ], function(err) {
            if (err) {
                res.AD.error(err);
            } else {
                res.AD.success({});
            }
        });
    }
    
};

