import _ from 'lodash';

import ShogiBoard from './ShogiBoard.mjs';
import ShogiPiece from './ShogiPiece.mjs';

export default class Shogi {
  constructor(board, capturedPieces, pieceMovement) {
    this.board = new ShogiBoard(board, capturedPieces);

    this.pieceMovement = pieceMovement || {
      P: [[0, -1]],
      L: _.range(1, this.board.height).map((y) => [0, -y]),
      N: [[-1, -2], [1, -2]],
      S: [[-1, -1], [0, -1], [1, -1], [-1, 1], [1, 1]],
      G: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [0, 1]],
      B: _.range(1, Math.min(this.board.width, this.board.height)).flatMap(
        (x) => [[-x, -x], [x, -x], [-x, x], [x, x]],
      ),
      R: [
        ..._.range(1, this.board.height).flatMap((y) => [[0, -y], [0, y]]),
        ..._.range(1, this.board.width).flatMap((x) => [[-x, 0], [x, 0]]),
      ],
      K: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
    };

    if (!pieceMovement) {
      ['P', 'L', 'N', 'S'].forEach((type) => {
        this.pieceMovement[`+${type}`] = this.pieceMovement.G;
      });

      this.pieceMovement['+B'] = [
        ...this.pieceMovement.B,
        [0, -1],
        [-1, 0],
        [1, 0],
        [0, 1],
      ];

      this.pieceMovement['+R'] = [
        ...this.pieceMovement.R,
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ];
    }
  }

  clone() {
    return new Shogi(this.board, undefined, this.pieceMovement);
  }

  canMove(fromX, fromY, toX, toY, pieceType = this.board[fromX][fromY].type) {
    if (
      !(
        toX >= 1 &&
        toX <= this.board.width &&
        toY >= 1 &&
        toY <= this.board.height
      )
    ) {
      return false;
    }

    const toPiece = this.board[toX][toY];

    const isDrop = !fromX || !fromY;

    if (isDrop) {
      if (toPiece) return false;

      if (
        pieceType === 'P' &&
        this.board[toX].some((piece) => piece && piece.equals('P'))
      ) {
        return false;
      }
    } else {
      if (toPiece && toPiece.isBlack()) return false;

      if (!this.isAttacked(fromX, fromY, toX, toY)) return false;
    }

    if ((pieceType === 'P' || pieceType === 'L') && toY === 1) return false;

    if (pieceType === 'N' && toY <= 2) return false;

    const moved = this.clone().move(fromX, fromY, toX, toY, pieceType);
    const reversed = moved.clone().reverse();

    if (reversed.isWin()) return false;

    if (
      isDrop &&
      pieceType === 'P' &&
      moved.isWin() &&
      !reversed.getMoves().length
    ) {
      return false;
    }

    return true;
  }

  isAttacked(fromX, fromY, toX, toY) {
    const fromPiece = this.board[fromX][fromY];

    if (
      !this.pieceMovement[fromPiece.type].some(
        ([dx, dy]) => toX === fromX + dx && toY === fromY + dy,
      )
    ) {
      return false;
    }

    if (
      ['L', 'B', 'R', '+B', '+R'].includes(fromPiece.type) &&
      _.zip(_.range(fromX, toX), _.range(fromY, toY))
        .slice(1)
        .some(([x, y]) => this.board[x || fromX][y || fromY])
    ) {
      return false;
    }

    return true;
  }

  move(fromX, fromY, toX, toY, pieceType) {
    if (!fromX || !fromY) {
      this.board[toX][toY] = new ShogiPiece(pieceType);
      this.board.capturedPieces[0][pieceType] -= 1;
    } else {
      const toPiece = this.board[toX][toY];

      if (toPiece) {
        const demotedType = toPiece.demote().type;

        this.board.capturedPieces[0][demotedType] =
          (this.board.capturedPieces[0][demotedType] || 0) + 1;
      }

      this.board[toX][toY] = this.board[fromX][fromY];
      this.board[fromX][fromY] = '';
    }

    return this;
  }

  reverse() {
    this.board.reverse();
    return this;
  }

  isWin() {
    const whiteKingPos = this.board.indexOf('k');

    return this.board.some(
      (piece, x, y) =>
        piece && piece.isBlack() && this.isAttacked(x, y, ...whiteKingPos),
    );
  }

  getMoves() {
    const moves = [];

    this.board.forEach((piece, x, y) => {
      if (!piece) {
        Object.entries(this.board.capturedPieces[0]).forEach(
          ([type, count]) => {
            if (!count) return;

            const move = [0, 0, x, y, type];

            if (this.canMove(...move)) {
              moves.push(move);
            }
          },
        );
      } else if (piece.isBlack()) {
        this.pieceMovement[piece.type].forEach(([dx, dy]) => {
          const toX = x + dx;
          const toY = y + dy;
          const move = [x, y, toX, toY];

          if (
            (toY <= this.board.height / 3 || y <= this.board.height / 3) &&
            !piece.isPromoted()
          ) {
            const promotedType = piece.promote().type;

            if (promotedType in this.pieceMovement) {
              const promotion = [...move, promotedType];

              if (this.canMove(...promotion)) {
                moves.push(promotion);
              }
            }
          }

          if (this.canMove(...move)) {
            moves.push([...move, piece.type]);
          }
        });
      }
    });

    return moves;
  }

  random() {
    const moves = this.getMoves();
    if (!moves.length) return undefined;
    return this.move(...moves[Math.floor(Math.random() * moves.length)]);
  }

  perft(depth) {
    if (!depth) return 1;

    return this.getMoves()
      .map((move) =>
        this.clone()
          .move(...move)
          .reverse()
          .perft(depth - 1),
      )
      .reduce((a, b) => a + b, 0);
  }

  toString() {
    return `${this.board}`;
  }
}
