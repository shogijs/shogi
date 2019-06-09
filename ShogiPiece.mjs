export default class ShogiPiece {
  constructor(type, color) {
    this.type = type.toUpperCase();
    this.color = color != null ? color : type !== this.type;
  }

  isBlack() {
    return !this.color;
  }

  isWhite() {
    return this.color;
  }

  isPromoted() {
    return this.type.startsWith('+');
  }

  promote() {
    return new ShogiPiece(`+${this}`);
  }

  demote() {
    return new ShogiPiece(`${this}`.replace(/^\+/, ''));
  }

  reverse() {
    this.color = !this.color;
    return this;
  }

  equals(that) {
    if (!(that instanceof ShogiPiece)) return this.equals(new ShogiPiece(that));

    return this.type === that.type && this.color === that.color;
  }

  toString() {
    return this.isBlack() ? this.type : this.type.toLowerCase();
  }
}

ShogiPiece.PIECE_NAMES_JA = {
  P: '歩',
  L: '香',
  N: '桂',
  S: '銀',
  G: '金',
  B: '角',
  R: '飛',
  K: '玉',
  '+P': 'と',
  '+L': '杏',
  '+N': '圭',
  '+S': '全',
  '+B': '馬',
  '+R': '龍',
};
