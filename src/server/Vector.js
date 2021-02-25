
class Vector {

    constructor (point1, point2) {
        this.points = [point1, point2];
    }

    /**
     * Initialise a vector from a position and dimentions
     * @param {Array} pos 
     * @param {Array} dim 
     */
    static posDim (pos, dim) {
        const points = [
            pos,
            pos[0] + dim[0], pos[1] + dim[1]
        ];
        return new Vector(points[0], points[1]);
    }

    /**
     * Get the dimensions of the vector in XY
     */
    getDim () {
        const points = this.points;
        const xDiff = points[1][0] - points[0][0];
        const yDiff = points[1][1] - points[0][1];
        return [xDiff, yDiff];
    }

    angle () {
        const [adjacent, opposite] = this.getDim();
        const angle = Math.atan2(opposite, adjacent);
        return angle;
    }

    magnitude () {
        const [xDiff, yDiff] = this.getDim();
        const mag = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
        return mag;
    }

    pos () {
        return this.points[0];
    }

    /**
     * Get the dot product of this and another vector
     * @param {Vector} vector 
     */
    dot (vector) {
        const [x1, y1] = this.getDim();
        const [x2, y2] = vector.getDim();
        return (x1 * x2) + (y1 * y2);
    }

    /**
     * Get this vector multiplied by a scalar
     * @param {Number} fac 
     */
    multiply (fac) {
        const pos = this.pos();
        let dim = this.getDim();
        dim = dim.map(n => n*fac);
        return Vector.posDim(pos, dim);
    }

    /**
     * Get the projection of this vector onto another vector
     * @param {Vector} vector 
     */
    projectOnto (vector) {
        const otherMag = vector.magnitude();
        const projectMag = this.dot(vector) / (otherMag * otherMag);
        return vector.multiply(projectMag);
    }

}

module.exports = Vector;
