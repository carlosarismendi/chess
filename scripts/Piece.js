const PIECES = {
  OUT_OF_BOARD: -1,
  EMPTY: 0,
  WHITE_PAWN: 1,
  WHITE_BISHOP: 2,
  WHITE_KNIGHT: 3,
  WHITE_ROOK: 4,
  WHITE_KING: 5,
  WHITE_QUEEN: 6,
  BLACK_PAWN: 7,
  BLACK_BISHOP: 8,
  BLACK_KNIGHT: 9,
  BLACK_ROOK: 10,
  BLACK_KING: 11,
  BLACK_QUEEN: 12
}

// LOOKING BOARD WITH WHITE BELOW
const PIECE_OFFSETS = {
  WHITE_PAWN: [9, 10, 11], // up-left, up, up-right
  BLACK_PAWN: [-9, -10, -11], // down-right, down, down-left
  BISHOP: [9, -9, 11, -11], // up-left, down-right, up-right, down-left
  KNIGHT: [8, 19, 21, 12, -8, -19, -21, -12],
  ROOK: [-1, 10, 1, -10], // left, up, right, down
  KING: [-1, 9, 10, 11, 1, -9, -10, -11], // left, up-left, up, up-right, right, down-right, down, down-ñeft
  QUEEN: [-1, 9, 10, 11, 1, -9, -10, -11] // left, up-left, up, up-right, right, down-right, down, down-ñeft
}


class Piece {
  constructor ({ type, file, rank, color }) {
    this.cellId = `cell-${String.fromCharCode(65 + file)}${rank+1}`

    this.element = document.querySelector(`#${this.cellId}`)
    this.cssClass = this.#typeToCSSClass(type)
    this.element.classList.add(this.cssClass)

    this.type = type
    this.file = file
    this.rank = rank
    this.color = color
    this.firstMove = true // only useful for pawns
    this.legalMoves = []
  }

  setType (newType) {
    this.type = newType
    this.element.classList.remove(this.cssClass)
    this.cssClass = this.#typeToCSSClass(this.type)
    this.element.classList.add(this.cssClass)
  }

  #typeToCSSClass (type) {
    switch (type) {
      case PIECES.EMPTY: return 'empty-space'

      case PIECES.WHITE_PAWN: return 'white-pawn'
      case PIECES.WHITE_BISHOP: return 'white-bishop'
      case PIECES.WHITE_KNIGHT: return 'white-knight'
      case PIECES.WHITE_ROOK: return 'white-rook'
      case PIECES.WHITE_KING: return 'white-king'
      case PIECES.WHITE_QUEEN: return 'white-queen'

      case PIECES.BLACK_PAWN: return 'black-pawn'
      case PIECES.BLACK_BISHOP: return 'black-bishop'
      case PIECES.BLACK_KNIGHT: return 'black-knight'
      case PIECES.BLACK_ROOK: return 'black-rook'
      case PIECES.BLACK_KING: return 'black-king'
      case PIECES.BLACK_QUEEN: return 'black-queen'
    }
  }
}