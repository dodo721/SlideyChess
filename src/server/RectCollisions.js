
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

module.exports = { pointIntersectsRect, rectIntersectsRect, getRectInTLBRFormat };
