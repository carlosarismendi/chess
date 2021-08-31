let game = null
const host = window.location.host

window.onload = init
window.onclick = (event) => {
  let modal = document.getElementById('modal')
  if (event.target == modal)
  {
    modalElem.style.display = 'none'
  }
}

function init () {
  window.addEventListener("win", showModal)
  window.addEventListener("lose", showModal)

  game = new Game({ selector: '#board', fen_string: INITIAL_POSITION_FEN, wsConn: null })

  let gameToken = new URLSearchParams(window.location.search).get('token')
  if (gameToken) {
    game.createWebSocketConnection(host, `join-game/${gameToken}`)
  }
}

function newGame () {
  game.createWebSocketConnection(host, 'new-game')
}

function copyInivitationLink(event) {
  if (!game.gameUrl) return

  navigator.clipboard.writeText(game.gameUrl)
  alert(`Inivitation link copied to clipboard:\n${game.gameUrl}`)
}

function showModal(event) {
  let modal = document.getElementById('modal')
  let modalTitle = document.getElementById('modal-title')
  let modalBody = document.getElementById('modal-body')

  modalTitle.innerText = event.detail.title
  modalBody.innerText = event.detail.body

  modal.style.display = 'block'
}

function hideModal(event) {
  let modalElem = document.getElementById('modal')
  modalElem.style.display = 'none'
}
