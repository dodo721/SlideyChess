const Piece = require('./Pieces');
const Constants = require('./Constants');
const { clamp, uniq } = require('./MiscUtil');
const { Polygon, Line, Rect } = require('./Polygon');
const Vector = require('./Vector');

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
    
    line () {
        const offsetPos = [this.pos[0] + Constants.hitboxSize[0] / 2, this.pos[1] + Constants.hitboxSize[1] / 2];
        return new Line(offsetPos, [offsetPos[0] + this.dir[0], offsetPos[1] + this.dir[1]]);
    }

    polygon () {
        const [posX, posY, dirX, dirY] = this.data();
        let startRect = new Rect([posX, posY], [Constants.hitboxSize[0], Constants.hitboxSize[1]]);
        let endRect = new Rect([posX + dirX, posY + dirY], [Constants.hitboxSize[0], Constants.hitboxSize[1]]);
        const startPoly = startRect.polygon();
        let startPolyPoints = startPoly.points;
        const endPoly = endRect.polygon();
        let endPolyPoints = endPoly.points;
        
        let polygon = null;
        if (dirX === 0 && dirY === 0) {
            // Hitbox is a square
            return startPoly;
        }
        if (dirX === 0) {
            // Hitbox is vertical rect
            if (dirY > 0)
                polygon = [startPolyPoints[0], startPolyPoints[1], endPolyPoints[2], endPolyPoints[3]];
            else
                polygon = [endPolyPoints[0], endPolyPoints[1], startPolyPoints[2], startPolyPoints[3]];
        } else if (dirY === 0) {
            // Hitbox is horizontal rect
            if (dirX > 0)
                polygon = [startPolyPoints[0], endPolyPoints[1], endPolyPoints[2], startPolyPoints[3]];
            else
                polygon = [endPolyPoints[0], startPolyPoints[1], startPolyPoints[2], endPolyPoints[3]];
        } else if (dirX > 0 && dirY > 0) {
            // Right and down \
            polygon = [startPolyPoints[0], startPolyPoints[1], endPolyPoints[1], endPolyPoints[2], endPolyPoints[3], startPolyPoints[3]];
        } else if (dirX > 0 && dirY < 0) {
            // Right and up   /
            polygon = [startPolyPoints[0], endPolyPoints[0], endPolyPoints[1], endPolyPoints[2], startPolyPoints[2], startPolyPoints[3]];
        } else if (dirX < 0 && dirY < 0) {
            // Left and up    \
            polygon = [endPolyPoints[0], endPolyPoints[1], startPolyPoints[1], startPolyPoints[2], startPolyPoints[3], endPolyPoints[3]];
        } else if (dirX < 0 && dirY > 0) {
            // Left and down  /
            polygon = [endPolyPoints[0], startPolyPoints[0], startPolyPoints[1], startPolyPoints[2], endPolyPoints[2], endPolyPoints[3]];
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
            pos[0] + (this.pos[0] * Constants.sqSize[0]),
            pos[1] + (this.pos[1] * Constants.sqSize[1])
        ];
        const newDir = [
            this.dir[0] * Constants.sqSize[0],
            this.dir[1] * Constants.sqSize[1]
        ];
        return new Hitbox(newPos, newDir);
    }

    /**
     * Get this hitbox offset to square center
     * @returns {Hitbox}
     */
    centeredOnSquare () {
        const offset = Constants.sqSizeQuarter;
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

    /**
     * Get the nearest point on the hitbox line to a given point and origin
     * TODO: Limiting
     * @param {*} point 
     * @param {*} origin 
     * @returns {Number[]}
     */
    projectedPoint (point, origin) {
        const line = this.line();
        const vector = line.vector();
        const pointVector = new Vector(point[0] - origin[0], point[1] - origin[1]);
        let projectedVector = pointVector.projectOnto(vector);
        let projectedPoint = [origin[0] + projectedVector.dim[0], origin[1] + projectedVector.dim[1]];
        // Cap maximum projection within line limits
        const projectedLine = Line.posDim(origin, projectedVector.dim);
        if (projectedLine.pointsSortedByHeight()[1][1] > line.pointsSortedByHeight()[1][1]) {
            projectedPoint = line.pointsSortedByHeight()[1];
        } else if (projectedLine.pointsSortedByHeight()[0][1] < line.pointsSortedByHeight()[0][1]) {
            projectedPoint = line.pointsSortedByHeight()[0];
        } else if (projectedLine.pointsSortedByLength()[1][0] > line.pointsSortedByLength()[1][0]) {
            projectedPoint = line.pointsSortedByLength()[1];
        } else if (projectedLine.pointsSortedByLength()[0][0] < line.pointsSortedByLength()[0][0]) {
            projectedPoint = line.pointsSortedByLength()[0];
        }
        /*if (projectedVector.magnitude() > vector.magnitude()) {
            projectedVector = projectedVector.normalised().multiply(vector.magnitude());
        } else if (projectedVector.magnitude() < 0) {
            projectedVector = new Vector(0,0);
        }*/
        //return Line.posDim(origin, projectedVector.dim);
        return projectedPoint;
    }

}

