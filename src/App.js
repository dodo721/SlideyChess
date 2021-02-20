import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';
import Chessboard from './Chessboard';
import MainMenu from './MainMenu';
import ErrorAlert from './ErrorAlert';

const ENDPOINT = "http://slideychess.com:3010";

const App = () => {

    const [socket, setSocket] = useState(null);
    const [roomData, setRoomData] = useState(null);
    const [myId, setMyId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const soc = socketIOClient(ENDPOINT);
        soc.on("ClientId", id => {
            console.log("Received ID " + id);
            setMyId(id);
        });
        soc.on("RoomUpdate", data => {
            console.log("ROOM DATA UPDATE", data);
            setRoomData(data);
        });
        soc.on("Error", err => {
            setError(err);
        });

        setSocket(soc);
        return () => soc.disconnect();
    }, []);

    const joinRoom = roomCode => {
        if (socket) {
            setError(null);
            console.log("Joining " + roomCode + "...");
            socket.emit("RoomConnect", roomCode);
        } else {
            console.warn("Socket not set!");
            setError("Could not connect - try refreshing");
        }
    };

    const onPieveMove = (type, pos) => {
        socket.emit("PieceMove", type, pos);
    };

    let numPlayers = 0;
    if (roomData) {
        if (roomData.playerWhite && roomData.playerBlack)
            numPlayers = 2;
        else if (roomData.playerWhite || roomData.playerBlack)
            numPlayers = 1;
    }

    const playerColour = roomData && (roomData.playerWhite === myId ? "w" : (roomData.playerBlack === myId ? "b" : "Error"));

    return (<div className="d-flex flex-column justify-content-center align-items-center" style={{ width: "100vw", height: "100vh" }}>
        <h1>Slidey Chess</h1>
        {roomData && "In room " + roomData.code + ", " + numPlayers + "/2 players"}
        <br />
        <br />
        <div className="game-panel">
            {roomData ? <div className="d-flex flex-column justify-content-center align-items-center">
                <h5>You are player {playerColourToString(playerColour)}</h5>
                <Chessboard chessData={roomData.chessData} playerColour={playerColour} onPieceMove={onPieveMove}/>
            </div> : <MainMenu onSubmit={joinRoom} />}
        </div>
        <br/>
        {error && <ErrorAlert color="danger" error={error} clearError={() => setError(null)}/>}
    </div>);
};

const playerColourToString = colourCode => {
    const playerColourStrings = {
        "w":"White",
        "b":"Black"
    };
    if (playerColourStrings[colourCode]) return playerColourStrings[colourCode];
    else return colourCode;
};

export default App;
