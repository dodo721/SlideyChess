import React from 'react';
import ChessCanvas from './ChessCanvas';

const Chessboard = ({chessData, playerColour, onPieceMove}) => {

    const canvasSize = [500, 500];
    const sqSize = canvasSize.map(n => n / 8);

    /*const chessData = [
        {type:"Bb", pos:[100,100]},
        {type:"Bw", pos:[200,200]},
        {type:"Nb", pos:[200,100]},
        {type:"Nw", pos:[100,200]},
        {type:"Kw", pos:[150,300]},
    ];*/

    const setPiecePosLocal = (type, pos) => {
        for (let i = 0; i < chessData.length; i++) {
            if (chessData[i].type === type) {
                chessData[i].pos = pos;
            }
        }
    };

    return <ChessCanvas chessData={chessData} playerColour={playerColour} onPieceMove={onPieceMove} width="500" height="500" style={{border:"1px solid grey"}}>

    </ChessCanvas>;

};

export default Chessboard;