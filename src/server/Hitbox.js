const { rectIntersectsRect, getRectInTLBRFormat, rectToPolygon, rectIntersectsPolygon } = require('./Collisions');
const { getPieceType, getPieceColour, getPieceCenter } = require('./Pieces');
const { sqSize, sqSizeHalf, sqSizeQuarter, hitboxSize } = require('./Constants');
const { clamp, uniq } = require('./MiscUtil');
const { Polygon, Line } = require('./Polygon');

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
        return new Line(this.pos, [this.pos[0] + this.dir[0], this.pos[1] + this.dir[1]]);
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
            pos[0] + (this.pos[0] * sqSize[0]),
            pos[1] + (this.pos[1] * sqSize[1])
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
    ],*/
    "Nw": [
        new Hitbox([-1, 2], [2, -4]),
        new Hitbox([1, 2], [-2, -4]),
        new Hitbox([-2, 1], [4, -2]),
        new Hitbox([2, 1], [-4, -2]),
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

module.exports = { getPieceHitboxes, getPieceBoundingHitbox, getPieceCenter, Hitbox };
