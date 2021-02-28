
const sqSize = [500/8, 500/8];
const sqSizeHalf = sqSize.map(n=>n/2);
const sqSizeQuarter = sqSize.map(n=>n/4);

const hitboxSize = sqSizeHalf;

module.exports = {sqSize, sqSizeHalf, sqSizeQuarter, hitboxSize};
