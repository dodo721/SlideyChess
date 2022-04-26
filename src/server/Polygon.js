const Vector = require('./Vector');
const Constants = require('./Constants');

/** Represents a line - a vector with a position */
class Line {

    constructor (point1, point2) {
        this.points = [point1, point2];
    }

    /**
     * Get the unpositioned vector of the line
     * @returns {Vector}
     */
    vector () {
        const p = this.points;
        return new Vector(p[1][0] - p[0][0], p[1][1] - p[0][1]);
    }

    pos () {
        return this.points[0];
    }

    isVertical () {
        return this.points[0][0] === this.points[1][0];
    }

    isHorizontal () {
        return this.points[0][1] === this.points[1][1];
    }

    isDiagonal () {
        return !this.isVertical() && !this.isHorizontal();
    }

    offset (offset) {
        this.points[0] = [this.points[0][0] + offset[0][0], this.points[0][1] + offset[0][1]];
        if (offset.length > 1) {
            this.points[1] = [this.points[1][0] + offset[1][0], this.points[1][1] + offset[1][1]];
        } else {
            this.points[1] = [this.points[1][0] + offset[0][0], this.points[1][1] + offset[0][1]];
        }
    }

    /**
     * Sorts points [low, high]
     * @returns {Number[]}
     */
    pointsSortedByHeight () {
        const lowPoint = this.points[0][1] < this.points[1][1] ? this.points[0] : this.points[1];
        const highPoint = this.points[0][1] < this.points[1][1] ? this.points[1] : this.points[0];
        return [lowPoint,highPoint];
    }

    /**
     * Sorts points [low, high]
     * @returns {Number[]}
     */
    pointsSortedByLength () {
        const lowPoint = this.points[0][0] < this.points[1][0] ? this.points[0] : this.points[1];
        const highPoint = this.points[0][0] < this.points[1][0] ? this.points[1] : this.points[0];
        return [lowPoint,highPoint];
    }

    /**
     * @typedef {Object} LinearEquation
     * @property {number} m the gradient
     * @property {number} c the offset
     */
    
    /**
     * Get this line as a linear equation
     * @returns {LinearEquation}
     */
    linearEquation () {
        const [point1, point2] = this.points;
        // A vertical line cannot have a linear equation defined by y=mx+c
        if (this.isVertical()) return null;
        // m = y2-y1 / x2-x1
        const m = (point2[1] - point1[1]) / (point2[0] - point1[0]);
        // c = y-mx
        const c = point1[1] - (m * point1[0]);
        return {m, c};
    }

    /**
     * Get the point of intersection between this line and another, if one exists
     * @param {Line} line 
     * @returns {?Number[]}
     */
    pointOfIntersection(line) {
        const myEquation = this.linearEquation();
        const theirEquation = line.linearEquation();
        // If both lines are vertical there is no intersection
        if (!myEquation && !theirEquation) return null;

        // VERTICAL LINE SPECIAL CASE
        if (!myEquation || !theirEquation) {
            const vertLine = myEquation ? line : this;
            const otherLine = myEquation ? this : line;
            // Intersection will be at vertical line x
            const x = vertLine.pos()[0];
            // Get y from equation
            const otherEq = otherLine.linearEquation();
            const y = (otherEq.m * x) + otherEq.c;
            // Sort vertical line points by height
            const [lowPoint, highPoint] = vertLine.pointsSortedByHeight();
            // Check y is within limits of vertical line
            if (y >= lowPoint[1] && y <= highPoint[1]) {
                // Sort other line points by length
                const [leftPoint, rightPoint] = otherLine.pointsSortedByLength();
                // Check x is within limits of other line
                if (x >= leftPoint[0] && x <= rightPoint[0]) return [x,y];
            }
            return null;
        }

        // Parallel lines do not intersect
        if (myEquation.m === theirEquation.m) return null;

        // GET POI FROM EQUATIONS
        // Move "m" to the left hand side to make one mx
        let lhs = myEquation.m - theirEquation.m;
        // Move "c" to the right hand side
        let rhs = theirEquation.c - myEquation.c;
        // Solve for x
        let x = rhs / lhs;
        // Feed into this equation to get y
        let y = (myEquation.m * x) + myEquation.c;
        
        // CHECK POI LIES ON BOTH LINES
        const myPsByL = this.pointsSortedByLength();
        const theirPsByL = line.pointsSortedByLength();
        if (x >= myPsByL[0][0] && x <= myPsByL[1][0] &&
            x >= theirPsByL[0][0] && x <= theirPsByL[1][0])
            return [x,y];
        else return null;
    }

}

