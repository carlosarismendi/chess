let game = null
const host = window.location.host

window.onload = init
window.onclick = (event) => {
  let modal = document.getElementById('modal')
  if (event.target == modal)
  {
    modal.style.display = 'none'
  }
}

function init () {
  window.addEventListener("modal", showModal)
  window.addEventListener("drawoffer", showDrawOffer)

  game = new Game({ selector: '#board', fen_string: INITIAL_POSITION_FEN, wsConn: null })

  let gameToken = new URLSearchParams(window.location.search).get('token')
  if (gameToken) {
    game.createWebSocketConnection(host, `join-game/${gameToken}`)
  }
}

function newGame () {
  game.createWebSocketConnection(host, 'new-game')
  let evt = { detail: { title: 'Game created', body: `Click on "Copy link" to obtain the share link.` }}
  showModal(evt)
}

function abandonGame () {
  game.abandonGame()
}

function offerDraw () {
  game.offerDraw()
}

function acceptDraw () {
  game.acceptDraw()
}

function declineDraw () {
  game.declineDraw()
}

function copyInivitationLink() {
  if (!game.gameUrl) return

  navigator.clipboard.writeText(game.gameUrl)
  let evt = { detail: { title: 'Share link', body: `The share link has been copied to your clipboard.` }}
  showModal(evt)
}


// ###### EVENT HANDLERS ######
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

function showDrawOffer(event) {
  let acceptElem = document.getElementById('accept-draw')
  acceptElem.hidden = event.detail.hidden

  let declineElem = document.getElementById('decline-draw')
  declineElem.hidden = event.detail.hidden
}