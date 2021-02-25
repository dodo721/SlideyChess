const { rectIntersectsRect, getRectInTLBRFormat, rectToPolygon, rectIntersectsPolygon } = require('./Collisions');
const { getPieceType, getPieceColour } = require('./Pieces');
const { clamp, uniq, dist } = require('./MiscUtil');

const sqSize = [500/8, 500/8];
const sqSizeHalf = sqSize.map(n=>n/2);
const sqSizeQuarter = sqSize.map(n=>n/4);

const hitboxSize = sqSizeHalf;

const PIECE_HITBOXES = {
    "Pw": [
        // Diagonal left
        [ -1, -1, 1, 1 ],
        // Diagonal right
        [ 1, -1, 1, 1 ]
    ],
    "Pb": [
        // Diagonal left
        [ -1, 1, 1, 1 ],
        // Diagonal right
        [ 1, 1, 1, 1 ]
    ],
    "Rw": [
        // Horizontal
        [ -1000, 0, 1000, 1 ],
        // Vertical
        [ 0, -1000, 1, 1000 ]
    ],
    "Rb": [
        // Horizontal
        [ -1000, 0, 1000, 1 ],
        // Vertical
        [ 0, -1000, 1, 1000 ]
    ],
    "Qw": [
        // Horizontal
        [ -1000, 0, 1000, 1 ],
        // Vertical
        [ 0, -1000, 1, 1000 ]
    ],
    "Qb": [
        // Horizontal
        [ -1000, 0, 1000, 1 ],
        // Vertical
        [ 0, -1000, 1, 1000 ]
    ],
    "Kw": [
        // Horizontal
        [ -1, 0, 5, 1 ],
        // Vertical
        [ 0, -1, 1, 5 ]
    ],
    "Kb": [
        // Horizontal
        [ -1, 0, 5, 1 ],
        // Vertical
        [ 0, -1, 1, 5 ]
    ],
    "Bw": [
        ["diagonal", -1000, -1000, 2000, 2000],
        ["diagonal", -1000, 1000, 2000, -2000],
    ],
    "Nw": [
        ["diagonal", -1, 2, 2, -4],
        ["diagonal", 1, 2, -2, -4],
        ["diagonal", -2, 1, 4, -2],
        ["diagonal", 2, 1, -4, -2],
    ]
};

/**
 * Get a hitbox scaled to the set square size, offset and positioned
 * @param {Array} hitbox 
 * @param {Array} pos
 */
const getTransformedHitbox = (hitbox, pos) => {
    const hitboxOffset = hitboxSize.map(n=>n/2);
    if (hitboxIsDiagonal(hitbox)) {
        // Deep copy;
        let relativeHitbox = hitbox.slice();
        // Position = given pos + pos offsets * sqSize
        relativeHitbox[1] = (hitbox[1] * sqSize[0]) + hitboxOffset[0] + pos[0];
        relativeHitbox[2] = (hitbox[2] * sqSize[1]) + hitboxOffset[1] + pos[1];
        // Transform scale by sqSize
        relativeHitbox[3] *= sqSize[0];
        relativeHitbox[4] *= sqSize[1];
        return relativeHitbox;
    }
    let relativeHitbox = [
        hitbox[0] * sqSize[0] + hitboxOffset[0] + pos[0],
        hitbox[1] * sqSize[1] + hitboxOffset[1] + pos[1],
        hitbox[2] * hitboxSize[0],
        hitbox[3] * hitboxSize[1]
    ];
    relativeHitbox = relativeHitbox.map(n => clamp(n, 0, 500));
    return relativeHitbox;
};

const hitboxIsDiagonal = hitbox => {
    return hitbox[0] === "diagonal";
}

