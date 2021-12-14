const { json } = require('express');
const { clients } = require('./Client');
const Piece = require('./Pieces');

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
        this.chessData = Piece.getDefaultPieces();
        this.updateRoom();
    }

    disconnectClient (clientId) {
        if (this.playerWhite === clientId) this.playerWhite = null;
        else if (this.playerBlack === clientId) this.playerBlack = null;
        const socket = clients[clientId].socket;
        if (socket) socket.emit("RoomUpdate", null);
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

    movePiece (piece, pos) {
        this.chessData[piece] = pos;
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
