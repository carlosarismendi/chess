let board = null

window.onload = function() {
  init()
}

const BOARD_DIMENSION = 80 //vmin
const CELL_SIZE = BOARD_DIMENSION / 8; //px

function init () {
  board = new Board({ selector: '#board' })
}