const { json } = require('express');
const { clients } = require('./Client');

const rooms = {};

class Room {

    constructor (roomCode, creatorId) {
        this.code = roomCode;
        if (rooms[roomCode]) {
            throw new Error("Room " + roomCode + " already exists, cannot create!");
        }
        rooms[roomCode] = this;
        this.playerWhite = creatorId;
        this.playerBlack = null;
        this.turn = "white";
        this.chessData = {
            // White key pieces
            "R1w":[0,500-62.5],
            "N1w":[62.5,500-62.5],
            "B1w":[125,500-62.5],
            "Q1w":[187.5,500-62.5],
            "K1w":[250,500-62.5],
            "B2w":[312.5,500-62.5],
            "N2w":[375,500-62.5],
            "R2w":[437.5,500-62.5],
            // White pawns
            "P1w":[0,500-125],
            "P2w":[62.5,500-125],
            "P3w":[125,500-125],
            "P4w":[187.5,500-125],
            "P5w":[250,500-125],
            "P6w":[312.5,500-125],
            "P7w":[375,500-125],
            "P8w":[437.5,500-125],

            // Black key pieces
            "R1b":[0,0],
            "N1b":[62.5,0],
            "B1b":[125,0],
            "Q1b":[187.5,0],
            "K1b":[250,0],
            "B2b":[312.5,0],
            "N2b":[375,0],
            "R2b":[437.5,0],
            // Black pawns
            "P1b":[0,62.5],
            "P2b":[62.5,62.5],
            "P3b":[125,62.5],
            "P4b":[187.5,62.5],
            "P5b":[250,62.5],
            "P6b":[312.5,62.5],
            "P7b":[375,62.5],
            "P8b":[437.5,62.5],
        };
        this.updateRoom();
    }

    disconnectClient (clientId) {
        if (this.playerWhite === clientId) this.playerWhite = null;
        else if (this.playerBlack === clientId) this.playerBlack = null;
        if (!this.playerWhite && !this.playerBlack) delete rooms[this.code];
        else this.updateRoom();
    }

    setWhitePlayer (client) {
        this.playerWhite = client.id;
        client.roomCode = this.code;
        this.updateRoom();
    }

    setBlackPlayer (client) {
        this.playerBlack = client.id;
        client.roomCode = this.code;
        this.updateRoom();
    }

    movePiece (type, pos) {
        this.chessData[type] = pos;
        this.updateRoom();
    }

    updateRoom () {
        const client1 = clients[this.playerWhite];
        const client2 = clients[this.playerBlack];
        client1 && client1.socket.emit("RoomUpdate", this);
        client2 && client2.socket.emit("RoomUpdate", this);
    };

}

module.exports = { Room, rooms };
