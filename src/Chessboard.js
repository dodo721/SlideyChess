import React from 'react';
import ChessCanvas from './ChessCanvas';

const Chessboard = ({chessData, playerColour, onPieceMove, onPieceTake}) => {

    return <ChessCanvas chessData={chessData} playerColour={playerColour} onPieceMove={onPieceMove} onPieceTake={onPieceTake} width="500" height="500" style={{border:"1px solid grey"}}>

    </ChessCanvas>;

};

export default Chessboard;