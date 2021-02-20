import React, { useState } from 'react';

const MainMenu = ({onSubmit}) => {
    
    const [roomCode, setRoomCode] = useState("");

    const submitFunc = e => {
        e.preventDefault();
        onSubmit(roomCode);
    }

    return <form className="d-flex flex-column justify-content-center align-items-stretch" onSubmit={submitFunc}>
        <input type="text" name="room" onChange={e => setRoomCode(e.target.value)}/><br/>
        <input type="submit" className="btn btn-primary" value="Join Room"/>
    </form>
};

export default MainMenu;
