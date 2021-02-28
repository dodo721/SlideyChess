import React, { useRef, useEffect, useState } from 'react'
import { pointIntersectsRect, rectIntersectsRect } from './server/Collisions';
import { getPieceType, getPieceColour } from './server/Pieces';
import { sqSize, sqSizeHalf, sqSizeQuarter } from './server/Constants';
import { getPiecesInRange } from './server/Rules';
import { Hitbox, getPieceBoundingHitbox, getPieceHitboxes } from './server/Hitbox';
import Vector from './server/Vector';
import { Polygon, Rect } from './server/Polygon';

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

const ChessCanvas = ({chessData, playerColour, onPieceMove, ...props}) => {

    const canvasRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [dragPiece, setDragPiece] = useState(null);
    const [mousePos, setMousePos] = useState([0,0]);
    const [dragOffset, setDragOffset] = useState([0,0]);
    const [ctx, setCtx] = useState(null);
    const [lastTakeablePieces, setLastTakeablePieces] = useState([]);

    const displayTransformPos = pos => {
        if (playerColour === "w") return pos;
        if (!ctx) return null;
        let newPos = [
            ctx.canvas.width - pos[0] - sqSize[0],
            ctx.canvas.height - pos[1] - sqSize[1]
        ];
        return newPos;
    };

    const displayTransformHitbox = hb => {
        if (playerColour === "w") return hb;
        if (!ctx) return null;
        const hitbox = hb.data();
        let invertedPos = displayTransformPos([hitbox[0], hitbox[1]]);
        let newHitboxPos = [invertedPos[0] - hitbox[2] + sqSize[0], invertedPos[1] - hitbox[3] + sqSize[1]];
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
            newPoint[0] += sqSize[0];
            newPoint[1] += sqSize[1];
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
            return new Promise ((resolve, reject) => {
                resolve();
            });
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
        ctx.strokeStyle = colour;
        ctx.lineWidth = width;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(line.points[0][0], line.points[0][1]);
        ctx.lineTo(line.points[1][0], line.points[1][1]);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    const drawChessGrid = () => {
        const [sqWidth, sqHeight] = sqSize;
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
            const type = getPieceType(piece);
            await drawImage(chessPieceImages[type], pos, sqSize);
            const boundingBox = getPieceBoundingHitbox(pos).boundingBox();
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
        drawPolygon('#00ff00', displayTransformPolygon(poly), 0.3);
    }

    const clear = () => {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    };

    const onMouseMove = e => {
        if (dragging) {
            const [x,y] = [e.pageX - ctx.canvas.offsetLeft + dragOffset[0], e.pageY - ctx.canvas.offsetTop + dragOffset[1]];
            const [sqWidth, sqHeight] = sqSize;
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
            if (getPieceColour(pieces[i]) !== playerColour) continue;
            const pos = displayTransformPos(chessData[pieces[i]]);
            if (pointIntersectsRect([x,y], [...pos, ...sqSize])) {
                const drgOff = [pos[0] - x, pos[1] - y];
                setDragOffset(drgOff);
                setMousePos([x + drgOff[0],y + drgOff[1]]);
                setDragPiece(pieces[i]);
                setDragging(true);
                break;
            }
        }
    };

    const onMouseUp = () => {
        if (dragPiece) {
            // TODO: diagonal collisions from black perspective
            onPieceMove(dragPiece, displayTransformPos(mousePos));
            const inRange = getPiecesInRange(dragPiece, displayTransformPos(mousePos), chessData, true);
            //const tp = limitHitboxes(dragPiece, displayTransformPos(mousePos), inRange, chessData).hitPieces.filter(piece => getPieceColour(piece)!==playerColour);
            const hitboxes = getPieceHitboxes(getPieceType(dragPiece), mousePos);
            setLastTakeablePieces(inRange);
        }
        setDragPiece(null);
        setDragging(false);
    };

    const drawBoardFromChessData = async () => {
        clear();
        drawChessGrid();
        if (chessData) {
            const pieces = Object.keys(chessData);
            const myPieces = pieces.filter(piece => getPieceColour(piece)===playerColour);
            const theirPieces = pieces.filter(piece => getPieceColour(piece)!==playerColour);
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
                    drawChessPiece(dragPiece, mousePos);
                    //const inRange = getPiecesInRange(dragPiece, displayTransformPos(mousePos), chessData, true);
                    const hitboxes = getPieceHitboxes(getPieceType(dragPiece), displayTransformPos(mousePos));
                    hitboxes.forEach((hitbox) => {
                        drawHitbox(hitbox);
                    });
                }
            }
        }
        drawFunc();
    }, [ctx, chessData, mousePos, dragging]);

    return <canvas ref={canvasRef} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove} {...props} />
}

export default ChessCanvas;
