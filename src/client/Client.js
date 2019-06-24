'use strict';

const util = require('../Utilities.js');

var UNIT_TIME = 100;
var LEADER_TIMEOUT_MAX = 5;

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

        /** Is this tab currently the leader */
        this.leader = false;
        /** ID of this tab */
        this.id = Math.random();
        /** IDs of all other tabs */
        this.ids = [];
        /** Is the tab in election mode currently */
        this.leaderElectionHappening = false;
        /** The channel for the leader to broadcast that it exists */
        this.leaderChannel = new BroadcastChannel('distributedstream-leader');
        /** The channel for the elections to take place, by tabs broadcasting their ids */
        this.electionChannel = new BroadcastChannel('distributedstream-election');
        /** Timeout for a leader broadcase. If 0, an election is declared */
        this.leaderTimeout = LEADER_TIMEOUT_MAX;

        // everytime a leader message is received, reset the election ids and the timeout
        this.leaderChannel.onmessage = () => {
            this.ids = [];
            this.leaderTimeout = LEADER_TIMEOUT_MAX;
        };

        // receiving an id for an election
        this.electionChannel.onmessage = ({data}) => {
            this.ids.push(data);
        };

        // loop in which leaders broadcast their existence and the rest waits on a timeout
        setInterval(() => {
            if(this.leaderElectionHappening){
                return;
            } else if(this.leader){
                this.leaderChannel.postMessage("leader");
            } else {
                if(--this.leaderTimeout){
                    this._leaderElection();
                }
            }
        }, 10*UNIT_TIME);
    }

    /**
     * Manages the process of a leader election
     */
    _leaderElection(){
        this.leaderElectionHappening = true;
        this.electionChannel.postMessage(this.id);

        // keep posting the id for the newcomers to make sure everyone has all the ids
        const interval = setInterval(()=>{this.electionChannel.postMessage(this.id)}, UNIT_TIME);

        // wait until all tabs had time to send their ids
        setTimeout(() => {
            this.leaderElectionHappening = false;

            // in case a leader was selected while waiting for the election
            if(this.leaderTimeout === LEADER_TIMEOUT_MAX) return;

            // stop spamming your id
            clearInterval(interval);

            // check if this one has the highest id
            const largest = !this.ids.find((val) => val > this.id);

            if(largest){
                this.leader = true;
                this._startWork();
            }
        }, 20*UNIT_TIME);
    }

    /**
     * Start the work by requesting from the server:
     *   * The webworker file
     *   * Start of data flow
     */
    _startWork(){
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