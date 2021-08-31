/*
  Converts piece value to string corresponding a piece and color
*/
function int2string(typeAndColor) {
  let color = typeAndColor & COLORS.WHITE
  let type = typeAndColor - color

  if (color === COLORS.WHITE) {
    switch (type) {
      case PIECES.PAWN: return 'white-pawn'
      case PIECES.BISHOP: return 'white-bishop'
      case PIECES.KNIGHT: return 'white-knight'
      case PIECES.ROOK: return 'white-rook'
      case PIECES.KING: return 'white-king'
      case PIECES.QUEEN: return 'white-queen'
      default: return 'white'
    }
  } else {
    switch (type) {
      case PIECES.PAWN: return 'black-pawn'
      case PIECES.BISHOP: return 'black-bishop'
      case PIECES.KNIGHT: return 'black-knight'
      case PIECES.ROOK: return 'black-rook'
      case PIECES.KING: return 'black-king'
      case PIECES.QUEEN: return 'black-queen'
      default: return 'black'
    }
  }
}

function pieceOffsets(typeAndColor) {
  let color = typeAndColor & COLORS.WHITE
  let type = typeAndColor - color

  if (color === COLORS.WHITE) {
    switch (type) {
      case PIECES.PAWN: return PIECE_OFFSETS.WHITE_PAWN
      case PIECES.BISHOP: return PIECE_OFFSETS.BISHOP
      case PIECES.KNIGHT: return PIECE_OFFSETS.KNIGHT
      case PIECES.ROOK: return PIECE_OFFSETS.ROOK
      case PIECES.KING: return PIECE_OFFSETS.KING
      case PIECES.QUEEN: return PIECE_OFFSETS.QUEEN
      // default: return 'white'
    }
  } else {
    switch (type) {
      case PIECES.PAWN: return PIECE_OFFSETS._PAWN
      case PIECES.BISHOP: return PIECE_OFFSETS.BISHOP
      case PIECES.KNIGHT: return PIECE_OFFSETS.KNIGHT
      case PIECES.ROOK: return PIECE_OFFSETS.ROOK
      case PIECES.KING: return PIECE_OFFSETS.KING
      case PIECES.QUEEN: return PIECE_OFFSETS.QUEEN
      // default: return 'black'
    }
  }
}

function abs(a) {
  return (a < 0) ? -a : a
}