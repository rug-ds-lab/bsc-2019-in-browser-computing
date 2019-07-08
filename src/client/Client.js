'use strict';

const util = require('../Utilities.js');

var UNIT_TIME = 50;
var TIMEOUT = 3;

class Client {
    /**
     * Initialize a client
     * @param {Object} options Consists of the options
     * @param {Boolean} [options.debug=false] Debug mode
     * @param {Number} [options.reconnectInterval=5000] The time (in ms) to wait before trying to reconnect to the server.
     * @param {String} options.workFile
     * @param {Boolean} [options.enableMultiTabs=false] Whether the code should work on multiple tabs if the user
     */
    constructor({socket, debug, reconnectInterval, workFile, enableMultiTabs}) {
        if(!socket) util.error("Socket has to be provided.");
        this.socket = socket.close();

        if(!workFile) util.error("The work file has to be provided.");
        this.workFile = workFile;

        this._configureSocket();

        this.debug = debug || false; 
        this.reconnectInterval = reconnectInterval || 5000;
        this.enableMultiTabs = !!enableMultiTabs;

        // leader election protocol is needless if multiple tabs can work simultenously
        if(this.enableMultiTabs){
            return this._startWork();
        }

        /** ID of this tab */
        this.id = Math.random();
        /** The channel for the leader and the worker to broadcast that it exists */
        this.timeoutChannel = new BroadcastChannel('distributedstream-timeout');
        /** The channel for the candidates to broadcast their ids */
        this.candidateChannel = new BroadcastChannel('distributedstream-election');
        
        /** Timeout for a leader broadcast. If 0, the candidate becomes the leader */
        this.leaderTimeout = TIMEOUT;
        /** Timeout for a worker broadcast. If 0, the leader starts working */
        this.workerTimeout = TIMEOUT;

        // everytime a broadcast is received -> reset the appropriate timeout
        this.timeoutChannel.onmessage = ({data}) => {
            if(data === "leader"){
                this.leaderTimeout = TIMEOUT;
            } else if(data === "worker"){
                this.workerTimeout = TIMEOUT;
            }
        };

        // everytime an id is broadcasted
        this.candidateChannel.onmessage = ({data}) => {
            switch(this.status){
                case "leader":
                case "candidate":
                    if(data > this.id){
                        this._becomeDefeated();
                    } else {
                        this.candidateChannel.postMessage(this.id);
                    }
                    break;
                case "defeated":
                    if(data < this.id){
                        this._becomeCandidate();
                    }
                    break;
            }
        };

        this._becomeCandidate();

        // loop for timeouts and broadcasting against timeouts
        setInterval(() => {
            switch(this.status){
                case "worker":
                    this.timeoutChannel.postMessage(this.status);
                    break;
                case "leader":
                    if(--this.workerTimeout === 0){
                        this._startWork();
                    }
                    this.timeoutChannel.postMessage(this.status);
                    break;
                case "candidate":
                    if(--this.leaderTimeout === 0){
                        this._becomeLeader();
                    }
                    break;
                case "defeated":
                    if(--this.leaderTimeout === 0){
                        this._becomeCandidate();
                    }
            }
        }, 10*UNIT_TIME);
    }

    _becomeLeader(){
        console.log("BECAME LEADER");
        this.status = "leader";
    }

    _becomeCandidate(){
        this.status = "candidate";
        this.leaderTimeout = TIMEOUT;
        this.candidateChannel.postMessage(this.id);
    }

    _becomeDefeated(){
        this.status = "defeated";
    }

    /**
     * Start the work by requesting from the server:
     *   * The webworker file
     *   * Start of data flow
     */
    _startWork(){
        this.status = "worker";
        this.worker = new Worker(this.workFile);
        this.socket.open();
        util.debug(this.debug, "Socket opened");
    }

    /**
     * Configure the socket callbacks
     */
    _configureSocket(){
        this.socket.on('connect', () => {
            util.debug(this.debug, "Connected to the host");
        });
        
        this.socket.on('initial-data-distributedstream', (data) => {
            util.debug(this.debug, "Received initial data");
            this.worker.postMessage({initialData:data});
        });

        // Run the work function whenever data is received
        this.socket.on('data-distributedstream', (data, callback) => {
            util.debug(this.debug, "Received data from the host");

            this.worker.postMessage(data);
            this.worker.onmessage = (results) => {
                util.debug(this.debug, "Sent result to the host");
                return callback(results.data);
            };
        });
    }
}

module.exports = Client;