const diagonalHitboxToPolygon = hitbox => {
    if (!hitboxIsDiagonal(hitbox)) throw new Error("Expected a diagonal hitbox but did not receive one!");
    const [posX, posY, dirX, dirY] = hitbox.slice(1);
    let startRect = [posX, posY, hitboxSize[0], hitboxSize[1]];
    let endRect = [posX + dirX, posY + dirY, hitboxSize[0], hitboxSize[1]];
    let startPoly = rectToPolygon(startRect);
    let endPoly = rectToPolygon(endRect);
    let polygon = null;
    if (dirX > 0 && dirY > 0) {
        // Right and down \
        polygon = [startPoly[0], startPoly[1], endPoly[1], endPoly[2], endPoly[3], startPoly[3]];
    } else if (dirX > 0 && dirY < 0) {
        // Right and up   /
        polygon = [startPoly[0], endPoly[0], endPoly[1], endPoly[2], startPoly[2], startPoly[3]];
    } else if (dirX < 0 && dirY < 0) {
        // Left and up    \
        polygon = [endPoly[0], endPoly[1], startPoly[1], startPoly[2], startPoly[3], endPoly[3]];
    } else if (dirX < 0 && dirY > 0) {
        // Left and down  /
        polygon = [endPoly[0], startPoly[0], startPoly[1], startPoly[2], endPoly[2], endPoly[3]];
    } else throw new Error("Hitbox is axis-aligned! Use Rect hitboxes for this purpose, for better optimization.");
    return polygon;
}

/**
 * Get the center point of a piece
 * @param {Array} pos 
 */
const getPieceCenter = pos => {
    return [
        pos[0] + sqSizeHalf[0],
        pos[1] + sqSizeHalf[1]
    ];
};

/**
 * Get the cut off hitboxes and pieces hit
 * @param {Array} hitbox 
 * @param {Array} pos
 * @param {Array} inRangePieces
 * @param {Array} chessData
 * @param {Boolean} invert
 */
const pieceRaycast = (piece, pos, inRangePieces, chessData, invert) => {
    const hitboxes = getPieceHitboxes(getPieceType(piece), pos, invert);
    const hitPieces = [];
    const center = getPieceCenter(pos);
    const limitedHitboxes = hitboxes.map (hitbox => {
        ///////////////////////////////////////////////////////////////////
        ///                      DIAGONAL LOGIC                         ///
        ///////////////////////////////////////////////////////////////////
        if (hitboxIsDiagonal(hitbox)) {
            inRangePieces.forEach(p => hitPieces.push(p));
            return hitbox;
        }

        ///////////////////////////////////////////////////////////////////
        ///                       LINEAR LOGIC                          ///
        ///////////////////////////////////////////////////////////////////

        // Deep copy hitbox
        let limitedHitbox = hitbox.slice();
        // TODO: If square, AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa
        // if (hitbox[2] === hitbox[3])

        // Filter pieces not in this hitbox
        const inThisHitbox = inRangePieces.filter(otherPiece=>rectIntersectsRect(getPieceBoundingBox(chessData[otherPiece]), hitbox));
        const horizontal = hitbox[2] > hitbox[3];
        if (horizontal) {
            // HORIZONTAL - LIMIT BY X AND WIDTH
            // Filter pieces into those above and below the center
            const belowCenterXPieces = inThisHitbox.filter(otherPiece => getPieceCenter(chessData[otherPiece])[0] < center[0]);
            const aboveCenterXPieces = inThisHitbox.filter(otherPiece => getPieceCenter(chessData[otherPiece])[0] > center[0]);
            // Find the minimum and maximum X values for the hitbox
            let maxBelow = 0;
            let minAbove = 500;
            let lastHitPiece = null;
            belowCenterXPieces.forEach(otherPiece => {
                const otherPieceCenter = getPieceCenter(chessData[otherPiece]);
                if (otherPieceCenter[0] > maxBelow) {
                    maxBelow = otherPieceCenter[0];
                    lastHitPiece = otherPiece;
                }
            });
            if (lastHitPiece) hitPieces.push(lastHitPiece);
            lastHitPiece = null;
            aboveCenterXPieces.forEach(otherPiece => {
                const otherPieceCenter = getPieceCenter(chessData[otherPiece]);
                if (otherPieceCenter[0] < minAbove) {
                    minAbove = otherPieceCenter[0];
                    lastHitPiece = otherPiece;
                }
            });
            if (lastHitPiece) hitPieces.push(lastHitPiece);
            // Set hitbox X pos and width to minimum and maximum calculated
            limitedHitbox[0] = Math.max(maxBelow, hitbox[0]);
            const posXDiff = limitedHitbox[0] - hitbox[0];
            limitedHitbox[2] = Math.min(minAbove - hitbox[0], hitbox[2]) - posXDiff;
        } else {
            // VERTICAL - LIMIT BY Y AND HEIGHT
            // Filter pieces into those above and below the center
            const belowCenterYPieces = inThisHitbox.filter(otherPiece => getPieceCenter(chessData[otherPiece])[1] < center[1]);
            const aboveCenterYPieces = inThisHitbox.filter(otherPiece => getPieceCenter(chessData[otherPiece])[1] > center[1]);
            // Find the minimum and maximum X values for the hitbox
            let maxBelow = 0;
            let minAbove = 500;
            let lastHitPiece = null;
            belowCenterYPieces.forEach(otherPiece => {
                const otherPieceCenter = getPieceCenter(chessData[otherPiece]);
                if (otherPieceCenter[1] > maxBelow) {
                    maxBelow = otherPieceCenter[1];
                    lastHitPiece = otherPiece;
                }
            });
            if (lastHitPiece) hitPieces.push(lastHitPiece);
            lastHitPiece = null;
            aboveCenterYPieces.forEach(otherPiece => {
                const otherPieceCenter = getPieceCenter(chessData[otherPiece]);
                if (otherPieceCenter[1] < minAbove) {
                    minAbove = otherPieceCenter[1];
                    lastHitPiece = otherPiece;
                }
            });
            if (lastHitPiece) hitPieces.push(lastHitPiece);
            // Set hitbox Y pos and height to minimum and maximum calculated
            limitedHitbox[1] = Math.max(maxBelow, hitbox[1]);
            const posYDiff = limitedHitbox[1] - hitbox[1];
            limitedHitbox[3] = Math.min(minAbove - hitbox[1], hitbox[3]) - posYDiff;
        }
        return limitedHitbox;
    });
    return { hitboxes:limitedHitboxes, hitPieces:uniq(hitPieces) };
};

