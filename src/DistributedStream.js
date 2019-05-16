'use strict';

const util = require('./Utilities.js'),
    ClientManager = require('./server/ClientManager.js'),
    Server = require('./server/Server.js'),
    DataHandler = require('./DataHandler.js'),
    Data = require('./Data.js'),
    stream = require('stream');

class DistributedStream extends stream.Duplex {

    /**
     * Initialize the stream
     * @param {Object} [opt={}] Options
     * @param {Boolean} [opt.debug=false] Debug mode
     * @param {Number} [opt.highWaterMark=100] Maximum number of data batches to put into the stream at once
     * @param {Number} [opt.redundancy=1] Redundancy factor used for the voting algorithm. Defaults to no redundancy
     * @param {Function} [opt.equalityFunction] The function used to compare if two results are the same
     * @param {http.Server} [httpServer] The http server instance to use. If not given, a new express server will listen
     *        at the given opt.port
     * @param {Number} [opt.port=3000] Effective only if no opt.httpServer is passed.
     * @param {Object} [opt.distribution] The type of load distribution requested;
     * @param {String} [opt.distribution.type="adaptive"] The type of load distribution server should provide.
     *        Can be `adaptive` (default), `single` or `chunk`
     * @param {Number} [opt.distribution.size=100] Chunk sizes for the load distribution if chunk was selected as type
     */
    constructor({debug=false, port, highWaterMark=100, redundancy=1, equalityFunction, httpServer, distribution}={}) {
        super({objectMode: true, highWaterMark: highWaterMark});

        this.debug = debug;

        this.backPressure = true; // don't start sending jobs until _read is called
        /** count of data pieces written to the stream */
        this.writtenCount = 0;

        this.clientManager = new ClientManager()
            .on("available-client", this._sendJob.bind(this));
        this.dataHandler = new DataHandler({equalityFunction, redundancy})
            .on("processed", this._putIntoStream.bind(this));
        this.server = new Server({httpServer, port, clientManager:this.clientManager, dataHandler: this.dataHandler})
            .on("disconnect", this.dataHandler.removeVote.bind(this.dataHandler))
            .on("result", this.dataHandler.handleResult.bind(this.dataHandler));
        // this.loadBalancer = new loadBalancer({}, distribution, []);
    }

    /**
     * Called by the stream implementation to indicate this stream should start/resume 
     * producing and pushing data.
     */
    _read(){
        this.backPressure = false;
        this.emit("resume");
    }

    /**
     * Called by the stream implementation when new data is written into this stream.
     */
    _write(data, _encoding, callback){
        this.dataHandler.addData(data);
        callback();
    }

    /**
     * Called by the stream implementation when data writing into this stream is finished.
     * @param {Function} callback 
     */
    _final(callback){
        this.dataHandler.endOfData();
        callback();
    }

    // when called, coordinates the sending of a new batch
    _sendJob(client){
        if(this.dataHandler.isProcessingFinished()){
            return;
        }

        // wait if there is backpressure
        if(this.backPressure){
            return this.once("resume", this._sendJob.bind(this, client));
        }

        const count = 100; //this.loadBalancer.getDistributionTask(client); //TODO: Make this work

        this.dataHandler.getData(client, count, (_err, data) => {
            this.clientManager.setClientOccupied(client);
            this.server.sendData(client, data);
        });
    }

    /**
     * If there is processed data that can be written to the stream, writes the majority result
     * to the stream and deletes the data from the buffer.
     *
     * All data should be written to the stream in the order it was read, so a data group
     * can be written only if the data group read one before was written into stream already.
     */
    _putIntoStream(){
        let processedData;
        while(!this.backPressure && (processedData = this.dataHandler.popProcessed(this.writtenCount)) !== undefined){
            if(processedData){ // can be null to imply the end of results
                processedData = processedData.getMajorityResult();
            }

            // this.push returning false implied backpressure
            this.backPressure = !this.push(processedData);
            this.writtenCount++;
        }
    }
}

module.exports = DistributedStream;