/**
* Initialise a line from a position and dimentions
* @param {Number[]} pos 
* @param {Number[]} dim 
* @returns {Line}
*/
Line.posDim  = (pos, dim) => {
   const points = [
       pos,
       [pos[0] + dim[0], pos[1] + dim[1]]
   ];
   return new Line(points[0], points[1]);
}

class Polygon {

    constructor (points) {
        if (!Array.isArray(points)) throw new Error ("Constrcutor must receive point array!");
        if (points.length < 3) throw new Error("A polygon must have at least 3 points!");
        this.points = points;
    }

    /**
     * Get the sides of the polygon as Lines
     * @returns {Line[]}
     */
    sides () {
        const lines = [];
        for (let i = 0; i < this.points.length; i++) {
            lines.push(new Line(this.points[i], this.points[i === this.points.length - 1 ? 0 : i + 1]));
        }
        return lines;
    }

    /**
     * Get the area of the polygon
     * @returns {Number}
     */
    area () {
        // Calculate using area under line segment formula
        // https://www.mathsisfun.com/geometry/area-irregular-polygons.html
        const sides = this.sides();
        let area = 0;
        sides.forEach(side => {
            const width = side.points[1][0] - side.points[0][0];
            const avgHeight = (side.points[0][1] + side.points[1][1]) / 2;
            area += width * avgHeight;
        });
        return Math.abs(area);
    }

    /**
     * Get the bounding box of this polygon
     * @returns {Rect}
     */
    boundingBox () {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.points.forEach(point => {
            if (point[0] > maxX) maxX = point[0];
            if (point[0] < minX) minX = point[0];
            if (point[1] > maxY) maxY = point[1];
            if (point[1] < minY) minY = point[1];
        });
        return new Rect([minX, minY], [maxX - minX, maxY - minY]);
    }

    /**
     * Is this polygon a rectangle?
     * @returns {Boolean}
     */
    isRect () {
        if (this.points.length !== 4) return false;
        // If the area of the bounding box is equal to the area of the polygon, it is a rect
        const boundingBox = this.boundingBox();
        const myArea = this.area();
        const bbArea = boundingBox.area();
        return myArea === bbArea;
    }

    /**
     * Does this polygon intersect another? 
     * @param {Polygon} polygon 
     */
    intersects (polygon) {

        // BOUNDING BOX DETECTION
        // Fast test - if bounding boxes do not intersect, we can discard the test
        const boundingBox1 = this.boundingBox();
        const boundingBox2 = polygon.boundingBox();
        if (!boundingBox1.intersectsRect(boundingBox2)) return false;

        // RECT TEST
        // If both polygons are rectangles, then the bounding boxes will equal the polys
        // We have already tested if the bounding boxes intesect, so return true if we haven't already failed
        const imRect = this.isRect();
        const theyRect = polygon.isRect();
        if (imRect && theyRect) return true;

        // SIDE DETECTION
        // Use points of intersection to determine if any sides of the polygon intersect
        const sides = this.sides();
        const otherSides = polygon.sides();
        for (let i = 0; i < sides.length; i++) {
            for (let j = 0; j < otherSides.length; j++) {
                if (sides[i].pointOfIntersection(otherSides[j])) return true;
            }
        }

        // POINT DETECTION
        // Using the Raycasting point-in-polygon algorithm:
        // Raycast from outside the polygon to the point; if the number of sides intersected is odd, there is an intersection.
        // https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm
        const theirPoints = polygon.points;
        for (let i = 0; i < theirPoints.length; i++) {
            const point = theirPoints[i];
            let numIntersections = 0;
            for (let j = 0; j < sides.length; j++) {
                if (Polygon.sideRaycastToPoint(point, sides[j])) numIntersections++;
            }
            if (numIntersections % 2 !== 0) return true;
        }

        // If all other tests returned false, we do not intersect
        return false;
    }

}

