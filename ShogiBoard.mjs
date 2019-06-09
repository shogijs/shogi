import _ from 'lodash';

import ShogiPiece from './ShogiPiece.mjs';

export default class ShogiBoard {
  constructor(
    board = [
      ['l', 'n', 's', 'g', 'k', 'g', 's', 'n', 'l'],
      [' ', 'r', ' ', ' ', ' ', ' ', ' ', 'b', ' '],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      [' ', 'B', ' ', ' ', ' ', ' ', ' ', 'R', ' '],
      ['L', 'N', 'S', 'G', 'K', 'G', 'S', 'N', 'L'],
    ],
    capturedPieces = [{}, {}],
  ) {
    if (board instanceof ShogiBoard) {
      this.rows = _.cloneDeep(board.rows);
      this.width = board.width;
      this.height = board.height;
      this.capturedPieces = _.cloneDeep(board.capturedPieces);
    } else {
      this.rows = board.map((row) =>
        row.map((piece) => piece && piece.trim() && new ShogiPiece(piece)),
      );

      this.width = board[0].length;
      this.height = board.length;

      this.capturedPieces = capturedPieces;
    }

    const ToUint32 = (x) => String(x) >>> 0;

    const isArrayIndex = (p) =>
      String(ToUint32(p)) === p && ToUint32(p) !== 0xffffffff;

    return new Proxy(this, {
      get: (...[, x]) => {
        if (!isArrayIndex(x)) return this[x];

        const column = {
          get: (...[, y]) => {
            if (!isArrayIndex(y)) return column[y];

            return this.rows[y - 1][this.width - x];
          },
          set: (...[, y, piece]) => {
            if (!isArrayIndex(y)) {
              column[y] = piece;
            } else {
              this.rows[y - 1][this.width - x] = piece;
            }

            return this;
          },
          some: (callback) =>
            this.rows.some((row, y) => callback(row[this.width - x], y + 1)),
        };

        return new Proxy(column, column);
      },
    });
  }

  forEach(callback) {
    this.rows[0].forEach((...[, x]) => {
      this.rows.forEach((row, y) => {
        callback(row[this.width - x - 1], x + 1, y + 1);
      });
    });

    return this;
  }

  some(callback) {
    return this.rows[0].some((...[, x]) =>
      this.rows.some((row, y) =>
        callback(row[this.width - x - 1], x + 1, y + 1),
      ),
    );
  }

  indexOf(pieceToFind) {
    let pos;

    return this.some((piece, x, y) => {
      pos = [x, y];
      return piece && piece.equals(pieceToFind);
    })
      ? pos
      : -1;
  }

  reverse() {
    this.rows
      .reverse()
      .forEach((row) =>
        row.reverse().forEach((piece) => piece && piece.reverse()),
      );

    this.capturedPieces.reverse();

    return this;
  }

  toString() {
    const numeralsJa = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

    const capturedPiecesToString = (capturedPieces) =>
      `${`${Object.entries(capturedPieces)
        .filter(([, count]) => count)
        .map(
          ([type, count]) =>
            `${ShogiPiece.PIECE_NAMES_JA[type]}${
              count >= 2 ? numeralsJa[count - 1] : ''
            }`,
        )
        .join('\u3000')}` || 'なし'}\u3000`;

    return `後手の持駒：${capturedPiecesToString(this.capturedPieces[1])}
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
${this.rows
  .map(
    (row, x) =>
      `|${row
        .map(
          (piece) =>
            `${piece && piece.isWhite() ? 'v' : ' '}${
              piece ? ShogiPiece.PIECE_NAMES_JA[piece.type] : '・'
            }`,
        )
        .join('')}|${numeralsJa[x]}`,
  )
  .join('\n')}
+---------------------------+
先手の持駒：${capturedPiecesToString(this.capturedPieces[0])}`;
  }
}
