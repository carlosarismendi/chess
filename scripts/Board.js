class Board {
  constructor({ selector, dimension }) {
    this.element = document.querySelector(selector)
    this.colorToPlayValue = COLORS.WHITE
    this.whiteCastle = CASTLES.CASTLE_BOTH_SIDE
    this.blackCastle = CASTLES.CASTLE_BOTH_SIDE
    this.#drawBoard()
    this.#initPieces()
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

  #initPieces () {
    this.#parseFENNotation('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    // this.#parseFENNotation('rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2')
    // this.#parseFENNotation('4k3/8/8/8/8/8/4P3/4K3 w - - 5 39')
  }

  #parseFENNotation (fen_string) {
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
            this.#addEventListenersToPiece(idx)

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
        this.#addEventListenersToPiece(idx)
        ++stridx;
      }

      ++stridx; // ignore '/' char
    }

    // ++stridx
    this.colorToPlay = (fen_string[stridx] == 'w') ? COLORS.WHITE : COLORS.BLACK

    // white castle
    if (fen_string == '-') {
      this.whiteCastle = CASTLES.CASTLE_NOT_ALLOWED
    } else {
      let castleStr = fen_string[stridx]
      ++stridx
      if (fen_string.charCodeAt(stridx) < 91) // is capital letter [A, Z]
      {
        castleStr += fen_string[stridx]
      }

      switch (castleStr) {
        case 'K':
          this.whiteCastle = CASTLES.CASTLE_KING_SIDE
          break

        case 'Q':
          this.whiteCastle = CASTLES.CASTLE_QUEEN_SIDE
          break

        case 'KQ':
          this.whiteCastle = CASTLES.CASTLE_BOTH_SIDE
          break
      }
    }

    // black castle
    if (fen_string == '-') {
      this.blackCastle = CASTLES.CASTLE_NOT_ALLOWED
    } else {
      let castleStr = fen_string[stridx]
      ++stridx
      if (fen_string.charCodeAt(stridx) < 91) // is capital letter [A, Z]
      {
        castleStr += fen_string[stridx]
      }

      switch (castleStr) {
        case 'k':
          this.blackCastle = CASTLES.CASTLE_KING_SIDE
          break

        case 'q':
          this.blackCastle = CASTLES.CASTLE_QUEEN_SIDE
          break

        case 'kq':
          this.blackCastle = CASTLES.CASTLE_BOTH_SIDE
          break
      }
    }
  }

  #addEventListenersToPiece (idx) {
    this.pieces[idx].element.setAttribute('draggable', 'true')
    this.pieces[idx].element.addEventListener('mousedown', this.#mousedown.bind(this, idx))
    this.pieces[idx].element.addEventListener('mouseup', this.#mouseup.bind(this, idx))
    this.pieces[idx].element.addEventListener('dragstart', this.#dragstart.bind(this, idx))
    this.pieces[idx].element.addEventListener('dragover', this.#dragover.bind(this.pieces[idx]))
    this.pieces[idx].element.addEventListener('drop', this.#drop.bind(this, idx))
  }

  #fileAndRankToIdx (file, rank) {
    return (rank * 10 + file) + 21
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

    // Target cell gets data from piece of source cell
    let idxSrc = parseInt( event.dataTransfer.getData('text/plain') )
    this.#hideLegalMoves(idxSrc)
    let pieceSrc = this.pieces[idxSrc]
    let pieceDst = this.pieces[idxDst]

    // Check that user is not dropping in the same cell
    if (pieceSrc.file === pieceDst.file && pieceSrc.rank === pieceDst.rank || pieceSrc.type === PIECES.EMPTY)
      return

    this.#move(pieceSrc, pieceDst, idxDst)
  }

  #move (pieceSrc, pieceDst, idxDst) {
    // Check if movement is valid
    if (!pieceSrc.legalMoves.includes(idxDst))
      return

    // Change turn from white to black and viceversa
    this.colorToPlay = this.colorToPlay ^ 1

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
  }

  #calcLegalMoves (pieceIdx) {
    this.pieces[pieceIdx].legalMoves = []

    if (this.colorToPlay !== this.pieces[pieceIdx].color)
      return

    switch (this.pieces[pieceIdx].type) {
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
    let pieceSrc = this.pieces[pieceIdx]

    offsets.forEach(off => {
      let move = off + pieceIdx
      let pieceDst = this.pieces[move]
      if (!this.#isInBoard(move)) return // out of board

      // forward move
      if (off % 10 === 0) {
        if (pieceDst.type !== PIECES.EMPTY) return // forward blocked
        pieceSrc.legalMoves.push(move)

        move += off
        pieceDst = this.pieces[move] // 2 steps forward

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
    let pieceSrc = this.pieces[pieceIdx]

    offsets.forEach(off => {
      let move = off + pieceIdx
      while (this.#isInBoard(move)) {
        let pieceDst = this.pieces[move]
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

  #calcKnightMoves (pieceIdx, offsets) {
    let pieceSrc = this.pieces[pieceIdx]

    offsets.forEach(off => {
      let move = off + pieceIdx
      if (!this.#isInBoard(move)) return

      let pieceDst = this.pieces[move]
      if (pieceDst.type === PIECES.EMPTY || pieceDst.color !== pieceSrc.color) {
        pieceSrc.legalMoves.push(move)
      }
    })
  }

  async #showLegalMoves (pieceIdx) {
    this.pieces[pieceIdx].legalMoves.forEach(idx => {
      this.pieces[idx].element.classList.add('legal-move')
    });
  }

  async #hideLegalMoves (pieceIdx) {
    this.pieces[pieceIdx].legalMoves.forEach(idx => {
      this.pieces[idx].element.classList.remove('legal-move')
    });
  }

  #isInBoard (idx) {
    return (this.pieces[idx].type !== PIECES.OUT_OF_BOARD)
  }

  #whitePawnPromotion (piece) {
    piece.setType(PIECES.WHITE_QUEEN)
  }

  #blackPawnPromotion (piece) {
    piece.setType(PIECES.BLACK_QUEEN)
  }
}