/**
* Horizontal raycast to point and detect if side intersects
* Note: colinear or on-edge points are not counted as intersections
* @param {Array} targetPoint
* @param {Line} side
* @returns {Boolean} true if the raycast intersects the side
*/
Polygon.sideRaycastToPoint = (targetPoint, side) => {
   const [point1, point2] = side.points;
   // Special case for horizontal lines - just discount
   if (point1[1] === point2[1]) return false;
   const raycastY = targetPoint[1];
   // Assuming the ray is horizontal, if the points lie on the same side of the Y level, there can be no intersection
   if ((point1[1] > raycastY && point2[1] < raycastY) ||
       (point1[1] < raycastY && point2[1] > raycastY)) {
       // Special case for vertical lines - if the points are above and below the Y level, and are to it's left, there is an intersection
       if (point1[0] === point2[0]){
           if (point1[0] < targetPoint[0]) return true;
           else return false;
       }
       // Find the side as a linear equation y=mx+c
       const {m, c} = side.linearEquation();
       // POI Y = raycastY, feed into equation to get POI X
       const poiX = (raycastY - c) / m;
       // Assuming left-to-right raycast, if POI X > the target X, the intersection does not occur before the point
       if (poiX < targetPoint[0]) return true;
   }
   return false;
};

class Rect {

    constructor (pos, size) {
        this.pos = pos;
        this.size = size;
    }

    polygon () {
        const [x,y] = this.pos;
        const [w,h] = this.size;
        return new Polygon([
            [x,y],
            [x+w, y],
            [x+w, y+h],
            [x, y+h]
        ]);
    }

    area () {
        return Math.abs(this.size[0] * this.size[1]);
    }

    /**
     * Does this rect intersect another?
     * @param {Rect} rect 
     * @returns {Boolean}
     */
    intersectsRect (rect) {
        const r1 = this.tlbrFormat();
        const r2 = rect.tlbrFormat();
        return !(r2.left > r1.right || 
            r2.right < r1.left || 
            r2.top > r1.bottom ||
            r2.bottom < r1.top);
    }

    /**
     * Does this rect intersect a polygon?
     * @param {Polygon} polygon
     * @returns {Boolean}
     */
    intersectsPolygon (polygon) {
        return this.polygon().intersects(polygon);
    }
    
    /**
     * Does a point lie inside this rect?
     * @param {Number[]} point 
     * @returns {Boolean}
     */
    containsPoint (point) {
        const [x,y] = point;
        const [left, top] = this.pos;
        const [width, height] = this.size;
        if (x > left && x < left + width &&
            y > top && y < top + height) {
            return true;
        } else {
            return false;
        }
    }

    tlbrFormat () {
        const [left, top] = this.pos;
        const [width, height] = this.size;
        const r = {left, top, right: left + width, bottom: top + height};
        return r;
    }

}

/**
 * Get a bounding box at a position as a Rect
 * @param {Array} pos
 * @returns {Rect}
 */
Rect.getPieceBoundingRect = pos => {
    // WARNING maybe pos is incorrectly centered? Check!
    const hitbox = new Rect(pos, Constants.hitboxSize);
    const newHit = hitbox.centeredOnSquare();
    return newHit;
};

module.exports = { Polygon, Line, Rect };
