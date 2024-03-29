import React, { useRef, useEffect, useState } from 'react'
import Piece from './server/Pieces';
import Constants from './server/Constants';
import Hitbox from './server/Hitbox';
import Vector from './server/Vector';
import { Polygon, Rect } from './server/Polygon';
import { dist } from './server/MiscUtil';

const chessPieceImages = {
    "Kb": "/images/king_black.png",
    "Kw": "/images/king_white.png",
    "Qb": "/images/queen_black.png",
    "Qw": "/images/queen_white.png",
    "Bb": "/images/bishop_black.png",
    "Bw": "/images/bishop_white.png",
    "Nb": "/images/knight_black.png",
    "Nw": "/images/knight_white.png",
    "Rb": "/images/rook_black.png",
    "Rw": "/images/rook_white.png",
    "Pb": "/images/pawn_black.png",
    "Pw": "/images/pawn_white.png"
};

const imgCache = {};

const ChessCanvas = ({chessData, playerColour, onPieceMove, onPieceTake, ...props}) => {

    const canvasRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [dragPiece, setDragPiece] = useState(null);
    const [mousePos, setMousePos] = useState([0,0]);
    const [placementPos, setPlacementPos] = useState([0,0]);
    const [dragOffset, setDragOffset] = useState([0,0]);
    const [ctx, setCtx] = useState(null);
    const [lastTakeablePieces, setLastTakeablePieces] = useState([]);

    const displayTransformPos = pos => {
        if (playerColour === "w") return pos;
        if (!ctx) return null;
        let newPos = [
            ctx.canvas.width - pos[0] - Constants.sqSize[0],
            ctx.canvas.height - pos[1] - Constants.sqSize[1]
        ];
        return newPos;
    };

    const displayTransformHitbox = hb => {
        if (playerColour === "w") return hb;
        if (!ctx) return null;
        const hitbox = hb.data();
        let invertedPos = displayTransformPos([hitbox[0], hitbox[1]]);
        let newHitboxPos = [invertedPos[0] - hitbox[2] + Constants.sqSize[0], invertedPos[1] - hitbox[3] + Constants.sqSize[1]];
        let newHitbox = [
            newHitboxPos[0], newHitboxPos[1],
            hitbox[2], hitbox[3]
        ];
        return Hitbox.fromData(newHitbox);
    }

    const displayTransformPolygon = polygon => {
        if (playerColour === "w") return polygon;
        if (!ctx) return null;
        const newPoly = [];
        polygon.points.forEach(point => {
            const newPoint = displayTransformPos(point);
            newPoint[0] += Constants.sqSize[0];
            newPoint[1] += Constants.sqSize[1];
            newPoly.push(newPoint);
        });
        return new Polygon(newPoly);
    }

    const doImgDraw = (img, pos, size) => {
        let [x,y] = pos;
        if (size)
            ctx.drawImage(img, x, y, size[0], size[1]);
        else
            ctx.drawImage(img, x, y);
    };

    /**
     * Draw an image on the canvas
     * @param {String} imgSrc 
     * @param {Array} pos 
     * @param {?Array} size 
     */
    const drawImage = (imgSrc, pos, size) => {
        const x = pos[0] || 0;
        const y = pos[1] || 0;
        let img = imgCache[imgSrc];
        // If image is not cached, load it with a promise
        if (!img) {
            img = new Image();
            const drawPromise = new Promise((resolve, reject) => {
                img.onload = () => {
                    doImgDraw(img, [x,y], size);
                    imgCache[imgSrc] = img;
                    resolve();
                };
                img.onerror = () => {
                    reject("Image " + imgSrc + " failed to load!");
                };
                img.src = imgSrc;
            });
            return drawPromise;
        } else {
            doImgDraw(img, [x,y], size);
            return new Promise ((resolve, reject) => resolve());
        }
    };
    
    const drawSquare = (colour, pos, size, alpha=1) => {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = colour;
        ctx.fillRect(pos[0], pos[1], size[0], size[1]);
        ctx.globalAlpha = 1;
    };

    const drawRect = (colour, rect, alpha=1) => {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = colour;
        ctx.fillRect(rect.pos[0], rect.pos[1], rect.size[0], rect.size[1]);
        ctx.globalAlpha = 1;
    };

    const drawPolygon = (colour, polygon, alpha=1) => {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = colour;
        ctx.beginPath();
        const points = polygon.points;
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    /**
     * Draw a line
     * @param {Line} line 
     */
    const drawLine = (line, colour, width, alpha=1) => {
        const point1 = line.points[0];
        const point2 = line.points[1];
        ctx.strokeStyle = colour;
        ctx.lineWidth = width;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(point1[0], point1[1]);
        ctx.lineTo(point2[0], point2[1]);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    const drawChessGrid = () => {
        const [sqWidth, sqHeight] = Constants.sqSize;
        const white = '#F1D9B5';
        const black = '#B58863';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j ++) {
                drawSquare((i + j) % 2 === 0 ? white : black, [i * sqWidth, j * sqHeight], [sqWidth, sqHeight]);
            }
        }
    };

    const drawChessPiece = async (piece, pos) => {
        try {
            const type = Piece.getPieceType(piece);
            await drawImage(chessPieceImages[type], pos, Constants.sqSize);
            const boundingBox = Hitbox.getPieceBoundingHitbox(pos).boundingBox();
            if (dragging) {
                drawRect('#0000ff', boundingBox, 0.3);
            }
            if (lastTakeablePieces.includes(piece)) {
                drawRect('#ff0000', boundingBox, 0.3);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const drawHitbox = hitbox => {
        const poly = hitbox.polygon();
        drawPolygon('#00ff00', poly, 0.3);
    }

    const clear = () => {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    };

    const onMouseMove = e => {
        if (dragging) {
            const [x,y] = [e.pageX - ctx.canvas.offsetLeft + dragOffset[0], e.pageY - ctx.canvas.offsetTop + dragOffset[1]];
            const [sqWidth, sqHeight] = Constants.sqSize;
            // Deep copy position or react prevents mutation
            let newPos = mousePos.map(x=>x);
            if (x <= ctx.canvas.width - sqWidth && x >= 0) {
                newPos[0] = x;
            }
            if (y <= ctx.canvas.height - sqHeight && y >= 0) {
                newPos[1] = y;
            }
            setMousePos(newPos);
        }
    };

    const onMouseDown = e => {
        const [x,y] = [e.pageX - ctx.canvas.offsetLeft, e.pageY - ctx.canvas.offsetTop];
        const pieces = Object.keys(chessData);
        for (let i = 0; i < pieces.length; i++) {
            if (Piece.getPieceColour(pieces[i]) !== playerColour) continue;
            const pos = displayTransformPos(chessData[pieces[i]]);
            if (new Rect(pos, Constants.sqSize).containsPoint([x,y])) {
                const drgOff = [pos[0] - x, pos[1] - y];
                setDragOffset(drgOff);
                setMousePos([x + drgOff[0],y + drgOff[1]]);
                setDragPiece(pieces[i]);
                setDragging(true);
                const inRange = Hitbox.getPiecesInHitbox(pieces[i], displayTransformPos(pos), chessData);
                setLastTakeablePieces(inRange);
                break;
            }
        }
    };

    const onMouseUp = () => {
        if (dragPiece) {
            // TODO: diagonal collisions from black perspective
            //onPieceMove(dragPiece, displayTransformPos(mousePos));
            onPieceMove(dragPiece, displayTransformPos(placementPos));
            const intersectingPieces = Hitbox.getIntersectingPieces(dragPiece, displayTransformPos(placementPos), chessData);
            intersectingPieces.forEach(piece => {
                onPieceTake(piece);
            });
        }
        setDragPiece(null);
        setDragging(false);
        setLastTakeablePieces([]);
    };

    const drawBoardFromChessData = async () => {
        clear();
        drawChessGrid();
        if (chessData) {
            const pieces = Object.keys(chessData);
            const myPieces = pieces.filter(piece => Piece.getPieceColour(piece)===playerColour);
            const theirPieces = pieces.filter(piece => Piece.getPieceColour(piece)!==playerColour);
            theirPieces.forEach(piece => {
                if (!dragging || piece !== dragPiece)
                    drawChessPiece(piece, displayTransformPos(chessData[piece]));
            });
            myPieces.forEach(piece => {
                if (!dragging || piece !== dragPiece)
                    drawChessPiece(piece, displayTransformPos(chessData[piece]));
            });
        }
    };

    // The draw loop - updating only on dependencies
    useEffect(() => {
        const drawFunc = async () => {
            if (!ctx) {
                const canvas = canvasRef.current;
                const context= canvas.getContext('2d');
                setCtx(context);
            } else {
                drawBoardFromChessData();
                if (dragging) {
                    //const inRange = Hitbox.getPiecesInHitbox(dragPiece, displayTransformPos(mousePos), chessData, true);
                    //const {hitboxes, hitPieces} = Hitbox.limitHitboxes(dragPiece, mousePos, inRange, chessData);
                    const hitboxes = Hitbox.getPieceHitboxes(Piece.getPieceType(dragPiece), displayTransformPos(chessData[dragPiece]));
                    let closestProjectedPoint = null;
                    let closestDist = Infinity;
                    hitboxes.forEach((hitbox) => {
                        drawHitbox(hitbox);
                        const projectedPoint = hitbox.projectedPoint(mousePos, displayTransformPos(chessData[dragPiece]));
                        drawLine(hitbox.line(), '#0000ff', 3);
                        const distance = dist(mousePos, projectedPoint);
                        if (distance < closestDist) {
                            closestDist = distance;
                            closestProjectedPoint = projectedPoint;
                        }
                    });
                    setPlacementPos(closestProjectedPoint || mousePos);
                    drawChessPiece(dragPiece, placementPos);
                    drawSquare("#ff00ff", placementPos, [5,5]);
                }
            }
        }
        drawFunc();
    }, [ctx, chessData, mousePos, dragging]);

    return <canvas ref={canvasRef} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove} {...props} />
}

export default ChessCanvas;
