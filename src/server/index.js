const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    transport:['websocket'],
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const e = require('express');
const { Client, clients } = require('./Client');
const { Room, rooms } = require('./Room');

// Server status page
app.get('/', (req, res) => {
    const clientIds = Object.keys(clients);
    const roomCodes = Object.keys(rooms);
    res.send(`
        <style>
            td {
                border: 1px solid grey;
                padding: 5px;
            }
        </style>
        <h1>Slidey Chess server status</h1>
        <h3>Clients</h3>
        ${clientIds.length} connected
        <table>
            <tbody>
            ${clientIds.map(id => `
                <tr><td>${id}</td></tr>
            `)}
            </tbody>
        </table>
        <br />
        <h3>Rooms</h3>
        ${roomCodes.length} rooms in session
        <table>
            <tbody>
            ${roomCodes.map(code => `
                <tr>
                    <td>${code}</td>
                    <td>${rooms[code].playerWhite && rooms[code].playerBlack ? 2 :
                        (rooms[code].playerWhite || rooms[code].playerBlack ? 1 : 0)}/2 connected</td>    
                </tr>
            `)}
            </tbody>
        </table>
    `);
});

// Client management
io.on('connection', (socket) => {
    
    // Room client is connected to
    let myRoom = null;
    // Select an available ID
    const me = new Client(socket);
    const myId = me.id;
    socket.emit("ClientId", myId);
    console.log('User ' + socket.handshake.address + ' connected, assigned ID ' + myId);

    socket.on("disconnect", () => {
        console.log("Client " + myId + " has disconnected" + (myRoom ? " from room " + myRoom.code : ""));
        me.disconnect();
        if (myRoom) myRoom.disconnectClient(myId);
    });

    socket.on("PieceMove", (type, pos)=> {
        const playerColour = getPlayerColour(me, myRoom);
        const pieceColour = type.substr(2);
        if (playerColour === pieceColour) myRoom.movePiece(type, pos);
        else socket.emit("Error", "You cannot move your opponent's pieces!");
    });

    // Client wants to join a room
    socket.on("RoomConnect", roomCode => {
        console.log("Client requesting room " + roomCode + "...");
        // No empty room codes
        if (!roomCode) {
            console.error(myId + " empty room code");
            socket.emit("Error", "Room code cannot be empty!");
            return;
        }
        // Try to create room
        try {
            myRoom = new Room(roomCode, myId);
            console.log(myId + " new room " + roomCode);
        } catch {
            // Room exists, try and join it instead
            const desiredRoom = rooms[roomCode];
            // Check the existing room has space
            if (!desiredRoom.playerBlack) {
                rooms[roomCode].setBlackPlayer(me);
                myRoom = rooms[roomCode];
                console.log(myId + " joined room " + roomCode + " as black");
            } else if (!desiredRoom.playerWhite) {
                rooms[roomCode].setWhitePlayer(me);
                myRoom = rooms[roomCode];
                console.log(myId + " joined room " + roomCode + " as white");
            } else {
                // Tell the client no <3
                myRoom = null;
                console.log(myId + " room full! " + roomCode);
                socket.emit("Error", "That room is full!");
            }
        }
    });
});

const getPlayerColour = (client, room) => {
    if (client.id === room.playerWhite) return "w";
    else if (client.id === room.playerBlack) return "b";
    else return null;
}

http.listen(3010, () => {
    console.log('listening on *:3010');
});