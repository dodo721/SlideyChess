const { rectIntersectsRect, getRectInTLBRFormat, rectToPolygon, rectIntersectsPolygon } = require('./Collisions');
const { getPieceType, getPieceColour, getPieceCenter } = require('./Pieces');
const { sqSize, sqSizeHalf, sqSizeQuarter, hitboxSize } = require('./Constants');
const { clamp, uniq } = require('./MiscUtil');
const { Polygon } = require('./Polygon');

class Hitbox {
    
    constructor (pos, dir) {
        this.pos = pos;
        this.dir = dir;
    }

    static fromData (data) {
        return new Hitbox([data[0], data[1]], [data[2], data[3]]);
    }

    data () {
        return [...this.pos, ...this.dir];
    }

    polygon () {
        const [posX, posY, dirX, dirY] = this.data();
        let startRect = [posX, posY, hitboxSize[0], hitboxSize[1]];
        let endRect = [posX + dirX, posY + dirY, hitboxSize[0], hitboxSize[1]];
        let startPoly = rectToPolygon(startRect);
        let endPoly = rectToPolygon(endRect);
        let polygon = null;
        if (dirX === 0 && dirY === 0) {
            // Hitbox is a square
            return new Polygon(startPoly);
        }
        if (dirX === 0) {
            // Hitbox is vertical rect
            if (dirY > 0)
                polygon = [startPoly[0], startPoly[1], endPoly[2], endPoly[3]];
            else
                polygon = [endPoly[0], endPoly[1], startPoly[2], startPoly[3]];
        } else if (dirY === 0) {
            // Hitbox is horizontal rect
            if (dirX > 0)
                polygon = [startPoly[0], endPoly[1], endPoly[2], startPoly[3]];
            else
                polygon = [endPoly[0], startPoly[1], startPoly[2], endPoly[3]];
        } else if (dirX > 0 && dirY > 0) {
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
        }
        return new Polygon(polygon);
    }

    /**
     * Transform this hitbox from relative space to piece space
     * @param {Number[]} pos
     * @returns {Hitbox}
     */
    pieceTransform (pos) {
        const newPos = [
            pos[0] + this.pos[0],
            pos[1] + this.pos[1]
        ];
        const newDir = [
            this.dir[0] * sqSize[0],
            this.dir[1] * sqSize[1]
        ];
        return new Hitbox(newPos, newDir);
    }

    /**
     * Get this hitbox offset to square center
     * @returns {Hitbox}
     */
    centeredOnSquare () {
        const offset = sqSizeQuarter;
        const newPos = [
            this.pos[0] + offset[0],
            this.pos[1] + offset[1]
        ];
        return new Hitbox(newPos, this.dir);
    }

    boundingBox () {
        return this.polygon().boundingBox();
    }

    /**
     * Does this hitbox intersect another?
     * @param {Hitbox} hitbox 
     */
    intersects (hitbox) {
        return this.polygon().intersects(hitbox.polygon());
    }

}

const PIECE_HITBOXES = {
    /*"Pw": [
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
        [ 0, -1000, 1, 1000 ],
        // Diagonal right
        ["diagonal", -1000, -1000, 2000, 2000],
        // Diagonal left
        ["diagonal", -1000, 1000, 2000, -2000],
    ],
    "Qb": [
        // Horizontal
        [ -1000, 0, 1000, 1 ],
        // Vertical
        [ 0, -1000, 1, 1000 ],
        // Diagonal right
        ["diagonal", -1000, -1000, 2000, 2000],
        // Diagonal left
        ["diagonal", -1000, 1000, 2000, -2000],
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
    "Bb": [
        ["diagonal", -1000, -1000, 2000, 2000],
        ["diagonal", -1000, 1000, 2000, -2000],
    ],
    "Nw": [
        ["diagonal", -1, 2, 2, -4],
        ["diagonal", 1, 2, -2, -4],
        ["diagonal", -2, 1, 4, -2],
        ["diagonal", 2, 1, -4, -2],
    ],
    "Nb": [
        ["diagonal", -1, 2, 2, -4],
        ["diagonal", 1, 2, -2, -4],
        ["diagonal", -2, 1, 4, -2],
        ["diagonal", 2, 1, -4, -2],
    ]*/
    "Rw": [
        // Horizontal
        new Hitbox([-1000, 0], [1000, 0]),
        // Vertical
        new Hitbox([0, -1000], [0, 1000])
    ],
    "Rb": [
        // Horizontal
        new Hitbox([-1000, 0], [1000, 1]),
        // Vertical
        new Hitbox([0, -1000], [1, 1000])
    ],
};

/**
 * Get a bounding box at a position
 * @param {Array} pos
 * @returns {Hitbox}
 */
const getPieceBoundingHitbox = pos => {
    // TODO Change dimensions to work properly
    const hitbox = new Hitbox(pos, [0,0]);
    const newHit = hitbox.centeredOnSquare();
    return newHit;
};

/**
 * Get the hitboxes for a piece at a position
 * @param {String} type 
 * @param {Array} pos 
 * @returns {Hitbox[]}
 */
const getPieceHitboxes = (type, pos) => {
    // TODO Error handling
    if (!PIECE_HITBOXES[type]) return []; //throw new Error("No hitboxes for type " + type + "!");
    let hitboxes = PIECE_HITBOXES[type].slice();
    hitboxes = hitboxes.map(hitbox => hitbox.pieceTransform(pos).centeredOnSquare());
    return hitboxes;
};

/**
 * Get the cut off hitboxes and pieces hit
 * @param {Array} hitbox 
 * @param {Array} pos
 * @param {Array} inRangePieces
 * @param {Array} chessData
 */
/*
const limitHitboxes = (piece, pos, inRangePieces, chessData) => {
    const hitboxes = getPieceHitboxes(getPieceType(piece), pos);
    const hitPieces = [];
    const center = getPieceCenter(pos);
    const limitedHitboxes = hitboxes.map (hitbox => {
        ///////////////////////////////////////////////////////////////////
        ///                      DIAGONAL LOGIC                         ///
        ///////////////////////////////////////////////////////////////////
        if (hitbox.isDiagonal()) {
            // TODO: logic for diagonal hitboxes
            inRangePieces.forEach(p => hitPieces.push(p));
            return hitbox;
        }

        ///////////////////////////////////////////////////////////////////
        ///                       LINEAR LOGIC                          ///
        ///////////////////////////////////////////////////////////////////

        // Deep copy hitbox
        let limitedHitbox = hitbox.data().slice();
        // TODO: If square, AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa
        // if (hitbox[2] === hitbox[3])

        // Filter pieces not in this hitbox
        const inThisHitbox = inRangePieces.filter(otherPiece=>rectIntersectsRect(getPieceBoundingBox(chessData[otherPiece]).data(), hitbox.data()));
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
        return Hitbox.fromData(limitedHitbox);
    });
    return { hitboxes:limitedHitboxes, hitPieces:uniq(hitPieces) };
};
*/

module.exports = { getPieceHitboxes, getPieceBoundingHitbox, getPieceCenter, Hitbox };