/**
 * Get the hitboxes for a piece at a position
 * @param {String} type 
 * @param {Array} pos 
 * @param {Boolean} invert Give the transform from the black player's perspective
 */
const getPieceHitboxes = (type, pos, invert) => {
    // Swap colour for black perspective
    if (invert) type = type.substr(0,1) + (type.substr(1) === "w" ? "b" : "w");
    // TODO Error handling
    if (!PIECE_HITBOXES[type]) return []; //throw new Error("No hitboxes for type " + type + "!");
    let hitboxes = PIECE_HITBOXES[type].slice();
    hitboxes = hitboxes.map(hitbox => getTransformedHitbox(hitbox, pos));
    return hitboxes;
};

/**
 * Get a bounding box at a position
 * @param {Array} pos 
 */
const getPieceBoundingBox = pos => {
    return getTransformedHitbox([0,0,1,1], pos);
};

/**
 * Returns a list of pieces in danger from the given piece
 * @param {String} piece The identifier of the piece
 * @param {Array} pos 
 * @param {Array} chessData The current data of the chessboard
 * @param {Boolean} includeMyPieces Include the pieces of the player's side
 */
const getPiecesInRange = (piece, pos, chessData, includeMyPieces) => {
    const type = getPieceType(piece);
    const colour = getPieceColour(piece);
    // TODO Error handling
    const hitboxes = getPieceHitboxes(type, pos);
    
    let takeablePieces = [];
    let otherPieces = Object.keys(chessData);
    // Filter pieces of same colour
    if (!includeMyPieces) otherPieces = otherPieces.filter(otherPiece=>getPieceColour(otherPiece)!==colour);
    hitboxes.forEach(hitbox => {
        otherPieces.forEach(otherPiece => {
            if (otherPiece === piece) return;
            const otherPieceBoundingBox = getPieceBoundingBox(chessData[otherPiece]);
            if (hitboxIsDiagonal(hitbox)) {
                if (rectIntersectsPolygon(otherPieceBoundingBox, diagonalHitboxToPolygon(hitbox))) {
                    takeablePieces.push(otherPiece);
                }
            } else if (rectIntersectsRect(hitbox, otherPieceBoundingBox)) {
                takeablePieces.push(otherPiece);
            }
        });
    });
    return uniq(takeablePieces);
}

const getTakeablePieces = (piece, pos, chessData) => {
    const inRange = getPiecesInRange(piece, pos, chessData, true);
    const hitboxes = pieceRaycast(piece, pos, inRange, chessData);

};

module.exports = { getPiecesInRange, getTransformedHitbox, getPieceBoundingBox, getPieceHitboxes, pieceRaycast, getPieceCenter, hitboxIsDiagonal, diagonalHitboxToPolygon, sqSize, sqSizeHalf, sqSizeQuarter };
