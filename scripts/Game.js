class Game {
  constructor({ selector, fen_string }) {
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

  restart() {
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

  #addEventListenersToPieces() {
    for (let file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
      for (let rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
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

  #mousedown(fileSrc, rankSrc, event) {

    let { idx, piece } = this.board.getPiece(fileSrc, rankSrc)

    this.#calcLegalMoves(piece)
    this.#showLegalMoves(piece)
  }

  #mouseup(fileSrc, rankSrc, event) {
    let { idx, piece } = this.board.getPiece(fileSrc, rankSrc)

    this.#hideLegalMoves(piece)
  }

  #dragstart(fileSrc, rankSrc, event) {
    event.dataTransfer.setData('text/plain', JSON.stringify({ fileSrc: fileSrc, rankSrc: rankSrc }))
    event.dataTransfer.effectAllowed = 'move'
  }

  #dragover(event) {
    event.preventDefault();
  }

  #drop(fileDst, rankDst, event) {
    event.preventDefault();
    let pieces = this.board.pieces

    // Target cell gets data from piece of source cell
    let { fileSrc, rankSrc } = JSON.parse(event.dataTransfer.getData('text/plain'))
    let { idx: idxSrc, piece: pieceSrc } = this.board.getPiece(fileSrc, rankSrc)
    let { idx: idxDst, piece: pieceDst } = this.board.getPiece(fileDst, rankDst)

    this.#hideLegalMoves(pieceSrc)

    // Check that user is not dropping in the same cell or trying to drag an empty cell
    if (!pieceSrc || pieceDst && (pieceSrc.file === pieceDst.file && pieceSrc.rank === pieceDst.rank || pieceSrc.type === PIECES.EMPTY))
      return

    this.#move(idxSrc, pieceSrc, idxDst, fileDst, rankDst, pieceDst)
  }

  #move(idxSrc, pieceSrc, idxDst, fileDst, rankDst, pieceDst) {

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

    let enemyColor = (pieceSrc.color === COLORS.WHITE) ? COLORS.BLACK : COLORS.WHITE
    console.log("enemy color", enemyColor)
    let king = this.board.getKing(enemyColor)
    let bullies = this.#bullyPiecesIdx(king)

    if (bullies.length != 0) {
      console.log("Bully at " + bullies)
      let cellsToProtect = []

      for (let bullyIdx of bullies) {

        let kingIdx = this.board.fileAndRankToIdx(king.file, king.rank)
        // let bullyPiece = this.board.getPieceByIdx(bullies[0])

        if (bullies[0] == (PIECES.KNIGHT | enemyColor)) {
          cellsToProtect.push( this.getMovesFromTo(kingIdx, bullyIdx, PIECE_OFFSETS.KNIGHT))
        } else {
          cellsToProtect.push(this.getMovesFromTo(kingIdx, bullyIdx, PIECE_OFFSETS.KING))
        }
        //TODO
        /*
        - guardar global de ifcheck
        - guardar en global posiciones a defender en check
        - cuando una pieza calcule sus movimientos disponibles, coger solo los comunes con los que hay que defender
        - en caso de querer mover el rey, comprobar que el siguiente estado no sea check

        */
      }
      console.log("Cells to block check " + cellsToProtect)

      // for (let idx of cellsToProtect) {
        // let piece = this.board.getPieceByIdx(kingIdx)
        // piece.element.style.backgroundColor = 'red'
      // }
    }

  }

  getMovesFromTo(idxSrc, idxDst, offsets) {
    let moves = []
    for (let off of offsets) {
      let move = off + idxSrc
      moves = []
      while (this.#isInBoard(move)) {
        moves.push(move)
        if (move === idxDst) return moves
        move += off
      }
    }
    return moves
  }

  #calcLegalMoves(pieceSrc) {
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

  #calcPawnMoves(pieceSrc, offsets) {
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

  #calcLongRangePieceMoves(pieceSrc, offsets) {
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

  /*
    Returns if a specific type of piece is making check to the king
  */
  #checksWith(king, typeSearch, offsets) {
    let pieces = this.board.pieces
    let pieceIdx = this.board.fileAndRankToIdx(king.file, king.rank)
    let checks = [] // idx of pieces making check

    offsets.forEach(off => {
      let moveIdx = off + pieceIdx
      while (this.#isInBoard(moveIdx)) {
        let pieceDst = pieces[moveIdx]
        if (pieceDst !== PIECES.EMPTY) { // there is a piece
          let pieceDstColor = pieceDst & COLORS.WHITE
          let pieceType = pieceDst ^ pieceDstColor
          if (pieceDstColor !== king.color && pieceType === typeSearch) { // enemy colour
            checks.push(moveIdx)
          }
          break // next offset
        }
        moveIdx += off
      }
    })
    return checks
  }

  #checksWithOneMove(king, typeSearch, offsets) {
    let pieces = this.board.pieces
    let pieceIdx = this.board.fileAndRankToIdx(king.file, king.rank)
    let checks = [] // idx of pieces making check

    offsets.forEach(off => {
      let moveIdx = off + pieceIdx
      if (!this.#isInBoard(moveIdx)) return

      let pieceDst = pieces[moveIdx]
      if (pieceDst !== PIECES.EMPTY) { // there is a piece
        let pieceDstColor = pieceDst & COLORS.WHITE
        let pieceType = pieceDst ^ pieceDstColor
        if (pieceDstColor !== king.color && pieceType === typeSearch) { // enemy colour
          checks.push(moveIdx)
        }
      }
      moveIdx += off
    })
    return checks
  }

  #bullyPiecesIdx(king) {
    let checks = []
    if (king.color === COLORS.WHITE) {
      checks.concat(this.#checksWithOneMove(king, PIECES.BLACK_PAWN, PIECE_OFFSETS.BLACK_PAWN))
    } else {
      checks.concat(this.#checksWithOneMove(king, PIECES.WHITE_PAWN, PIECE_OFFSETS.WHITE_PAWN))
    }
    checks = checks.concat(this.#checksWith(king, PIECES.BISHOP, PIECE_OFFSETS.BISHOP))
    checks = checks.concat(this.#checksWithOneMove(king, PIECES.KNIGHT, PIECE_OFFSETS.KNIGHT))
    checks = checks.concat(this.#checksWith(king, PIECES.ROOK, PIECE_OFFSETS.ROOK))
    checks = checks.concat(this.#checksWithOneMove(king, PIECES.KING, PIECE_OFFSETS.KING))
    checks = checks.concat(this.#checksWith(king, PIECES.QUEEN, PIECE_OFFSETS.QUEEN))

    return checks
  }


  #calcKingMoves(pieceSrc, offsets) {
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

  #calcKnightMoves(pieceSrc, offsets) {
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

  async #showLegalMoves(piece) {
    if (!piece) return

    piece.legalMoves.forEach(idx => {
      let element = this.board.getElementByIdx(idx)
      element.classList.add('legal-move')
    });
  }

  async #hideLegalMoves(piece) {
    if (!piece) return

    piece.legalMoves.forEach(idx => {
      let element = this.board.getElementByIdx(idx)
      element.classList.remove('legal-move')
    });
  }

  #isInBoard(idx) {
    return (this.board.pieces[idx] !== PIECES.OUT_OF_BOARD)
  }

  #whitePawnPromotion(piece) {
    piece.setType(PIECES.QUEEN)
  }

  #blackPawnPromotion(piece) {
    piece.setType(PIECES.QUEEN)
  }

  #updateTurn() {
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