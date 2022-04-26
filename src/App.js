import React, { useState, useEffect } from 'react';
// TODO: Room URLs
import { BrowserRouter as Router, witch, Route } from 'react-router-dom';
import socketIOClient from 'socket.io-client';
import Chessboard from './Chessboard';
import MainMenu from './MainMenu';
import ErrorAlert from './ErrorAlert';
import DarkModeToggle from './DarkModeToggle';
import Cookies from 'js-cookie';
import { port } from './server/serverconfig.json';

const ENDPOINT = "http://slideychess.com:" + port;

const App = () => {

    const [socket, setSocket] = useState(null);
    const [roomData, setRoomData] = useState(null);
    // Split out chess data so local moves can be cached until server update
    const [chessData, setChessData] = useState(null);
    const [myId, setMyId] = useState(null);
    const [error, setError] = useState(null);
    const [darkMode, setDarkmode] = useState(false);

    useEffect(() => {
        const soc = socketIOClient(ENDPOINT);
        soc.on("ClientId", id => {
            console.log("Received ID " + id);
            setMyId(id);
        });
        soc.on("RoomUpdate", data => {
            console.log("ROOM DATA UPDATE", data);
            setRoomData(data);
            setChessData(data.chessData);
        });
        soc.on("Error", err => {
            setError(err);
        });
        setSocket(soc);
        setDarkmode(Cookies.get('slidey-chess-dark-mode') === "true");

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

    const exitRoom = () => {
        if (!window.confirm("Are you sure you want to exit this game?")) return;
        if (socket) {
            setError(null);
            console.log("Exiting " + roomData.code + "...");
            socket.emit("RoomDisconnect");
        } else {
            console.warn("Socket not set!");
            setError("Could not connect - try refreshing");
        }
    }

    const onPieceMove = (piece, pos) => {
        // Cache new position locally
        let newChessData = Object.assign({}, chessData);
        newChessData[piece] = pos;
        setChessData(newChessData);
        // Update server
        socket.emit("PieceMove", piece, pos);
    };

    const onPieceTake = piece => {
        let newChessData = Object.assign({}, chessData);
        delete newChessData[piece];
        setChessData(newChessData);
        socket.emit("PieceTake", piece);
    };

    let numPlayers = 0;
    if (roomData) {
        if (roomData.playerWhite && roomData.playerBlack)
            numPlayers = 2;
        else if (roomData.playerWhite || roomData.playerBlack)
            numPlayers = 1;
    }

    const toggleDarkMode = on => {
        setDarkmode(on);
        Cookies.set('slidey-chess-dark-mode', on, { expires: 365 });
    }

    const playerColour = roomData && (roomData.playerWhite === myId ? "w" : (roomData.playerBlack === myId ? "b" : "Error"));

    return (<div className={darkMode ? "dark-mode" : "light-mode"}>
        <div className="d-flex flex-column justify-content-center align-items-center main" style={{ width: "100vw", height: "100vh" }}>
            <h1>Slidey Chess</h1>
            {roomData && "In room " + roomData.code + ", " + numPlayers + "/2 players"}
            <br />
            <br />
            <div className="game-panel">
                {roomData ? <div className="d-flex flex-column justify-content-center align-items-center">
                    <h5>You are player {playerColourToString(playerColour)}</h5>
                    <Chessboard chessData={chessData} playerColour={playerColour} onPieceMove={onPieceMove} onPieceTake={onPieceTake} />
                    <br/>
                    <div className="d-flex flex-row justify-content-end w-100">
                        <div className="btn btn-secondary" onClick={exitRoom}>Exit</div>
                    </div>
                </div> : <MainMenu onSubmit={joinRoom} onError={setError} />}
            </div>
            <br />
            {error && <ErrorAlert color="danger" error={error} clearError={() => setError(null)} />}
        </div>
        <div className="position-absolute" style={{ top: 20, left: 20 }}>
            <DarkModeToggle on={darkMode} onChange={toggleDarkMode} style={{ width: 50, height: 50 }} />
        </div>
    </div>);
};

const playerColourToString = colourCode => {
    const playerColourStrings = {
        "w": "White",
        "b": "Black"
    };
    if (playerColourStrings[colourCode]) return playerColourStrings[colourCode];
    else return colourCode;
};

export default App;
