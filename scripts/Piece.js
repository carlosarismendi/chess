const PIECES = {
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


class Piece {
  constructor ({ type, file, rank, color }) {
    this.cellId = `cell-${String.fromCharCode(65 + file)}${rank+1}`

    this.element = document.querySelector(`#${this.cellId}`)
    this.cssClass = this.#typeToCSSClass(type)
    this.element.classList.add(this.cssClass)
    this.element.setAttribute('draggable', 'true')
    this.element.addEventListener('dragstart', this.#drag.bind(this))
    this.element.addEventListener('dragover', this.#allowDrop.bind(this))
    this.element.addEventListener('drop', this.#drop.bind(this))


    this.type = type
    this.file = file
    this.rank = rank
    this.color = color
  }

  #drag (event) {
    event.dataTransfer.setData('text/plain', JSON.stringify(this))
    event.dataTransfer.effectAllowed = 'move'
  }

  #allowDrop (event) {
    event.preventDefault();
  }

  #drop (event) {
    event.preventDefault();

    // Target cell gets data from piece of source cell
    let piece = event.dataTransfer.getData('text/plain');
    piece = JSON.parse(piece)
    piece.element = document.getElementById(piece.cellId)

    // Check that user is not dropping in the same cell
    if (piece.file === this.file && piece.rank === this.rank)
      return

    // TODO: CHECK IF MOVEMENT IS VALID

    // Removes piece from old cell
    piece.element.classList.remove(piece.cssClass)

    // Renders piece in new cell
    this.element.classList.remove(this.cssClass)
    this.cssClass = piece.cssClass
    this.element.classList.add(this.cssClass)

    // Sets reminding properties
    this.type = piece.type
    piece.type = PIECES.EMPTY
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