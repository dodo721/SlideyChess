const hash = require('object-hash');

const clients = {};

class Client {
    
    constructor (socket) {
        this.id = hash(Date.now());
        while(clients[this.id])
            this.id = hash(Date.now());
        clients[this.id] = this;
        this.socket = socket;
        this.roomCode = null;
    }

    disconnect () {
        delete clients[this.id];
    }

}

module.exports = { Client, clients };
