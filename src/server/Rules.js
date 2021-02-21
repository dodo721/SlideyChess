const { rectIntersectsRect } = require('./RectCollisions');

const PIECE_HITBOXES = {
    "Pw": [
        // Diagonal left
        [ -1, -1, 1, -1 ],
        // Diagonal right
        [ 1, -1, 1, -1 ]
    ],
    "Pb": [
        // Diagonal left
        [ -1, 1, 1, 1 ],
        // Diagonal right
        [ 1, 1, 1, 1 ]
    ],
};

module.exports = { PIECE_HITBOXES };
