class Piece {
  type = null
  color = null
  firstMove = null
  legalMoves = null
  cssClass = null
  file = null
  rank = null
  element = null

  constructor ({ type, file, rank, color, idx }) {
    this.type = type
    this.color = color
    this.firstMove = true // only useful for pawns
    this.legalMoves = []

    this.cssClass = this.#typeToCSSClass(type)
    this.setCell(file, rank)

  }

  setType (newType) {
    this.type = newType
    this.element.classList.remove(this.cssClass)
    this.cssClass = this.#typeToCSSClass(this.type)
    this.element.classList.add(this.cssClass)
  }

  setCell(file, rank) {
    this.file = file
    this.rank = rank

    if (this.element && this.element.classList.contains(this.cssClass))
      this.element.classList.remove(this.cssClass)

    this.cellId = `cell-${String.fromCharCode(65 + file)}${rank+1}`
    this.element = document.querySelector(`#${this.cellId}`)

    this.element.classList.add(this.cssClass)
  }

  #typeToCSSClass (type) {
    if (this.color === null)
      return 'empty-space'

    if (this.color === COLORS.WHITE)
    {
      switch (type) {
        case PIECES.PAWN: return 'white-pawn'
        case PIECES.BISHOP: return 'white-bishop'
        case PIECES.KNIGHT: return 'white-knight'
        case PIECES.ROOK: return 'white-rook'
        case PIECES.KING: return 'white-king'
        case PIECES.QUEEN: return 'white-queen'
      }
    } else {
      switch (type) {
        case PIECES.PAWN: return 'black-pawn'
        case PIECES.BISHOP: return 'black-bishop'
        case PIECES.KNIGHT: return 'black-knight'
        case PIECES.ROOK: return 'black-rook'
        case PIECES.KING: return 'black-king'
        case PIECES.QUEEN: return 'black-queen'
      }
    }
  }
}