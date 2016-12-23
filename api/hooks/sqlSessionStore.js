/**
 * Set up session store to use existing MySQL DB connection.
 * 
 * Has no effect if the default connection is not MySQL.
 *
 * mongodb and redis session stores can be set up by the user using the normal
 * sails configuration process given in config/session.js
 */


module.exports = function(sails) {
    return {
        configure: function() {
            // Abort if the session store was already set up.
            if (sails.config.session.store || (sails.config.session.adapter != 'memory')) {
                return;
            }
            
            var conn = sails.config.models.connection;
            switch (sails.config.connections[conn].adapter) {
            
                case 'sails-mysql':
                    var MySQLSessionStore = require('express-mysql-session');
                    sails.config.session.store = new MySQLSessionStore({
                        host: sails.config.connections[conn].host,
                        port: sails.config.connections[conn].port,
                        user: sails.config.connections[conn].user,
                        password: sails.config.connections[conn].password,
                        database: sails.config.connections[conn].database,
                        createDatabaseTable: true // something is conflicting with this?
                    });
                    
                    // Initialize sessions table if needed
                    sails.on('hook:orm:loaded', function() {
                        SiteUser.query(" \
                            CREATE TABLE IF NOT EXISTS `sessions` (\
                              `session_id` varchar(255) COLLATE utf8_bin NOT NULL, \
                              `expires` int(11) unsigned NOT NULL, \
                              `data` text COLLATE utf8_bin, \
                              PRIMARY KEY (`session_id`) \
                            ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin \
                        ", function(err, results) {
                            
                            // done
                            if (err) {
                                console.error('*** SiteUser.sessions : Cannot create the sessions table. You must fix this before things will work!');
                                console.error('*** returned error:', err);
                            }
                        });
                    });
                    break;
                    
                case 'sails-postgresql':
                    // Turns out PostgreSQL is not a supported option during
                    // appdev installation after all.
                    // But if it was, this should probably work, assuming the
                    // required `sessions` table is present. (see 
                    // connect-pg-simple documentation)
                    var PGSessionStore = require('connect-pg-simple');
                    sails.config.session.store = new PGSessionStore({
                        conString: 
                            'User ID=' + 
                                sails.config.connections[conn].user + ';'
                            + 'Password=' +
                                sails.config.connections[conn].password + ';'
                            + 'Host=' + 
                                sails.config.connections[conn].host + ';'
                            + 'Port=' + 
                                sails.config.connections[conn].port + ';'
                            + 'Database=' +
                                sails.config.connections[conn].database + ';'
                            + 'Connection Lifetime=0;'
                    });
                    break;
                
            }
        }
    };
};
