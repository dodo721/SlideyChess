import React, { useRef, useEffect, useState } from 'react'
import { pointIntersectsRect, rectIntersectsRect } from './server/RectCollisions';
import { PIECE_HITBOXES } from './server/Rules';

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
    const [sqSize, setSqSize] = useState([0,0]);
    const [ctx, setCtx] = useState(null);

    const sqSizeHalf = sqSize.map(n=>n/2);
    const sqSizeQuarter = sqSize.map(n=>n/4);

    const getPiecePos = pos => {
        if (playerColour === "w") return pos;
        if (!ctx) return null;
        let newPos = [
            ctx.canvas.width - pos[0] - sqSize[0],
            ctx.canvas.height - pos[1] - sqSize[1]
        ];
        return newPos;
    };

    const getPieceBoundingBox = pos => {
        return [
            pos[0] + sqSizeQuarter[0],
            pos[1] + sqSizeQuarter[1],
            ...sqSizeHalf
        ];
    };

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
            const type = piece.substr(0, 1) + piece.substr(2);
            await drawImage(chessPieceImages[type], pos, sqSize);
            if (dragging) {
                const boundingBox = getPieceBoundingBox(pos);
                drawSquare('#0000ff', [boundingBox[0], boundingBox[1]], [boundingBox[2], boundingBox[3]], 0.3);
            }
        } catch (e) {
            console.error(e);
        }
    };

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
            if (pieces[i].substr(2) !== playerColour) continue;
            const pos = getPiecePos(chessData[pieces[i]]);
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
            onPieceMove(dragPiece, getPiecePos(mousePos));
            Object.keys(chessData).forEach(piece => {
                if (piece === dragPiece) return;
                if (rectIntersectsRect(getPieceBoundingBox(chessData[piece]), getPieceBoundingBox(getPiecePos(mousePos)))) {
                    alert("INTERSECTS " + piece + "!!");
                }
            });
        }
        setDragPiece(null);
        setDragging(false);
    };

    const drawBoardFromChessData = async () => {
        clear();
        drawChessGrid();
        if (chessData) {
            Object.keys(chessData).forEach(piece => {
                if (!dragging || piece !== dragPiece)
                    drawChessPiece(piece, getPiecePos(chessData[piece]));
            });
        }
    };

    useEffect(() => {
        const drawFunc = async () => {
            if (!ctx) {
                const canvas = canvasRef.current;
                const context= canvas.getContext('2d');
                setCtx(context);
                const sqWidth = canvas.width / 8;
                const sqHeight = canvas.height / 8;
                setSqSize([sqWidth, sqHeight]);
            } else {
                drawBoardFromChessData(); 
                if (dragging) drawChessPiece(dragPiece, mousePos);
            }
        }
        drawFunc();
    }, [ctx, chessData, mousePos, dragging]);

    return <canvas ref={canvasRef} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove} {...props} />
}

export default ChessCanvas;