class Board {
  constructor({ selector, colorDown }) {
    this.element = document.querySelector(selector)
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
    // let piece = null
    // let pieceType = this.pieces[idx]
    // if(pieceType === PIECES.EMPTY) return { idx: idx, piece: piece }
    // let pieceColor = pieceType & COLORS.WHITE

    // let piecesArray = (pieceColor === COLORS.WHITE) ? this.whitePieces : this.blackPieces

    // for (let i = 0; i < piecesArray.length; ++i) {

    //   if (piecesArray[i].file === file && piecesArray[i].rank === rank) {
    //     piece = piecesArray[i]
    //     break
    //   }
    // }

    // return { idx: idx, piece: piece }
  }

  getPieceByIdx(idx) {
    let pieceType = this.pieces[idx]
    let piece = null

    if(pieceType === PIECES.EMPTY) return { idx: idx, piece: piece }

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
    console.error("King doesnt exists???????????")
  }

  blackKing() {
    for (let i = 0; i < this.blackPieces.length; ++i) {

      if (this.blackPieces[i].type === PIECES.KING) {
        return this.blackPieces[i]
      }
    }
    console.error("King doesnt exists???????????")
  }

  getKing(colour) {
    if (colour === COLORS.WHITE) {
      return this.whiteKing()
    }
    return this.blackKing()
  }

  #drawBoard(colorDown) {
    this.element.innerHTML = ''

    if (colorDown === COLORS.WHITE) {
      for (let rank = RANKS.RANK_8; rank >= RANKS.RANK_1; --rank) {
        for (let file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
          // const cell_id = `cell-${String.fromCharCode(65 + file)}${rank + 1}`
          // const cell_class = (file + rank) & 1 ? 'board-cell white' : 'board-cell black'
          // const cell = `<div id="${cell_id}" class="${cell_class}">${this.fileAndRankToIdx(file, rank)}</div>\n`
          const cell = this.#createCell(file, rank)
          this.element.innerHTML += cell
        }

        this.element.innerHTML += '\n'
      }
    } else {
      for (let rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
        for (let file = FILES.FILE_H; file >= FILES.FILE_A; --file) {
          // const cell_id = `cell-${String.fromCharCode(65 + file)}${rank + 1}`
          // const cell_class = (file + rank) & 1 ? 'board-cell white' : 'board-cell black'
          // const cell = `<div id="${cell_id}" class="${cell_class}">${this.fileAndRankToIdx(file, rank)}</div>\n`
          const cell = this.#createCell(file, rank)
          this.element.innerHTML += cell
        }

        this.element.innerHTML += '\n'
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
            this.pieces[idx] = PIECES.EMPTY // new Piece({ type: PIECES.EMPTY, file: file, rank: rank, color: null })
            // this.#addEventListenersToPiece(idx)

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
          // --file
        }
        // this.#addEventListenersToPiece(idx)
        ++stridx;
      }

      ++stridx; // ignore '/' char
    }

    // ++stridx
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
    Return idx cells from src to dst trying all offsets
    it includes idxDst but not idxSrc
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
}