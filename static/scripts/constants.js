const INITIAL_POSITION_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
// const INITIAL_POSITION_FEN = '8/8/7k/8/8/6Kr/8/8 w -- - 0 1'

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
  WHITE: 8
}

const CASTLES = {
  CASTLE_NOT_ALLOWED: 0,
  CASTLE_KING_SIDE: 1,
  CASTLE_QUEEN_SIDE: 2,
  CASTLE_BOTH_SIDE: 3
}

const PIECES = {
  OUT_OF_BOARD: 0,
  EMPTY: 1,
  PAWN: 2,
  BISHOP: 3,
  KNIGHT: 4,
  ROOK: 5,
  KING: 6,
  QUEEN: 7
}

// LOOKING BOARD WITH WHITE BELOW
const PIECE_OFFSETS = {
  WHITE_PAWN: [9, 10, 11], // up-left, up, up-right
  BLACK_PAWN: [-9, -10, -11], // down-right, down, down-left
  WHITE_PAWN_ATACK: [9, 11], // up-left, up-right
  BLACK_PAWN_ATACK: [-9, -11], // down-right, down-left
  BISHOP: [9, -9, 11, -11], // up-left, down-right, up-right, down-left
  KNIGHT: [8, 19, 21, 12, -8, -19, -21, -12],
  ROOK: [-1, 10, 1, -10], // left, up, right, down
  KING: [-1, 9, 10, 11, 1, -9, -10, -11], // left, up-left, up, up-right, right, down-right, down, down-ñeft
  QUEEN: [-1, 9, 10, 11, 1, -9, -10, -11], // left, up-left, up, up-right, right, down-right, down, down-ñeft
}

// If this consts are modified. const ( flags... ) must be adapted to this in backend in types.go.
const FLAGS_WS = {
  NONE: 0,
  GAME_START: 1,
  CHECKMATE: 2,
  TIMEOUT: 3,
  ABANDON: 4,
  OFFER_DRAW: 5,
  ACCEPT_DRAW: 6,
  DECLINE_DRAW: 7,
  KING_DROWNED: 8,
  FORCED_DRAW: 9 // This will happen when there are only kings or kings +  opposite bishops
}