/**
 * Get a bounding box at a position as a Hitbox
 * @param {Array} pos
 * @returns {Hitbox}
*/
Hitbox.getPieceBoundingHitbox = pos => {
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
 Hitbox.getPieceHitboxes = (type, pos) => {
    // TODO Error handling
    if (!PIECE_HITBOXES[type]) return []; //throw new Error("No hitboxes for type " + type + "!");
    let hitboxes = PIECE_HITBOXES[type].slice();
    hitboxes = hitboxes.map(hitbox => hitbox.pieceTransform(pos).centeredOnSquare());
    return hitboxes;
};

/**
* Returns a list of pieces in danger from the given piece
* @param {String} piece The identifier of the piece
* @param {Array} pos 
* @param {Array} chessData The current data of the chessboard
* @param {Boolean} includeMyPieces Include the pieces of the player's side
*/
Hitbox.getPiecesInHitbox = (piece, pos, chessData, includeMyPieces) => {
   const type = Piece.getPieceType(piece);
   const colour = Piece.getPieceColour(piece);
   // TODO Error handling
   const hitboxes = Hitbox.getPieceHitboxes(type, pos);
   let takeablePieces = [];
   let otherPieces = Object.keys(chessData);
   // Filter pieces of same colour
   if (!includeMyPieces) otherPieces = otherPieces.filter(otherPiece => Piece.getPieceColour(otherPiece) !== colour);
   hitboxes.forEach(hitbox => {
       otherPieces.forEach(otherPiece => {
           if (otherPiece === piece) return;
           const otherPieceBoundingBox = Hitbox.getPieceBoundingHitbox(chessData[otherPiece]);
           if (otherPieceBoundingBox.intersects(hitbox)) {
               takeablePieces.push(otherPiece);
           }
       });
   });
   return uniq(takeablePieces);
}

Hitbox.limitHitboxes = (piece, pos, inRangePieces, chessData) => {
    const hitboxes = Hitbox.getPieceHitboxes(Piece.getPieceType(piece), pos);
    const hitPieces = [];
    const center = Piece.getPieceCenter(pos);
    const limitedHitboxes = hitboxes.map (hitbox => {
        ///////////////////////////////////////////////////////////////////
        ///                      DIAGONAL LOGIC                         ///
        ///////////////////////////////////////////////////////////////////
        /*if (hitbox.isDiagonal()) {
            // TODO: logic for diagonal hitboxes
            inRangePieces.forEach(p => hitPieces.push(p));
            return hitbox;
        }*/
        ///////////////////////////////////////////////////////////////////
        ///                       LINEAR LOGIC                          ///
        ///////////////////////////////////////////////////////////////////
        // Deep copy hitbox
        let limitedHitbox = hitbox.data().slice();
        // TODO: If square, AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa
        // if (hitbox[2] === hitbox[3])
        // Filter pieces not in this hitbox
        const inThisHitbox = inRangePieces.filter(otherPiece=>Hitbox.getPieceBoundingHitbox(chessData[otherPiece]).intersects(hitbox));
        const horizontal = hitbox[2] > hitbox[3];
        if (horizontal) {
            // HORIZONTAL - LIMIT BY X AND WIDTH
            // Filter pieces into those above and below the center
            const belowCenterXPieces = inThisHitbox.filter(otherPiece => Piece.getPieceCenter(chessData[otherPiece])[0] < center[0]);
            const aboveCenterXPieces = inThisHitbox.filter(otherPiece => Piece.getPieceCenter(chessData[otherPiece])[0] > center[0]);
            // Find the minimum and maximum X values for the hitbox
            let maxBelow = 0;
            let minAbove = 500;
            let lastHitPiece = null;
            belowCenterXPieces.forEach(otherPiece => {
                const otherPieceCenter = Piece.getPieceCenter(chessData[otherPiece]);
                if (otherPieceCenter[0] > maxBelow) {
                    maxBelow = otherPieceCenter[0];
                    lastHitPiece = otherPiece;
                }
            });
            if (lastHitPiece) hitPieces.push(lastHitPiece);
            lastHitPiece = null;
            aboveCenterXPieces.forEach(otherPiece => {
                const otherPieceCenter = Piece.getPieceCenter(chessData[otherPiece]);
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
            const belowCenterYPieces = inThisHitbox.filter(otherPiece => Piece.getPieceCenter(chessData[otherPiece])[1] < center[1]);
            const aboveCenterYPieces = inThisHitbox.filter(otherPiece => Piece.getPieceCenter(chessData[otherPiece])[1] > center[1]);
            // Find the minimum and maximum X values for the hitbox
            let maxBelow = 0;
            let minAbove = 500;
            let lastHitPiece = null;
            belowCenterYPieces.forEach(otherPiece => {
                const otherPieceCenter = Piece.getPieceCenter(chessData[otherPiece]);
                if (otherPieceCenter[1] > maxBelow) {
                    maxBelow = otherPieceCenter[1];
                    lastHitPiece = otherPiece;
                }
            });
            if (lastHitPiece) hitPieces.push(lastHitPiece);
            lastHitPiece = null;
            aboveCenterYPieces.forEach(otherPiece => {
                const otherPieceCenter = Piece.getPieceCenter(chessData[otherPiece]);
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
    ],*/
    "Bw": [
        new Hitbox([-1000, -1000], [2000, 2000]),
        new Hitbox([-1000, 1000], [2000, -2000]),
    ],
    "Bb": [
        new Hitbox([-1000, -1000], [2000, 2000]),
        new Hitbox([-1000, 1000], [2000, -2000]),
    ],
    "Nw": [
        new Hitbox([-1, 2], [2, -4]),
        //new Hitbox([1, 2], [-2, -4]),
        //new Hitbox([-2, 1], [4, -2]),
        //new Hitbox([2, 1], [-4, -2]),
    ],
    "Nb": [
        new Hitbox([-1, 2], [2, -4]),
        new Hitbox([1, 2], [-2, -4]),
        new Hitbox([-2, 1], [4, -2]),
        new Hitbox([2, 1], [-4, -2]),
    ],
    "Rw": [
        // Horizontal
        new Hitbox([-1000, 0], [2000, 0]),
        // Vertical
        new Hitbox([0, -1000], [0, 2000])
    ],
    "Rb": [
        // Horizontal
        new Hitbox([-1000, 0], [2000, 0]),
        // Vertical
        new Hitbox([0, -1000], [0, 2000])
    ],
};

module.exports = Hitbox;
