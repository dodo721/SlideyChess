
/**
 * Does a single point lie in a rectangle
 * @param {Array} pos 
 * @param {Array} rect 
 */
const pointIntersectsRect = (pos, rect) => {
    const [x,y] = pos;
    const [left, top, width, height] = rect;
    if (x > left && x < left + width &&
        y > top && y < top + height) {
        return true;
    } else {
        return false;
    }
};

/**
 * Do two rectangles overlap?
 * @param {Array} rect1 
 * @param {Array} rect2 
 */
const rectIntersectsRect = (rect1, rect2) => {
    const r1 = getRectInTLBRFormat(rect1);
    const r2 = getRectInTLBRFormat(rect2);
    return !(r2.left > r1.right || 
        r2.right < r1.left || 
        r2.top > r1.bottom ||
        r2.bottom < r1.top);
};

/**
 * Convert a position,size rect to a top,left,bottom,right rect
 * @param {Array} rect 
 */
const getRectInTLBRFormat = rect => {
    const [left, top, width, height] = rect;
    const r = {left, top, right: left + width, bottom: top + height};
    return r;
};

/**
 * Convert an XYWH rect to a polygon
 * @param {Array} rect 
 */
const rectToPolygon = rect => {
    return [
        [rect[0], rect[1]],
        [rect[0] + rect[2], rect[1]],
        [rect[0] + rect[2], rect[1] + rect[3]],
        [rect[0], rect[1] + rect[3]]
    ];
};

/**
 * Horizontal raycast to point and detect if side intersects
 * Note: colinear or on-edge points are not counted as intersections
 * @param {Array} targetPoint
 * @param {Array} point1 
 * @param {Array} point2 
 */
const sideRaycastToPoint = (targetPoint, point1, point2) => {
    const raycastY = targetPoint[1];
    // Assuming the ray is horizontal, if the points lie on the same side of the Y level, there can be no intersection
    if ((point1[1] > raycastY && point2[1] < raycastY) ||
        (point1[1] < raycastY && point2[1] > raycastY)) {
        // Special case for vertical lines - if the points are above and below the Y level, and are to it's left, there is an intersection
        if (point1[0] === point2[0] && point1[0] < targetPoint[0]) return true;
        // Find the side as a linear equation y=mx+c
        // m = y2-y1 / x2-x1
        const m = (point2[1] - point1[1]) / (point2[0] - point1[0]);
        // c = y-mx
        const c = point1[1] - (m * point1[0]);
        // POI Y = raycastY, feed into equation to get POI X
        const poiX = (raycastY - c) / m;
        // Assuming left-to-right raycast, if POI X > the target X, the intersection does not occur before the point
        if (poiX < targetPoint[0]) return true;
    }
    return false;
};

/**
 * Does a rect overlap a polygon?
 * @param {Array} rect 
 * @param {Array} polygon 
 */
const rectIntersectsPolygon = (rect, polygon) => {
    // Using the Raycasting point-in-polygon algorithm:
    // Raycast from outside the polygon to the point; if the number of sides intersected is odd, there is an intersection.
    // https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm
    const rectPoly = rectToPolygon(rect);
    for (let i = 0; i < rectPoly.length; i++) {
        const point = rectPoly[i];
        let numIntersections = 0;
        for (let j = 0; j < polygon.length; j++) {
            const sidePoint1 = polygon[j];
            const sidePoint2 = polygon[j === polygon.length - 1 ? 0 : j + 1];
            if (sideRaycastToPoint(point, sidePoint1, sidePoint2)) numIntersections++;
        }
        if (numIntersections % 2 !== 0) return true;
    }
    return false;
};

module.exports = { pointIntersectsRect, rectIntersectsRect, getRectInTLBRFormat, rectToPolygon, rectIntersectsPolygon };
