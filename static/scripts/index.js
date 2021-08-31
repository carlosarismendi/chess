let game = null
const host = "localhost:8080"

window.onload = init

function init () {
  game = new Game({ selector: '#board', fen_string: INITIAL_POSITION_FEN, wsConn: null })

  // fen_string = "3r2kb/4q2p/p3p1pQ/1p4N1/2n2RP1/4P2P/KP1r4/3N1R2 w -- - 0 1"
  // fen_string = "7K/1k2N2p/8/4r3/4R3/5Q2/8/8 w -- - 0 1"
  // game = new Game({ selector: '#board', fen_string: fen_string })

  let gameToken = new URLSearchParams(window.location.search).get('token')
  console.log(gameToken)
  if (gameToken) {
    game.createWebSocketConnection(host, `join-game/${gameToken}`)
  }
}

function newGame () {
  game.createWebSocketConnection(host, 'new-game')
  // game.restart()
}

function copyInivitationLink(event) {
  if (!game.gameUrl) return

  navigator.clipboard.writeText(game.gameUrl)
  alert(`Inivitation link copied to clipboard:\n${game.gameUrl}`)
}