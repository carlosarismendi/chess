class Board {
  #element = null
  whitePieces = null
  blackPieces = null
  pieces = null

  constructor({ selector, colorDown }) {
    this.#element = document.querySelector(selector)
    this.#drawBoard(colorDown)
    this.whitePieces = []
    this.blackPieces = []
    this.pieces = []
  }

  /*
    Returns {idx, price} of a coordinate
  */
  getPiece(file, rank) {
    let idx = this.fileAndRankToIdx(file, rank)
    return this.getPieceByIdx(idx)
  }

  getPieceByIdx(idx) {
    let pieceType = this.pieces[idx]
    let piece = null

    if (pieceType === PIECES.EMPTY) return { idx: idx, piece: piece }

    let pieceColor = pieceType & COLORS.WHITE
    let { file, rank } = this.idxToFileAndRank(idx)
    let piecesArray = (pieceColor === COLORS.WHITE) ? this.whitePieces : this.blackPieces

    for (let i = 0; i < piecesArray.length; ++i) {

      if (piecesArray[i].file === file && piecesArray[i].rank === rank) {
        piece = piecesArray[i]
        break
      }
    }

    return { idx: idx, piece: piece }
  }

  whiteKing() {
    for (let i = 0; i < this.whitePieces.length; ++i) {

      if (this.whitePieces[i].type === PIECES.KING) {
        return this.whitePieces[i]
      }
    }
  }

  blackKing() {
    for (let i = 0; i < this.blackPieces.length; ++i) {

      if (this.blackPieces[i].type === PIECES.KING) {
        return this.blackPieces[i]
      }
    }
  }

  getKing(colour) {
    if (colour === COLORS.WHITE) {
      return this.whiteKing()
    }
    return this.blackKing()
  }

  #drawBoard(colorDown) {
    this.#element.innerHTML = ''

    if (colorDown === COLORS.WHITE) {
      for (let rank = RANKS.RANK_8; rank >= RANKS.RANK_1; --rank) {
        for (let file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
          const cell = this.#createCell(file, rank)
          this.#element.innerHTML += cell
        }

        this.#element.innerHTML += '\n'
      }
    } else {
      for (let rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
        for (let file = FILES.FILE_H; file >= FILES.FILE_A; --file) {
          const cell = this.#createCell(file, rank)
          this.#element.innerHTML += cell
        }

        this.#element.innerHTML += '\n'
      }
    }
  }

  #createCell(file, rank) {
    const cell_id = `cell-${String.fromCharCode(65 + file)}${rank + 1}`
    const cell_class = (file + rank) & 1 ? 'board-cell white' : 'board-cell black'
    const cell = `<div id="${cell_id}" class="${cell_class}">${this.fileAndRankToIdx(file, rank)}</div>\n`

    return cell
  }

  initFromFENNotation(fen_string) {
    let gameInfo = {
      colorToPlay: null,
      whiteCastle: null,
      blackCastle: null
    }

    this.pieces = new Array(120)
    let rank = 0;
    let file = 0;
    for (let i = 0; i < this.pieces.length; ++i)
      this.pieces[i] = PIECES.OUT_OF_BOARD

    let stridx = 0
    for (let rank = RANKS.RANK_8; rank >= RANKS.RANK_1; --rank) {
      for (let file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
        const idx = this.fileAndRankToIdx(file, rank)

        let blanks = parseInt(fen_string[stridx])
        if (!Number.isNaN(blanks)) {
          while (blanks > 0) {
            const idx = this.fileAndRankToIdx(file, rank)
            this.pieces[idx] = PIECES.EMPTY

            ++file
            --blanks
          }
          --file
          ++stridx;
          continue
        }

        switch (fen_string[stridx]) {
          case 'p':
            this.pieces[idx] = PIECES.PAWN | COLORS.BLACK
            this.blackPieces.push(new Piece({ type: PIECES.PAWN, file: file, rank: rank, color: COLORS.BLACK }))
            break

          case 'P':
            this.pieces[idx] = PIECES.PAWN | COLORS.WHITE
            this.whitePieces.push(new Piece({ type: PIECES.PAWN, file: file, rank: rank, color: COLORS.WHITE }))
            break

          case 'r':
            this.pieces[idx] = PIECES.ROOK | COLORS.BLACK
            this.blackPieces.push(new Piece({ type: PIECES.ROOK, file: file, rank: rank, color: COLORS.BLACK }))
            break

          case 'R':
            this.pieces[idx] = PIECES.ROOK | COLORS.WHITE
            this.whitePieces.push(new Piece({ type: PIECES.ROOK, file: file, rank: rank, color: COLORS.WHITE }))
            break

          case 'n':
            this.pieces[idx] = PIECES.KNIGHT | COLORS.BLACK
            this.blackPieces.push(new Piece({ type: PIECES.KNIGHT, file: file, rank: rank, color: COLORS.BLACK }))
            break

          case 'N':
            this.pieces[idx] = PIECES.KNIGHT | COLORS.WHITE
            this.whitePieces.push(new Piece({ type: PIECES.KNIGHT, file: file, rank: rank, color: COLORS.WHITE }))
            break

          case 'b':
            this.pieces[idx] = PIECES.BISHOP | COLORS.BLACK
            this.blackPieces.push(new Piece({ type: PIECES.BISHOP, file: file, rank: rank, color: COLORS.BLACK }))
            break

          case 'B':
            this.pieces[idx] = PIECES.BISHOP | COLORS.WHITE
            this.whitePieces.push(new Piece({ type: PIECES.BISHOP, file: file, rank: rank, color: COLORS.WHITE }))
            break

          case 'q':
            this.pieces[idx] = PIECES.QUEEN | COLORS.BLACK
            this.blackPieces.push(new Piece({ type: PIECES.QUEEN, file: file, rank: rank, color: COLORS.BLACK }))
            break

          case 'Q':
            this.pieces[idx] = PIECES.QUEEN | COLORS.WHITE
            this.whitePieces.push(new Piece({ type: PIECES.QUEEN, file: file, rank: rank, color: COLORS.WHITE }))
            break

          case 'k':
            this.pieces[idx] = PIECES.KING | COLORS.BLACK
            this.blackPieces.push(new Piece({ type: PIECES.KING, file: file, rank: rank, color: COLORS.BLACK }))
            break

          case 'K':
            this.pieces[idx] = PIECES.KING | COLORS.WHITE
            this.whitePieces.push(new Piece({ type: PIECES.KING, file: file, rank: rank, color: COLORS.WHITE }))
            break

          default:
            console.log(`default switch fen string: ${fen_string[stridx]}`)
        }
        ++stridx;
      }

      ++stridx; // ignore '/' char
    }

    gameInfo.colorToPlay = (fen_string[stridx] == 'w') ? COLORS.WHITE : COLORS.BLACK

    // white castle
    if (fen_string == '-') {
      gameInfo.whiteCastle = CASTLES.CASTLE_NOT_ALLOWED
    } else {
      let castleStr = fen_string[stridx]
      ++stridx
      if (fen_string.charCodeAt(stridx) < 91) // is capital letter [A, Z]
      {
        castleStr += fen_string[stridx]
      }

      switch (castleStr) {
        case 'K':
          gameInfo.whiteCastle = CASTLES.CASTLE_KING_SIDE
          break

        case 'Q':
          gameInfo.whiteCastle = CASTLES.CASTLE_QUEEN_SIDE
          break

        case 'KQ':
          gameInfo.whiteCastle = CASTLES.CASTLE_BOTH_SIDE
          break
      }
    }

    // black castle
    if (fen_string == '-') {
      gameInfo.blackCastle = CASTLES.CASTLE_NOT_ALLOWED
    } else {
      let castleStr = fen_string[stridx]
      ++stridx
      if (fen_string.charCodeAt(stridx) < 91) // is capital letter [A, Z]
      {
        castleStr += fen_string[stridx]
      }

      switch (castleStr) {
        case 'k':
          gameInfo.blackCastle = CASTLES.CASTLE_KING_SIDE
          break

        case 'q':
          gameInfo.blackCastle = CASTLES.CASTLE_QUEEN_SIDE
          break

        case 'kq':
          gameInfo.blackCastle = CASTLES.CASTLE_BOTH_SIDE
          break
      }
    }

    return gameInfo
  }

  fileAndRankToIdx(file, rank) {
    return (rank * 10 + file) + 21
  }

  idxToFileAndRank(idx) {
    let file = (idx - 21) % 10
    let rank = (idx - 21 - file) / 10
    return { file: file, rank: rank }
  }

  getElementByIdx(idx) {
    let { file, rank } = this.idxToFileAndRank(idx)
    let element = this.getElementByFileAndRank(file, rank)

    return element
  }

  getElementByFileAndRank(file, rank) {
    let elementId = `cell-${String.fromCharCode(65 + file)}${rank + 1}`
    let element = document.getElementById(elementId)

    return element
  }

  removePiece(piece) {
    if (!piece) return

    piece.element.classList.remove(piece.cssClass)
    let piecesArray = (piece.color === COLORS.WHITE) ? this.whitePieces : this.blackPieces

    for (let i = 0; i < piecesArray.length; ++i) {
      if (piecesArray[i].file === piece.file && piecesArray[i].rank === piece.rank) {
        piecesArray.splice(i, 1)
        break
      }
    }
  }

  isInBoard(idx) {
    return (this.pieces[idx] !== PIECES.OUT_OF_BOARD)
  }

  sameDiagonal(idx1, idx2) {
    let { file: r1, rank: c1 } = this.idxToFileAndRank(idx1)
    let { file: r2, rank: c2 } = this.idxToFileAndRank(idx2)
    return (abs(r1 - r2) === abs(c1 - c2))
  }

  sameRowOrCol(idx1, idx2) {
    let { file: r1, rank: c1 } = this.idxToFileAndRank(idx1)
    let { file: r2, rank: c2 } = this.idxToFileAndRank(idx2)
    return (r1 === r2 || c1 === c2)
  }

  /*
    Return idx cells from src to dst trying all offsets.
    It includes idxDst but not idxSrc
  */
  getMovesFromTo(idxSrc, idxDst, offsets) {
    let moves = []
    for (let off of offsets) {
      let move = off + idxSrc
      moves = []
      while (this.isInBoard(move)) {
        moves.push(move)
        if (move === idxDst) return moves
        move += off
      }
    }
    return moves
  }

  getOffset(src, dst) {
    let { file: srcFile, rank: srcRank } = this.idxToFileAndRank(src)
    let { file: dstFile, rank: dstRank } = this.idxToFileAndRank(dst)

    let offFile = abs(srcFile - dstFile)
    let offRank = abs(srcRank - dstRank)
    let off = dst - src  //offset from src to dst
    let dist = (offFile > offRank) ? offFile : offRank
    off = off / dist
    return off
  }

  emptyRoute(idxSrc, idxDst, off) {
    let moveIdx = idxSrc + off
    while (this.isInBoard(moveIdx) && moveIdx !== idxDst) {
      if (this.pieces[moveIdx] !== PIECES.EMPTY) {
        return false
      }
      moveIdx += off
    }
    return true
  }

  /*
    Returns the index of a specific type of LONG RANGE piece if it is making check to some cell
  */
  checksWith(idxCell, colorToAtack, typeSearch, offsets) {
    let checks = [] // idx of pieces making check

    offsets.forEach(off => {
      let moveIdx = off + idxCell
      while (this.isInBoard(moveIdx)) {
        if (this.pieces[moveIdx] !== PIECES.EMPTY) { // there is a piece
          if(this.foundEnemy(moveIdx, colorToAtack, typeSearch)) checks.push(moveIdx)
          break // next offset
        }
        moveIdx += off
      }
    })
    return checks
  }

  /*
    Returns the index of a specific type of SHORT RANGE piece if it is making check to some cell
  */
  checksWithOneMove(idxCell, colorToAtack, typeSearch, offsets) {
    let checks = [] // idx of pieces making check

    offsets.forEach(off => {
      let moveIdx = off + idxCell
      if (!this.isInBoard(moveIdx)) return
      if(this.foundEnemy(moveIdx, colorToAtack, typeSearch)) checks.push(moveIdx)
    })
    return checks
  }

  foundEnemy(idx, enemyColor, typeSearch) {
    let piece = this.pieces[idx]
    if (piece !== PIECES.EMPTY) { // there is a piece
      let pieceColor = piece & COLORS.WHITE
      let pieceType = piece - pieceColor
      if (pieceColor === enemyColor && pieceType === typeSearch) { // enemy colour
        return true
      }
    }
    return false
  }

  /*
    Returns idx of enemy pieces (colorToAtack) which atacks #idxCell
  */
  bullyPiecesIdx(idxCell, colorToAtack) {
    let checks = []
    if (colorToAtack === COLORS.BLACK) { // inverse offsets because we try to move with idx
      checks = checks.concat(this.checksWithOneMove(idxCell, colorToAtack, PIECES.PAWN, PIECE_OFFSETS.WHITE_PAWN_ATACK))
    } else {
      checks = checks.concat(this.checksWithOneMove(idxCell, colorToAtack, PIECES.PAWN, PIECE_OFFSETS.BLACK_PAWN_ATACK))
    }
    checks = checks.concat(this.checksWithOneMove(idxCell, colorToAtack, PIECES.KNIGHT, PIECE_OFFSETS.KNIGHT))
    checks = checks.concat(this.checksWithOneMove(idxCell, colorToAtack, PIECES.KING, PIECE_OFFSETS.KING))
    checks = checks.concat(this.checksWith(idxCell, colorToAtack, PIECES.BISHOP, PIECE_OFFSETS.BISHOP))
    checks = checks.concat(this.checksWith(idxCell, colorToAtack, PIECES.ROOK, PIECE_OFFSETS.ROOK))
    checks = checks.concat(this.checksWith(idxCell, colorToAtack, PIECES.QUEEN, PIECE_OFFSETS.QUEEN))

    return checks
  }

  PawnPromotion(piece, idx) {
    piece.setType(PIECES.QUEEN)
    this.pieces[idx] = PIECES.QUEEN | piece.color
  }

  calcLegalMoves(pieceSrc, colorToPlay, isCheck, cellsToProtect, pawnJump) {
    if (!pieceSrc) return

    pieceSrc.legalMoves = []

    if (colorToPlay !== pieceSrc.color)
      return

    switch (pieceSrc.type) {
      case PIECES.PAWN:
        if (pieceSrc.color === COLORS.WHITE)
          this.calcPawnMoves(pieceSrc, PIECE_OFFSETS.WHITE_PAWN, pawnJump)
        else
          this.calcPawnMoves(pieceSrc, PIECE_OFFSETS.BLACK_PAWN, pawnJump)
        break

      case PIECES.BISHOP:
        this.calcLongRangePieceMoves(pieceSrc, PIECE_OFFSETS.BISHOP)
        break

      case PIECES.KNIGHT:
        this.calcKnightMoves(pieceSrc, PIECE_OFFSETS.KNIGHT)
        break

      case PIECES.ROOK:
        this.calcLongRangePieceMoves(pieceSrc, PIECE_OFFSETS.ROOK)
        break

      case PIECES.QUEEN:
        this.calcLongRangePieceMoves(pieceSrc, PIECE_OFFSETS.QUEEN)
        break

      case PIECES.KING:
        this.calcKingMoves(pieceSrc, PIECE_OFFSETS.KING, isCheck)
        break
    }

    this.subtractIlegalMoves(pieceSrc, colorToPlay, isCheck, cellsToProtect)
  }

  calcPawnMoves(pieceSrc, offsets, pawnJump) {
    /**
     * CASES:
     * - Movement out of board (INVALID)
     * - Forward movement blocked by a piece (INVALID)
     * - Forward movement to empty cell (ALLOWED)
     * - Diagonal movement to empty cell (INVALID)
     * - Diagonal movement to kill enemy piece (ALLOWED)
     * - Pawn reaches edge rank of board (for white pawn -> RANK_8 | for black pawn -> RANK_1) (PROMOTION)
     */
    let pieces = this.pieces
    let pieceIdx = this.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)

    offsets.forEach(off => {
      let move = off + pieceIdx
      let pieceDst = pieces[move]
      if (!this.isInBoard(move)) return // out of board

      // forward move
      if (off % 10 === 0) {
        if (pieceDst !== PIECES.EMPTY) return // forward blocked
        pieceSrc.legalMoves.push(move)

        move += off
        pieceDst = pieces[move] // 2 steps forward

        if (pieceSrc.firstMove && pieceDst === PIECES.EMPTY && this.isInBoard(move)) {
          pieceSrc.legalMoves.push(move)
        }
      } else {
        // Pawn kills enemy piece
        let pieceDstColor = pieceDst & COLORS.WHITE
        if (pieceDst === PIECES.EMPTY || pieceDstColor === pieceSrc.color) return
        pieceSrc.legalMoves.push(move)
      }
    })

    // Kill long jump Pawn

    if (pieceSrc.color === COLORS.WHITE) {
      if (pieceSrc.rank === RANKS.RANK_5) {
        if (pieceSrc.file - 1 === pawnJump) {
          pieceSrc.legalMoves.push(this.fileAndRankToIdx(pieceSrc.file - 1, pieceSrc.rank + 1))
        }
        else if (pieceSrc.file + 1 === pawnJump) {
          pieceSrc.legalMoves.push(this.fileAndRankToIdx(pieceSrc.file + 1, pieceSrc.rank + 1))
        }
      }
    }
    else { // BLACK
      if (pieceSrc.rank === RANKS.RANK_4) {
        if (pieceSrc.file - 1 === pawnJump) {
          pieceSrc.legalMoves.push(this.fileAndRankToIdx(pieceSrc.file - 1, pieceSrc.rank - 1))
        }
        else if (pieceSrc.file + 1 === pawnJump) {
          pieceSrc.legalMoves.push(this.fileAndRankToIdx(pieceSrc.file + 1, pieceSrc.rank - 1))
        }
      }
    }

  }

  calcLongRangePieceMoves(pieceSrc, offsets) {
    let pieceIdx = this.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)

    offsets.forEach(off => {
      let move = off + pieceIdx
      while (this.isInBoard(move)) {
        let pieceDst = this.pieces[move]
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

  calcKingMoves(king, offsets, isCheck) {
    let kingIdx = this.fileAndRankToIdx(king.file, king.rank)
    let enemyColor = king.color ^ COLORS.WHITE

    // Basic moves
    offsets.forEach(off => {
      let move = off + kingIdx
      if (!this.isInBoard(move)) return

      let pieceDst = this.pieces[move]
      let pieceDstColor = pieceDst & COLORS.WHITE
      if (pieceDst === PIECES.EMPTY || pieceDstColor !== king.color) {
        king.legalMoves.push(move)
      }
    })

    // Castling
    if (king.firstMove && !isCheck) {
      let { idx: lRookIdx, piece: lRook } = this.getPieceByIdx(kingIdx - 4)
      let { idx: rRookIdx, piece: rRook } = this.getPieceByIdx(kingIdx + 3)

      if (lRook && lRook.firstMove && this.emptyRoute(kingIdx, lRookIdx, -1)) {
        let kingPath = this.getMovesFromTo(kingIdx, kingIdx - 2, [-1])
        if (kingPath.every(cell => {
          return this.bullyPiecesIdx(cell, enemyColor).length == 0
        })) { // if the path doesnt have bullies
          king.legalMoves.push(kingIdx - 2)
        }
      }
      if (rRook && rRook.firstMove && this.emptyRoute(kingIdx, rRookIdx, 1)) {
        let kingPath = this.getMovesFromTo(kingIdx, kingIdx + 2, [1])
        if (kingPath.every(cell => {
          return this.bullyPiecesIdx(cell, enemyColor).length == 0
        })) { // if the path doesnt have bullies
          king.legalMoves.push(kingIdx + 2)
        }
      }
    }
  }

  calcKnightMoves(pieceSrc, offsets) {
    let pieceIdx = this.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)

    offsets.forEach(off => {
      let move = off + pieceIdx
      if (!this.isInBoard(move)) return

      let pieceDst = this.pieces[move]
      let pieceDstColor = pieceDst & COLORS.WHITE
      if (pieceDst === PIECES.EMPTY || pieceDstColor !== pieceSrc.color) {
        pieceSrc.legalMoves.push(move)
      }
    })
  }

  /*
  In case of check, it filters the legal moves with the idxCells which permit to block the check
  Otherwise, it deletes moves that put the king in check:
  - King tries to move a not safe place
  - Ally piece unlock the path for a enemy piece
*/
  subtractIlegalMoves(pieceSrc, colorToPlay, isCheck, cellsToProtect) {
    let enemyColor = colorToPlay ^ COLORS.WHITE

    if (isCheck) {
      if (pieceSrc.type == PIECES.KING) {
        let pieceIdx = this.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)

        // safe places (not taking into account that king can block himself)
        pieceSrc.legalMoves = pieceSrc.legalMoves.filter(idx => this.bullyPiecesIdx(idx, enemyColor).length == 0)
        // erase moves where king is between the move and bully
        pieceSrc.legalMoves = pieceSrc.legalMoves.filter(
          nextMove => {
            let off = this.getOffset(pieceIdx, nextMove) // direction where king is moving
            let bullies = this.bullyPiecesIdx(pieceIdx, enemyColor)

            // if each bully doesnt have path to nextmove using our offset
            return bullies.every(bully => {
              let bullyOffsets = pieceOffsets(this.pieces[bully])
              if (bullyOffsets.includes(off)) {
                // if using the same offset it can find us
                return !this.getMovesFromTo(bully, nextMove, [off]).includes(pieceIdx)
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
        pieceSrc.legalMoves = pieceSrc.legalMoves.filter(idx => cellsToProtect.includes(idx)) //cells to block check or kill bully
      }
    }
    else if (pieceSrc.type == PIECES.KING) {
      pieceSrc.legalMoves = pieceSrc.legalMoves.filter(idx => this.bullyPiecesIdx(idx, enemyColor).length == 0) //safe places
    }
    else {

      let idxSrc = this.fileAndRankToIdx(pieceSrc.file, pieceSrc.rank)
      let king = this.getKing(pieceSrc.color)
      let idxKing = this.fileAndRankToIdx(king.file, king.rank)

      if (this.sameDiagonal(idxSrc, idxKing) || this.sameRowOrCol(idxSrc, idxKing)) {

        let off = this.getOffset(idxKing, idxSrc)

        // go from king to srcPiece, looking for a piece blocking the path
        let pathBlocked = false  // if a piece is blocking the path, srcPiece doesnt have to worry about king
        let move = off + idxKing
        for (; this.isInBoard(move); move += off) {
          if (move === idxSrc) break

          let cell = this.pieces[move]
          if (cell !== PIECES.EMPTY) { // found piece
            pathBlocked = true
            break
          }
        }

        if (!pathBlocked) {
          // go from srcPiece using same offset, looking for an enemy
          for (let move = idxSrc + off; this.isInBoard(move); move += off) {

            let cell = this.pieces[move]
            let pieceDstColor = cell & COLORS.WHITE
            let pieceType = cell - pieceDstColor

            if (cell !== PIECES.EMPTY && pieceDstColor !== pieceSrc.color // found piece of enemy color
              && pieceType !== PIECES.PAWN && pieceType !== PIECES.KNIGHT && pieceType !== PIECES.KING) { // not pawn or knight or king

              let path = this.getMovesFromTo(idxKing, move, [off])
              pieceSrc.legalMoves = pieceSrc.legalMoves.filter(idx => path.includes(idx))
              break;
            }
          }
        }
      }
    }
  }


}