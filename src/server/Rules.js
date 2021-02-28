const { rectIntersectsRect, getRectInTLBRFormat, rectToPolygon, rectIntersectsPolygon } = require('./Collisions');
const { getPieceType, getPieceColour } = require('./Pieces');
const { clamp, uniq, dist } = require('./MiscUtil');
const { sqSize, sqSizeHalf, sqSizeQuarter, hitboxSize } = require('./Constants');
const { Hitbox, getPieceHitboxes, getPieceCenter, getPieceBoundingHitbox } = require('./Hitbox');

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
    if (!includeMyPieces) otherPieces = otherPieces.filter(otherPiece => getPieceColour(otherPiece) !== colour);
    hitboxes.forEach(hitbox => {
        otherPieces.forEach(otherPiece => {
            if (otherPiece === piece) return;
            const otherPieceBoundingBox = getPieceBoundingHitbox(chessData[otherPiece]);
            if (otherPieceBoundingBox.intersects(hitbox)) {
                takeablePieces.push(otherPiece);
            }
        });
    });
    return uniq(takeablePieces);
}

/**
 * Get the cut off hitboxes and pieces hit
 * @param {Array} hitbox 
 * @param {Array} pos
 * @param {Array} chessData
 */
const limitHitboxes = (piece, pos, chessData) => {
    const hitboxes = getPieceHitboxes(getPieceType(piece), pos);
    const hitPieces = [];
    const center = getPieceCenter(pos);
    const inRange = getPiecesInRange
    const limitedHitboxes = hitboxes.map (hitbox => {
        
    });
    return { hitboxes:limitedHitboxes, hitPieces:uniq(hitPieces) };
};

/*const getTakeablePieces = (piece, pos, chessData) => {
    const inRange = getPiecesInRange(piece, pos, chessData, true);
    const hitboxes = pieceRaycast(piece, pos, inRange, chessData);

};*/

module.exports = { getPiecesInRange };
