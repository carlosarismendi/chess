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
    for(let file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
      for(let rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
        let idx = this.board.fileAndRankToIdx(file, rank)
        let element = this.board.getElementByIdx(idx)

        element.setAttribute('draggable', 'true')
        element.addEventListener('mousedown', this.#mousedown.bind(this, file, rank))
        element.addEventListener('mouseup', this.#mouseup.bind(this, file, rank))
        element.addEventListener('dragstart', this.#dragstart.bind(this, file, rank))
        element.addEventListener('dragover', this.#dragover)
        element.addEventListener('drop', this.#drop.bind(this, file, rank))
      }
    }
  }

  #mousedown (fileSrc, rankSrc, event) {

    let { idx, piece } = this.board.getPiece(fileSrc, rankSrc)

    this.#calcLegalMoves(piece)
    this.#showLegalMoves(piece)
  }

  #mouseup (fileSrc, rankSrc, event) {
    let { idx, piece } = this.board.getPiece(fileSrc, rankSrc)

    this.#hideLegalMoves(piece)
  }

  #dragstart (fileSrc, rankSrc, event) {
    event.dataTransfer.setData('text/plain', JSON.stringify({ fileSrc: fileSrc, rankSrc: rankSrc }))
    event.dataTransfer.effectAllowed = 'move'
  }

  #dragover (event) {
    event.preventDefault();
  }

  #drop (fileDst, rankDst, event) {
    event.preventDefault();
    let pieces = this.board.pieces

    // Target cell gets data from piece of source cell
    let { fileSrc, rankSrc } = JSON.parse(event.dataTransfer.getData('text/plain'))
    let { idx: idxSrc, piece: pieceSrc }  = this.board.getPiece(fileSrc, rankSrc)
    let { idx: idxDst, piece: pieceDst } = this.board.getPiece(fileDst, rankDst)

    this.#hideLegalMoves(pieceSrc)

    // Check that user is not dropping in the same cell or trying to drag an empty cell
    if (!pieceSrc || pieceDst && (pieceSrc.file === pieceDst.file && pieceSrc.rank === pieceDst.rank || pieceSrc.type === PIECES.EMPTY))
      return

    this.#move(idxSrc, pieceSrc, idxDst, fileDst, rankDst, pieceDst)
  }

  #move (idxSrc, pieceSrc, idxDst, fileDst, rankDst, pieceDst) {

    // Check if movement is valid
    if (!pieceSrc.legalMoves.includes(idxDst))
      return

    this.board.removePiece(pieceDst)

    pieceSrc.firstMove = false
    pieceSrc.setCell(fileDst, rankDst)
    this.board.pieces[idxSrc] = PIECES.EMPTY
    this.board.pieces[idxDst] = pieceSrc.type | pieceSrc.color

    // Check if piece is a pawn that has reached promotion ranks
    if (pieceSrc.rank === RANKS.RANK_8 && pieceSrc.type === PIECES.PAWN && pieceSrc.color === COLORS.WHITE)
      this.#whitePawnPromotion(pieceSrc)
    else if (pieceSrc.rank === RANKS.RANK_1 && pieceSrc.type === PIECES.PAWN && pieceSrc.color === COLORS.BLACK)
      this.#blackPawnPromotion(pieceSrc)

    this.#updateTurn()
  }

  #calcLegalMoves (pieceSrc) {
    if (!pieceSrc) return

    pieceSrc.legalMoves = []

    if (this.colorToPlay !== pieceSrc.color)
      return

    switch (pieceSrc.type) {
      case PIECES.PAWN:
        if (pieceSrc.color === COLORS.WHITE)
          this.#calcPawnMoves(pieceSrc, PIECE_OFFSETS.WHITE_PAWN)
        else
          this.#calcPawnMoves(pieceSrc, PIECE_OFFSETS.BLACK_PAWN)
        break

      case PIECES.BISHOP:
        this.#calcLongRangePieceMoves(pieceSrc, PIECE_OFFSETS.BISHOP)
        break

      case PIECES.KNIGHT:
        this.#calcKnightMoves(pieceSrc, PIECE_OFFSETS.KNIGHT)
        break

      case PIECES.ROOK:
        this.#calcLongRangePieceMoves(pieceSrc, PIECE_OFFSETS.ROOK)
        break

      case PIECES.QUEEN:
        this.#calcLongRangePieceMoves(pieceSrc, PIECE_OFFSETS.QUEEN)
        break

      case PIECES.KING:
        this.#calcKingMoves(pieceSrc, PIECE_OFFSETS.KING)
        break
    }
  }

  #calcPawnMoves (pieceSrc, offsets) {
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
    let pieceIdx = this.board.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)

    offsets.forEach(off => {
      let move = off + pieceIdx
      let pieceDst = pieces[move]
      if (!this.#isInBoard(move)) return // out of board

      // forward move
      if (off % 10 === 0) {
        if (pieceDst !== PIECES.EMPTY) return // forward blocked
        pieceSrc.legalMoves.push(move)

        move += off
        pieceDst = pieces[move] // 2 steps forward

        if (pieceSrc.firstMove && pieceDst === PIECES.EMPTY && this.#isInBoard(move)) {
          pieceSrc.legalMoves.push(move)
        }
      } else {
        // Pawn kills enemy piece
        let pieceDstColor = pieceDst & COLORS.WHITE
        if (pieceDst === PIECES.EMPTY || pieceDstColor === pieceSrc.color) return
        pieceSrc.legalMoves.push(move)
      }
    })
  }

  #calcLongRangePieceMoves (pieceSrc, offsets) {
    let pieces = this.board.pieces
    let pieceIdx = this.board.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)

    offsets.forEach(off => {
      let move = off + pieceIdx
      while (this.#isInBoard(move)) {
        let pieceDst = pieces[move]
        if (pieceDst === PIECES.EMPTY) {
          pieceSrc.legalMoves.push(move)
        } else {
          let pieceDstColor = pieceDst & COLORS.WHITE
          if (pieceDstColor !== pieceSrc.color) {
            pieceSrc.legalMoves.push(move)
          }
          break
        }

        move += off
      }
    })
  }

  #calcKingMoves (pieceSrc, offsets) {
    let pieces = this.board.pieces
    let pieceIdx = this.board.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)

    offsets.forEach(off => {
      let move = off + pieceIdx
      if (!this.#isInBoard(move)) return
      // if('move' in check) return

      let pieceDst = pieces[move]
      let pieceDstColor = pieceDst & COLORS.WHITE
      if (pieceDst === PIECES.EMPTY || pieceDstColor !== pieceSrc.color) {
        pieceSrc.legalMoves.push(move)
      }
    })
  }

  #calcKnightMoves (pieceSrc, offsets) {
    let pieces = this.board.pieces
    let pieceIdx = this.board.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)

    offsets.forEach(off => {
      let move = off + pieceIdx
      if (!this.#isInBoard(move)) return

      let pieceDst = pieces[move]
      let pieceDstColor = pieceDst & COLORS.WHITE
      if (pieceDst === PIECES.EMPTY || pieceDstColor !== pieceSrc.color) {
        pieceSrc.legalMoves.push(move)
      }
    })
  }

  async #showLegalMoves (piece) {
    if (!piece) return

    piece.legalMoves.forEach(idx => {
      let element = this.board.getElementByIdx(idx)
      element.classList.add('legal-move')
    });
  }

  async #hideLegalMoves (piece) {
    if (!piece) return

    piece.legalMoves.forEach(idx => {
      let element = this.board.getElementByIdx(idx)
      element.classList.remove('legal-move')
    });
  }

  #isInBoard (idx) {
    return (this.board.pieces[idx] !== PIECES.OUT_OF_BOARD)
  }

  #whitePawnPromotion (piece) {
    piece.setType(PIECES.QUEEN)
  }

  #blackPawnPromotion (piece) {
    piece.setType(PIECES.QUEEN)
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