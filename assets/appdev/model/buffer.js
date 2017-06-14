/**
 * @class Buffer
 * 
 * This is a buffer for model findAll() requests that use a specific type of
 * condition:
 *
 * { or: [
 *     id: 123,
 *     id: 124,
 *     id: 125,
 *     ...
 * ]}
 *
 * Multiple requests will be aggregated together to remove redundant IDs and 
 * reduce overhead. This was motivated by some client side components making 
 * hundreds of these requests at the same time.
 *
 * Each model should have its own separate buffer instance.
 *
 * Usage:
 *      var buffer = new Buffer('get', '/fooApp/barModel', 'service');
 *      if (buffer.isCompatible(cond)) {
 *          buffer.add(cond, dfd);
 *      }
 */
steal(function() {
        
    /**
     * Constructor
     *
     * @param {string} verb
     *      HTTP verb used for the server request
     * @param {string} uri
     *      URI for the model's findAll route
     * @param {string} comm
     *      Either 'service' or 'socket'. See appdev/model/model.js.
     */
    var Buffer = function(verb, uri, comm) {
        // Number of ms to wait for more requests.
        this.period = 250;
        
        // Maximum number of OR items in a condition. Sails can't handle more
        // than 20.
        this.maxOR = 20;
        
        this.verb = verb;
        this.uri = uri;
        this.comm = comm;
        
        this.iteration = 0;
        this.flush();
    }
    
    
    /**
     * Can this condition be buffered?
     *
     * @param {object} cond
     * @return {boolean}
     */
    Buffer.prototype.isCompatible = function(cond) {
        // `cond` must be an object
        if (!cond) return false;
        if (typeof cond != 'object') return false;
        
        // `cond` == { or: [] }
        var condParts = Object.keys(cond);
        if (condParts.length != 1) return false;
        if (condParts[0] != 'or') return false;
        if (!Array.isArray(cond.or)) return false;
        
        // each `or` array item must be an object { id: "..." }
        for (var i=0; i<cond.or.length; i++) {
            if (typeof cond.or[i] != 'object') return false;
            var orParts = Object.keys(cond.or[i]);
            if (orParts.length != 1) return false;
            if (orParts[0] != 'id') return false;
        }
        
        return true;
    }
    
    
    /**
     * Allow previous set of buffered requests to finish. Start buffering
     * a new set.
     */
    Buffer.prototype.flush = function() {
        this.allIDs = [];
        this.timeout = null;
        this.queue = [];
        this.iteration += 1;
    }
    
    
    /**
     * Add a new findAll request to the buffer. The request will be held
     * for a short time before being executed. If more requests are added
     * to the buffer within that time, they will be aggregated together.
     *
     * @param {object} cond
     *      A model findAll request object that passes the isCompatible()
     *      test.
     * @param {Deferred} [dfd]
     * @param {function} [cbSuccess]
     * @param {function} [cbErr]
     *
     */
    Buffer.prototype.add = function(cond, dfd, cbSuccess, cbErr) {
        var thisIDs = [];
        var self = this;
        
        cond.or.forEach(function(item) {
            // Add IDs from this request
            thisIDs.push(item.id);
            // Add unique IDs to `allIDs`
            if (self.allIDs.indexOf(item.id) < 0) {
                self.allIDs.push(item.id);
            }
        });
        
        // Sails blueprints can't process more than 20 items in an OR condition
        if (this.allIDs.length > this.maxOR) {
            this.flush();
            this.allIDs = thisIDs.concat();
        }
        
        // Cancel the previously unflushed queued timeout so we can add on
        // this new request.
        this.timeout && clearTimeout(this.timeout);
        
        // Construct a new condition with all the buffered IDs
        var newCond = { or: [] };
        this.allIDs.forEach(function(id) {
            newCond.or.push({ 'id': id });
        });
        
        this.queue.push({
            IDs: thisIDs,
            dfd: dfd,
            cbSuccess: cbSuccess,
            cbErr: cbErr
        });
        
        // Clone & preserve variables for use in the function below.
        var allIDs = this.allIDs.concat();
        var queue = this.queue.concat();
        var iteration = this.iteration;
        
        // Create a new timeout that makes the actual server request.
        // It will execute if no further requests are added within the wait
        // period.
        this.timeout = setTimeout(function() {
            // Wait period is over. Begin actual request. No turning back.
            
            // Flush the buffer if needed
            if (iteration == self.iteration) {
                self.flush();
            }
            
            AD.comm[self.comm][self.verb]({ url: self.uri, params: newCond })
                .fail(function (err) {
                    queue.forEach(function(item) {
                        if (item.cbErr) item.cbErr(err);
                        if (item.dfd) item.dfd.reject(err);
                    });
                })
                .done(function (data) {
                    data = data.data || data;
                    if (!Array.isArray(data)) {
                        data = [data];
                    }
                    
                    // Index the returned data by ID
                    var dataByID = {};
                    data.forEach(function(item) {
                        var id = item.id;
                        dataByID[id] = item;
                    });
                    
                    // Resolve the queued requests
                    queue.forEach(function(item) {
                        var results = [];
                        item.IDs.forEach(function(id) {
                            if (dataByID[id]) {
                                results.push(dataByID[id]);
                            } else {
                                //console.log('Warning: ID ' + id + ' was requested in findAll but not returned');
                            }
                        });
                        
                        var finalResult = { data: results };
                        if (item.cbSuccess) item.cbSuccess(finalResult);
                        if (item.dfd) item.dfd.resolve(finalResult);
                    });
                });
                
        }, this.period);
    }
    
    
    return Buffer;
});
