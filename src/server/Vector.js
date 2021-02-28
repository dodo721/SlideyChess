
class Vector {

    constructor (x,y) {
        this.dim = [x,y];
    }

    angle () {
        const [adjacent, opposite] = this.dim;
        const angle = Math.atan2(opposite, adjacent);
        return angle;
    }

    magnitude () {
        const [xDiff, yDiff] = this.dim;
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
        const [x1, y1] = this.dim;
        const [x2, y2] = vector.dim;
        return (x1 * x2) + (y1 * y2);
    }

    /**
     * Get this vector multiplied by a scalar
     * @param {Number} fac 
     */
    multiply (fac) {
        let dim = this.dim;
        dim = dim.map(n => n*fac);
        return Vector.posDim(dim[0], dim[1]);
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
