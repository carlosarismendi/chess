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