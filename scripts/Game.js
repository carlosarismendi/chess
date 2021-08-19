class Game {
  constructor ({ selector, fen_string }) {
    this.boardSelector = selector
    this.board = new Board({ selector: selector })

    let gameInfo = this.board.initFromFENNotation(fen_string)
    this.colorToPlay = gameInfo.colorToPlay
    this.whiteCastle = gameInfo.whiteCastle
    this.blackCastle = gameInfo.blackCastle

    this.#addEventListenersToPieces()

    this.whiteTimer = new Timer({ selector: 'white-timer', minutes: 10 })
    this.whiteTimer.start()
    this.blackTimer = new Timer({ selector: 'black-timer', minutes: 10 })
  }

  restart () {
    this.board = new Board({ selector: this.boardSelector })

    let gameInfo = this.board.initFromFENNotation(INITIAL_POSITION_FEN)
    this.colorToPlay = gameInfo.colorToPlay
    this.whiteCastle = gameInfo.whiteCastle
    this.blackCastle = gameInfo.blackCastle

    this.#addEventListenersToPieces()

    this.whiteTimer.reset()
    this.blackTimer.reset()

    this.whiteTimer.start()
  }

  #addEventListenersToPieces () {
    for(let rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
      for(let file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
        let { idx, piece } = this.board.getPiece(file, rank)

        piece.element.setAttribute('draggable', 'true')
        piece.element.addEventListener('mousedown', this.#mousedown.bind(this, idx))
        piece.element.addEventListener('mouseup', this.#mouseup.bind(this, idx))
        piece.element.addEventListener('dragstart', this.#dragstart.bind(this, idx))
        piece.element.addEventListener('dragover', this.#dragover.bind(piece))
        piece.element.addEventListener('drop', this.#drop.bind(this, idx))
      }
    }
  }

  #mousedown (idxSrc, event) {
    this.#calcLegalMoves(idxSrc)
    this.#showLegalMoves(idxSrc)
  }

  #mouseup (idxSrc, event) {
    this.#hideLegalMoves(idxSrc)
  }

  #dragstart (idxSrc, event) {
    event.dataTransfer.setData('text/plain', idxSrc)
    event.dataTransfer.effectAllowed = 'move'
  }

  #dragover (event) {
    event.preventDefault();
  }

  #drop (idxDst, event) {
    event.preventDefault();
    let pieces = this.board.pieces

    // Target cell gets data from piece of source cell
    let idxSrc = parseInt( event.dataTransfer.getData('text/plain') )
    this.#hideLegalMoves(idxSrc)
    let pieceSrc = pieces[idxSrc]
    let pieceDst = pieces[idxDst]

    // Check that user is not dropping in the same cell
    if (pieceSrc.file === pieceDst.file && pieceSrc.rank === pieceDst.rank || pieceSrc.type === PIECES.EMPTY)
      return

    this.#move(pieceSrc, pieceDst, idxDst)
  }

  #move (pieceSrc, pieceDst, idxDst) {
    // Check if movement is valid
    if (!pieceSrc.legalMoves.includes(idxDst))
      return

    pieceSrc.firstMove = false
    pieceDst.firstMove = false

    // Removes piece from old cell
    pieceSrc.element.classList.remove(pieceSrc.cssClass)

    // Renders piece in new cell
    pieceDst.element.classList.remove(pieceDst.cssClass)
    pieceDst.cssClass = pieceSrc.cssClass
    pieceDst.element.classList.add(pieceDst.cssClass)

    // Sets reminding properties
    pieceDst.type = pieceSrc.type
    pieceSrc.type = PIECES.EMPTY
    pieceDst.color = pieceSrc.color
    pieceSrc.element.setAttribute('draggable', 'false')
    pieceDst.element.setAttribute('draggable', 'true')

    // Check if piece is a pawn that has reached promotion ranks
    if (pieceDst.rank === RANKS.RANK_8 && pieceDst.type === PIECES.WHITE_PAWN)
      this.#whitePawnPromotion(pieceDst)
    else if (pieceDst.rank === RANKS.RANK_1 && pieceDst.type === PIECES.BLACK_PAWN)
      this.#blackPawnPromotion(pieceDst)

    this.#updateTurn()
  }

  #calcLegalMoves (pieceIdx) {
    let pieces = this.board.pieces
    pieces[pieceIdx].legalMoves = []

    if (this.colorToPlay !== pieces[pieceIdx].color)
      return

    switch (pieces[pieceIdx].type) {
      case PIECES.WHITE_PAWN:
        this.#calcPawnMoves(pieceIdx, PIECE_OFFSETS.WHITE_PAWN)
        break

      case PIECES.BLACK_PAWN:
        this.#calcPawnMoves(pieceIdx, PIECE_OFFSETS.BLACK_PAWN)
        break

      case PIECES.WHITE_BISHOP:
      case PIECES.BLACK_BISHOP:
        this.#calcLongRangePieceMoves(pieceIdx, PIECE_OFFSETS.BISHOP)
        break

      case PIECES.WHITE_KNIGHT:
      case PIECES.BLACK_KNIGHT:
        this.#calcKnightMoves(pieceIdx, PIECE_OFFSETS.KNIGHT)
        break

      case PIECES.WHITE_ROOK:
      case PIECES.BLACK_ROOK:
        this.#calcLongRangePieceMoves(pieceIdx, PIECE_OFFSETS.ROOK)
        break

      case PIECES.WHITE_QUEEN:
      case PIECES.BLACK_QUEEN:
        this.#calcLongRangePieceMoves(pieceIdx, PIECE_OFFSETS.QUEEN)
        break

      case PIECES.WHITE_KING:
        this.#calcKingMoves(pieceIdx, PIECE_OFFSETS.KING)
        break

      case PIECES.BLACK_KING:
        break
    }
  }

  #calcPawnMoves (pieceIdx, offsets) {
    /**
     * CASES:
     * - Movement out of board (INVALID)
     * - Forward movement blocked by a piece (INVALID)
     * - Forward movement to empty cell (ALLOWED)
     * - Diagonal movement to empty cell (INVALID)
     * - Diagonal movement to kill enemy piece (ALLOWED)
     * - Pawn reaches edge rank of board (for white pawn -> RANK_8 | for black pawn -> RANK_1) (PROMOTION)
     */
    let pieces = this.board.pieces
    let pieceSrc = pieces[pieceIdx]

    offsets.forEach(off => {
      let move = off + pieceIdx
      let pieceDst = pieces[move]
      if (!this.#isInBoard(move)) return // out of board

      // forward move
      if (off % 10 === 0) {
        if (pieceDst.type !== PIECES.EMPTY) return // forward blocked
        pieceSrc.legalMoves.push(move)

        move += off
        pieceDst = pieces[move] // 2 steps forward

        if (pieceSrc.firstMove && pieceDst.type === PIECES.EMPTY && this.#isInBoard(move)) {
          pieceSrc.legalMoves.push(move)
        }
      } else {
        // Pawn kills enemy piece
        if (pieceDst.type === PIECES.EMPTY || pieceDst.color === pieceSrc.color) return
        pieceSrc.legalMoves.push(move)
      }
    })
  }

  #calcLongRangePieceMoves (pieceIdx, offsets) {
    let pieces = this.board.pieces
    let pieceSrc = pieces[pieceIdx]

    offsets.forEach(off => {
      let move = off + pieceIdx
      while (this.#isInBoard(move)) {
        let pieceDst = pieces[move]
        if (pieceDst.type === PIECES.EMPTY) {
          pieceSrc.legalMoves.push(move)
        } else {
          if (pieceDst.color !== pieceSrc.color) {
            pieceSrc.legalMoves.push(move)
          }
          break
        }

        move += off
      }
    })
  }

  #calcKingMoves (pieceIdx, offsets) {
    let pieces = this.board.pieces
    let pieceSrc = pieces[pieceIdx]

    offsets.forEach(off => {
      let move = off + pieceIdx
      if (!this.#isInBoard(move)) return
      // if('move' in check) return

      let pieceDst = pieces[move]
      if (pieceDst.type === PIECES.EMPTY || pieceDst.color !== pieceSrc.color) {
        pieceSrc.legalMoves.push(move)
      }
    })
  }

  #calcKnightMoves (pieceIdx, offsets) {
    let pieces = this.board.pieces
    let pieceSrc = pieces[pieceIdx]

    offsets.forEach(off => {
      let move = off + pieceIdx
      if (!this.#isInBoard(move)) return

      let pieceDst = pieces[move]
      if (pieceDst.type === PIECES.EMPTY || pieceDst.color !== pieceSrc.color) {
        pieceSrc.legalMoves.push(move)
      }
    })
  }

  async #showLegalMoves (pieceIdx) {
    let pieces = this.board.pieces
    pieces[pieceIdx].legalMoves.forEach(idx => {
      pieces[idx].element.classList.add('legal-move')
    });
  }

  async #hideLegalMoves (pieceIdx) {
    let pieces = this.board.pieces
    pieces[pieceIdx].legalMoves.forEach(idx => {
      pieces[idx].element.classList.remove('legal-move')
    });
  }

  #isInBoard (idx) {
    return (this.board.pieces[idx].type !== PIECES.OUT_OF_BOARD)
  }

  #whitePawnPromotion (piece) {
    piece.setType(PIECES.WHITE_QUEEN)
  }

  #blackPawnPromotion (piece) {
    piece.setType(PIECES.BLACK_QUEEN)
  }

  #updateTurn () {
    if (this.colorToPlay === COLORS.WHITE) {
      this.whiteTimer.pause()
      this.blackTimer.start()

      this.whiteTimer.element.classList.add('timer-stop')
      this.blackTimer.element.classList.remove('timer-stop')
      this.colorToPlay = COLORS.BLACK
    } else {
      this.whiteTimer.start()
      this.blackTimer.pause()

      this.whiteTimer.element.classList.remove('timer-stop')
      this.blackTimer.element.classList.add('timer-stop')
      this.colorToPlay = COLORS.WHITE
    }
  }
}