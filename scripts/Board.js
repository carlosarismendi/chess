const FILES = {
  FILE_A: 0,
  FILE_B: 1,
  FILE_C: 2,
  FILE_D: 3,
  FILE_E: 4,
  FILE_F: 5,
  FILE_G: 6,
  FILE_H: 7
}

const RANKS = {
  RANK_1: 0,
  RANK_2: 1,
  RANK_3: 2,
  RANK_4: 3,
  RANK_5: 4,
  RANK_6: 5,
  RANK_7: 6,
  RANK_8: 7
}

const COLORS = {
  BLACK: 0,
  WHITE: 1
}

const CASTLES = {
  CASTLE_NOT_ALLOWED: 0,
  CASTLE_KING_SIDE: 1,
  CASTLE_QUEEN_SIDE: 2,
  CASTLE_BOTH_SIDE: 3
}

class Board {
  constructor({ selector, dimension }) {
    this.element = document.querySelector(selector)
    this.whitePlay = true
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
        const cell = `<div id="${cell_id}" class="${cell_class}"></div>\n`

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
    this.pieces = new Array(64)

    let stridx = 0
    for(let rank = RANKS.RANK_8; rank >= RANKS.RANK_1; --rank) {
      for(let file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
        const idx = this.#fileAndRankToIdx(file, rank)

        let blanks = parseInt(fen_string[stridx])
        if(!Number.isNaN(blanks)) {
          while(blanks > 0) {
            const idx = this.#fileAndRankToIdx(file, rank)
            this.pieces[idx] = new Piece({ type: PIECES.EMPTY, file: file, rank: rank, color: null })
            this.pieces[idx].element.setAttribute('draggable', 'true')
            this.pieces[idx].element.addEventListener('dragstart', this.#drag.bind(this.pieces[idx]))
            this.pieces[idx].element.addEventListener('dragover', this.#allowDrop.bind(this.pieces[idx]))
            this.pieces[idx].element.addEventListener('drop', this.#drop.bind(this.pieces[idx]))

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

        this.pieces[idx].element.setAttribute('draggable', 'true')
        this.pieces[idx].element.addEventListener('dragstart', this.#drag.bind(this.pieces[idx]))
        this.pieces[idx].element.addEventListener('dragover', this.#allowDrop.bind(this.pieces[idx]))
        this.pieces[idx].element.addEventListener('drop', this.#drop.bind(this.pieces[idx]))

        ++stridx;
      }

      ++stridx; // ignore '/' char
    }

    ++stridx
    this.whitePlay = (fen_string[stridx] == 'w')

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

  #fileAndRankToIdx (file, rank) {
    return rank * 8 + file
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
}