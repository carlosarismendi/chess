let game = null

window.onload = init

function init () {
  // game = new Game({ selector: '#board', fen_string: INITIAL_POSITION_FEN })

  // fen_string = "3r2kb/4q2p/p3p1pQ/1p4N1/2n2RP1/4P2P/KP1r4/3N1R2 w -- - 0 1"
  fen_string = "7K/1k2N2p/8/4r3/4R3/5Q2/8/8 w -- - 0 1"
  game = new Game({ selector: '#board', fen_string: fen_string })
}

function newGame () {
  game.restart()
}