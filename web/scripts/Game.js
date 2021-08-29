class Game {
  constructor({ selector, fen_string }) {
    this.boardSelector = selector
    this.board = new Board({ selector: selector })

    let gameInfo = this.board.initFromFENNotation(fen_string)
    this.colorToPlay = gameInfo.colorToPlay
    this.isCheck = false
    this.cellsToProtect = []
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

    console.log("******************************************")
    this.searchForCheck()
    // rey bloquea a si mismo
  }

  /*
    Sets variables isCheck and cellsToProtect
  */
  searchForCheck() {
    let king = this.board.getKing(this.colorToPlay)
    let kingIdx = this.board.fileAndRankToIdx(king.file, king.rank)
    let enemyColor = this.colorToPlay ^ COLORS.WHITE
    let bullies = this.#bullyPiecesIdx(kingIdx, enemyColor)

    if (bullies.length != 0) {
      this.isCheck = true
      this.cellsToProtect = []

      console.log("King at " + kingIdx + " | Bullies at " + bullies)

      if (bullies.length > 1) { // cant be bloqued
        this.cellsToProtect = []
      }
      else {
        let bullyIdx = bullies[0]
        let bullyTypeColor = this.board.pieces[bullyIdx] // type | color
        let bullyColor = bullyTypeColor & COLORS.WHITE
        let bullyType = bullyTypeColor - bullyColor
        console.log("Bully type " + bullyTypeColor + " " + int2string(bullyTypeColor))

        if (bullyType === PIECES.KNIGHT) { // cant block knight, only kill him
          this.cellsToProtect = this.cellsToProtect.concat(bullyIdx)
        } else {
          this.cellsToProtect = this.cellsToProtect.concat(this.board.getMovesFromTo(kingIdx, bullyIdx, PIECE_OFFSETS.KING)) //path to block or kill
        }

      }

      // for (let idx of this.cellsToProtect) {
      // let piece = this.board.getPieceByIdx(kingIdx)
      // piece.element.style.backgroundColor = 'red'
      // }
    } else {
      this.isCheck = false
    }
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

    this.subtractIlegalMoves(pieceSrc)
  }

  /*
    In case of check, it filters the legal moves with the idxCells which permit to block the check
    Otherwise, it deletes moves that put the king in check:
    - King tries to move a not safe place
    - Ally piece unlock the path for a enemy piece
  */
  subtractIlegalMoves(pieceSrc) {
    let enemyColor = this.colorToPlay ^ COLORS.WHITE

    // let bullies = this.#bullyPiecesIdx(kingIdx, enemyColor)

    if (this.isCheck) {
      if (pieceSrc.type == PIECES.KING) {
        let pieceIdx = this.board.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)

        // safe places (not taking into account that king can block himself)
        pieceSrc.legalMoves = pieceSrc.legalMoves.filter(idx => this.#bullyPiecesIdx(idx, enemyColor).length == 0)
        // erase moves where king is between the move and bully
        pieceSrc.legalMoves = pieceSrc.legalMoves.filter(
          nextMove => {
            let off = this.getOffset(pieceIdx, nextMove) // direction where king is moving
            let bullies = this.#bullyPiecesIdx(pieceIdx, enemyColor)

            // if each bully doesnt have path to nextmove using our offset
            return bullies.every(bully => {
              let bullyOffsets = pieceOffsets(this.board.pieces[bully])
              if (bullyOffsets.includes(off)) {
                // if using the same offset it can find us
                return !this.board.getMovesFromTo(bully, nextMove, [off]).includes(pieceIdx)
              }
              else {
                return true // doesnt have the offset we use to move (scape)
              }
            })
            // return true
          }
        )
      }
      else {
        pieceSrc.legalMoves = pieceSrc.legalMoves.filter(idx => this.cellsToProtect.includes(idx)) //cells to block check or kill bully
      }
      console.log("IsCheck -> moves = " + pieceSrc.legalMoves)
    }
    else if (pieceSrc.type == PIECES.KING) {
      pieceSrc.legalMoves = pieceSrc.legalMoves.filter(idx => this.#bullyPiecesIdx(idx, enemyColor).length == 0) //safe places
    }
    else {

      let idxSrc = this.board.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)
      let king = this.board.getKing(pieceSrc.color)
      let idxKing = this.board.fileAndRankToIdx(king.file, king.rank)
      console.log("King at " + idxKing + " " + idxSrc)

      if (this.board.sameDiagonal(idxSrc, idxKing) || this.board.sameRowOrCol(idxSrc, idxKing)) {

        let off = this.getOffset(idxKing, idxSrc)
        console.log(off)

        // go from king to srcPiece, looking for a piece blocking the path
        let pathBlocked = false  // if a piece is blocking the path, srcPiece doesnt have to worry about king
        let move = off + idxKing
        for (; this.board.isInBoard(move); move += off) {
          if (move === idxSrc) break

          let cell = this.board.pieces[move]
          if (cell !== PIECES.EMPTY) { // found piece
            pathBlocked = true
            console.log("blocked at " + move + " " + (typeof move))
            break
          }
        }

        if (!pathBlocked) {
          // go from srcPiece using same offset, looking for an enemy
          for (let move = idxSrc + off; this.board.isInBoard(move); move += off) {

            let cell = this.board.pieces[move]
            if (cell !== PIECES.EMPTY) { // found piece
              let pieceDstColor = cell & COLORS.WHITE
              let pieceType = cell - pieceDstColor
              if (pieceDstColor !== pieceSrc.color && pieceType !== PIECES.KNIGHT) { // enemy color and not knight
                console.log("Encontre enemigo " + move)
                let path = this.board.getMovesFromTo(idxKing, move, [off])
                pieceSrc.legalMoves = pieceSrc.legalMoves.filter(idx => path.includes(idx))
                break;
              }
            }
          }
        }
      }

      console.log("NoCheck -> moves = " + pieceSrc.legalMoves)
    }
  }

  getOffset(src, dst) {
    let { file: srcFile, rank: srcRank } = this.board.idxToFileAndRank(src)
    let { file: dstFile, rank: dstRank } = this.board.idxToFileAndRank(dst)

    let offFile = abs(srcFile - dstFile)
    let offRank = abs(srcRank - dstRank)
    let off = dst - src  //offset from src to dst
    let dist = (offFile > offRank) ? offFile : offRank
    off = off / dist
    return off
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
      if (!this.board.isInBoard(move)) return // out of board

      // forward move
      if (off % 10 === 0) {
        if (pieceDst !== PIECES.EMPTY) return // forward blocked
        pieceSrc.legalMoves.push(move)

        move += off
        pieceDst = pieces[move] // 2 steps forward

        if (pieceSrc.firstMove && pieceDst === PIECES.EMPTY && this.board.isInBoard(move)) {
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
      while (this.board.isInBoard(move)) {
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
    Returns if a specific type of piece is making check to some cell
  */
  #checksWith(idxCell, colorToAtack, typeSearch, offsets) {
    let pieces = this.board.pieces
    let checks = [] // idx of pieces making check

    offsets.forEach(off => {
      let moveIdx = off + idxCell
      while (this.board.isInBoard(moveIdx)) {
        let pieceDst = pieces[moveIdx]
        if (pieceDst !== PIECES.EMPTY) { // there is a piece
          let pieceDstColor = pieceDst & COLORS.WHITE
          let pieceType = pieceDst ^ pieceDstColor
          if (pieceDstColor === colorToAtack && pieceType === typeSearch) { // enemy colour
            checks.push(moveIdx)
          }
          break // next offset
        }
        moveIdx += off
      }
    })
    return checks
  }

  #checksWithOneMove(idxCell, colorToAtack, typeSearch, offsets) {
    let pieces = this.board.pieces
    let checks = [] // idx of pieces making check

    offsets.forEach(off => {
      let moveIdx = off + idxCell
      if (!this.board.isInBoard(moveIdx)) return

      let pieceDst = pieces[moveIdx]
      if (pieceDst !== PIECES.EMPTY) { // there is a piece
        let pieceDstColor = pieceDst & COLORS.WHITE
        let pieceType = pieceDst ^ pieceDstColor
        if (pieceDstColor === colorToAtack && pieceType === typeSearch) { // enemy colour
          checks.push(moveIdx)
        }
      }
      moveIdx += off
    })
    return checks
  }

  /*
    Returns idx of enemy pieces (#colorToAtack) which atacks #idxCell
  */
  #bullyPiecesIdx(idxCell, colorToAtack) {
    let checks = []
    if (colorToAtack === COLORS.BLACK) {
      checks = checks.concat(this.#checksWithOneMove(idxCell, colorToAtack, PIECES.BLACK_PAWN, PIECE_OFFSETS.BLACK_PAWN))
    } else {
      checks = checks.concat(this.#checksWithOneMove(idxCell, colorToAtack, PIECES.WHITE_PAWN, PIECE_OFFSETS.WHITE_PAWN))
    }
    checks = checks.concat(this.#checksWithOneMove(idxCell, colorToAtack, PIECES.KNIGHT, PIECE_OFFSETS.KNIGHT))
    checks = checks.concat(this.#checksWithOneMove(idxCell, colorToAtack, PIECES.KING, PIECE_OFFSETS.KING))
    checks = checks.concat(this.#checksWith(idxCell, colorToAtack, PIECES.BISHOP, PIECE_OFFSETS.BISHOP))
    checks = checks.concat(this.#checksWith(idxCell, colorToAtack, PIECES.ROOK, PIECE_OFFSETS.ROOK))
    checks = checks.concat(this.#checksWith(idxCell, colorToAtack, PIECES.QUEEN, PIECE_OFFSETS.QUEEN))

    return checks
  }


  #calcKingMoves(pieceSrc, offsets) {
    let pieces = this.board.pieces
    let pieceIdx = this.board.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)

    offsets.forEach(off => {
      let move = off + pieceIdx
      if (!this.board.isInBoard(move)) return
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
      if (!this.board.isInBoard(move)) return

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