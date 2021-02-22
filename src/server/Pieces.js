const chessPieceImages = {
    "Kb": "/images/king_black.png",
    "Kw": "/images/king_white.png",
    "Qb": "/images/queen_black.png",
    "Qw": "/images/queen_white.png",
    "Bb": "/images/bishop_black.png",
    "Bw": "/images/bishop_white.png",
    "Nb": "/images/knight_black.png",
    "Nw": "/images/knight_white.png",
    "Rb": "/images/rook_black.png",
    "Rw": "/images/rook_white.png",
    "Pb": "/images/pawn_black.png",
    "Pw": "/images/pawn_white.png"
};

const defaultPieces = {
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

/**
 * Get the starting position of the chessboard
 */
const getDefaultPieces = () => {
    // Deep copy to prevent mutation
    return { ...defaultPieces };
}

/**
 * Get the type of the piece
 * @param {String} piece 
 */
const getPieceType = (piece) => {
    return piece.substr(0,1) + piece.substr(2);
};

/**
 * Get the colour of a piece
 * @param {String} piece 
 */
const getPieceColour = (piece) => {
    return piece.substr(2);
}

module.exports = { chessPieceImages, getDefaultPieces, getPieceType, getPieceColour };
