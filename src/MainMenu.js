import React, { useState } from 'react';

const MainMenu = ({onSubmit, onError}) => {
    
    const [roomCode, setRoomCode] = useState("");

    const submitFunc = e => {
        e.preventDefault();
        if (validate(roomCode))
            onSubmit(roomCode);
        else
            onError("Room code must be alphanumeric");
    }

    const validate = value => {
        const isAlphaNumeric = !!value.match(/^(|[a-z0-9]+)$/i);
        if (isAlphaNumeric) setRoomCode(value);
        return isAlphaNumeric;
    }

    return <form className="d-flex flex-column justify-content-center align-items-stretch" onSubmit={submitFunc}>
        <input type="text" name="room" onChange={e => validate(e.target.value)} value={roomCode}/><br/>
        <input type="submit" className="btn btn-primary" value="Join Room"/>
    </form>
};

export default MainMenu;
