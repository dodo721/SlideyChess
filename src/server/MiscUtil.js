/**
 * Utility function somehow not existing within core JS??
 * @param {Number} num 
 * @param {Number} min 
 * @param {Number} max 
 */
const clamp = (num, min, max) => {
    return Math.min(Math.max(num, min), max);
}

/**
 * Filter an array to only include unique values
 * @param {Array} array 
 */
const uniq = array => {
    return array.filter((e, i) => array.indexOf(e) === i);
};

/**
 * Get the distance between 2 points
 * @param {Array} pos1 
 * @param {Array} pos2 
 */
const dist = (pos1, pos2) => {
    const distX = pos2[0] - pos1[0];
    const distY = pos2[1] - pos1[1];
    const dist = Math.sqrt((distX * distX) + (distY + distY));
    return dist;
}

module.exports = { clamp, uniq, dist };
