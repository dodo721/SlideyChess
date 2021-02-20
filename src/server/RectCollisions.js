
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
    const [left1, top1, width1, height1] = rect1;
    const [left2, top2, width2, height2] = rect2;
    const r1 = {left: left1, top: top1, right: left1 + width1, bottom: top1 + height1};
    const r2 = {left: left2, top: top2, right: left2 + width2, bottom: top2 + height2};
    return !(r2.left > r1.right || 
        r2.right < r1.left || 
        r2.top > r1.bottom ||
        r2.bottom < r1.top);
};

module.exports = { pointIntersectsRect, rectIntersectsRect };
