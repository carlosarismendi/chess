let game = null

window.onload = init

function init () {
  game = new Game({ selector: '#board', fen_string: INITIAL_POSITION_FEN })
}

function newGame () {
  game.restart()
}