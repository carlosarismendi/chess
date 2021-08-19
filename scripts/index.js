let board = null

window.onload = init

function init () {
  board = new Game({ selector: '#board', fen_string: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' })
}