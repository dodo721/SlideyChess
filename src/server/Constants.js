
class Constants {

}

Constants.sqSize = [500/8, 500/8];
Constants.sqSizeHalf = Constants.sqSize.map(n=>n/2);
Constants.sqSizeQuarter = Constants.sqSize.map(n=>n/4);

Constants.hitboxSize = Constants.sqSizeHalf;

module.exports = Constants;
