class Board {
  constructor({ selector }) {
    this.element = document.querySelector(selector)
    this.#drawBoard()
    this.pieces = []
  }

  getPiece (file, rank) {
    let idx = this.#fileAndRankToIdx(file, rank)
    return { idx: idx, piece: this.pieces[idx] }
  }

  #drawBoard() {
    this.element.innerHTML = ''

    for(let rank = RANKS.RANK_8; rank >= RANKS.RANK_1; --rank) {
      for(let file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
        const cell_id = `cell-${String.fromCharCode(65 + file)}${rank+1}`
        const cell_class = (file + rank) & 1 ? 'board-cell white' : 'board-cell black'
        const cell = `<div id="${cell_id}" class="${cell_class}">${this.#fileAndRankToIdx(file, rank)}</div>\n`

        this.element.innerHTML += cell
      }

      this.element.innerHTML += '\n'
    }
  }

  initFromFENNotation (fen_string) {
    let gameInfo = {
      colorToPlay: null,
      whiteCastle: null,
      blackCastle: null
    }

    this.pieces = new Array(120)
    let rank = 0;
    let file = 0;
    for(let i = 0; i < this.pieces.length; ++i)
    {
      this.pieces[i] = new Piece({ type: PIECES.OUT_OF_BOARD, file: file, rank: rank, color: null })
    }

    let stridx = 0
    for(let rank = RANKS.RANK_8; rank >= RANKS.RANK_1; --rank) {
      for(let file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
        const idx = this.#fileAndRankToIdx(file, rank)

        let blanks = parseInt(fen_string[stridx])
        if(!Number.isNaN(blanks)) {
          while(blanks > 0) {
            const idx = this.#fileAndRankToIdx(file, rank)
            this.pieces[idx] = new Piece({ type: PIECES.EMPTY, file: file, rank: rank, color: null })
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
            this.pieces[idx] = new Piece({ type: PIECES.BLACK_PAWN, file: file, rank: rank, color: COLORS.BLACK })
            break

          case 'P':
            this.pieces[idx] = new Piece({ type: PIECES.WHITE_PAWN, file: file, rank: rank, color: COLORS.WHITE })
            break

          case 'r':
            this.pieces[idx] = new Piece({ type: PIECES.BLACK_ROOK, file: file, rank: rank, color: COLORS.BLACK })
            break

          case 'R':
            this.pieces[idx] = new Piece({ type: PIECES.WHITE_ROOK, file: file, rank: rank, color: COLORS.WHITE })
            break

          case 'n':
            this.pieces[idx] = new Piece({ type: PIECES.BLACK_KNIGHT, file: file, rank: rank, color: COLORS.BLACK })
            break

          case 'N':
            this.pieces[idx] = new Piece({ type: PIECES.WHITE_KNIGHT, file: file, rank: rank, color: COLORS.WHITE })
            break

          case 'b':
            this.pieces[idx] = new Piece({ type: PIECES.BLACK_BISHOP, file: file, rank: rank, color: COLORS.BLACK })
            break

          case 'B':
            this.pieces[idx] = new Piece({ type: PIECES.WHITE_BISHOP, file: file, rank: rank, color: COLORS.WHITE })
            break

          case 'q':
            this.pieces[idx] = new Piece({ type: PIECES.BLACK_QUEEN, file: file, rank: rank, color: COLORS.BLACK })
            break

          case 'Q':
            this.pieces[idx] = new Piece({ type: PIECES.WHITE_QUEEN, file: file, rank: rank, color: COLORS.WHITE })
            break

          case 'k':
            this.pieces[idx] = new Piece({ type: PIECES.BLACK_KING, file: file, rank: rank, color: COLORS.BLACK })
            break

          case 'K':
            this.pieces[idx] = new Piece({ type: PIECES.WHITE_KING, file: file, rank: rank, color: COLORS.WHITE })
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

  #fileAndRankToIdx (file, rank) {
    return (rank * 10 + file) + 21
  }
}