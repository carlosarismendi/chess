class Game {
  #boardSelector = null;
  #playerColor = null;
  #board = null;
  #colorToPlay = null;
  #isCheck = null;
  #pawnJump = null;
  #cellsToProtect = null;
  #whiteCastle = null;
  #blackCastle = null;
  #whiteTimer = null;
  #blackTimer = null;
  #duration = null;
  #wsConn = null;
  #lastMoveSrc = null;
  #lastMoveDst = null;
  #gameStarted = null;
  #moveAudio = null;
  #gameInitAudio = null;
  #drawRequestActive = null
  #receiveDrawRequest = null

  constructor({ selector, fen_string, host = null, connPath = null, duration = 10 }) {
    this.#boardSelector = selector
    this.#playerColor = COLORS.WHITE
    this.#board = new Board({ selector: selector, colorDown: this.#playerColor })
    this.createWebSocketConnection(host, connPath)

    let gameInfo = this.#board.initFromFENNotation(fen_string)
    this.#colorToPlay = gameInfo.colorToPlay
    this.#isCheck = false
    this.#pawnJump = -99
    this.#cellsToProtect = []
    this.#whiteCastle = gameInfo.whiteCastle
    this.#blackCastle = gameInfo.blackCastle

    this.#addEventListenersToPieces()

    this.#whiteTimer = new Timer({ selector: 'up-timer', minutes: duration })
    this.#blackTimer = new Timer({ selector: 'down-timer', minutes: duration })
    this.#duration = duration

    window.addEventListener('timeout', ((event) => {
      let colorTimer = event.detail.colorTimer
      if (colorTimer === this.#playerColor) {
        this.#sendWebSocketMessage(new MessageWS({ flag: FLAGS_WS.TIMEOUT }))

        let detail = { title: 'You lose', body: 'You lose because of time.' }
        window.dispatchEvent(new CustomEvent("modal", { detail: detail }))
      } else {
        let detail = { title: 'You win', body: 'You win because of time.' }
        window.dispatchEvent(new CustomEvent("modal", { detail: detail }))
      }
      this.#wsConn.close()
    }).bind(this))

    this.#lastMoveSrc = null
    this.#lastMoveDst = null
    this.#gameStarted = false

    this.#moveAudio = new Audio('../assets/chess-move.mp3')
    this.#gameInitAudio = new Audio('../assets/chess-init.mp3')
  }

  createWebSocketConnection(host, connPath) {
    if (!host || !connPath) {
      this.#wsConn = null
      return
    }

    if (this.#wsConn) {
      this.#sendWebSocketMessage(new MessageWS({ flag: FLAGS_WS.ABANDON }))
      this.#wsConn.close()
    }

    if (this.#gameStarted) {
      this.#endGame()
    }

    const protocol = (window.location.protocol.includes("s")) ? "wss" : "ws"
    this.#wsConn = new WebSocket(`${protocol}://${host}/${connPath}`,)
    this.#wsConn.onmessage = this.#onwsmessage.bind(this)
  }

  offerDraw() {
    if (!this.#drawRequestActive) {
      this.#sendWebSocketMessage(new MessageWS({ flag: FLAGS_WS.OFFER_DRAW }))
      this.#drawRequestActive = true
    }
  }

  acceptDraw() {
    this.#drawRequestActive = false
    this.#receiveDrawRequest = false

    let detail = { title: 'Draw', body: 'You have accepted draw.' }
    window.dispatchEvent(new CustomEvent("modal", { detail: detail }))
    window.dispatchEvent(new CustomEvent("drawoffer", { detail: { hidden: true } }))
    this.#sendWebSocketMessage(new MessageWS({ flag: FLAGS_WS.ACCEPT_DRAW }))
    this.#endGame()
  }

  declineDraw() {
    this.#receiveDrawRequest = false
    window.dispatchEvent(new CustomEvent("drawoffer", { detail: { hidden: true } }))
    this.#sendWebSocketMessage(new MessageWS({ flag: FLAGS_WS.DECLINE_DRAW }))
  }

  abandonGame() {
    if (this.#gameStarted) {
      this.#sendWebSocketMessage(new MessageWS({ flag: FLAGS_WS.ABANDON }))

      let detail = { title: 'You lose', body: 'You lose because you have abandoned.' }
      window.dispatchEvent(new CustomEvent("modal", { detail: detail }))

      this.#endGame()
    }
  }

  #sendWebSocketMessage(message) {
    if (!this.#wsConn) return

    const payload = message.toJSON()
    this.#wsConn.send(payload)
  }

  #restart() {
    this.#board = new Board({ selector: this.#boardSelector, colorDown: this.#playerColor })

    let gameInfo = this.#board.initFromFENNotation(INITIAL_POSITION_FEN)
    this.#colorToPlay = gameInfo.colorToPlay
    this.#whiteCastle = gameInfo.whiteCastle
    this.#blackCastle = gameInfo.blackCastle
    this.#isCheck = false
    this.#cellsToProtect = []

    this.#calcLegalMovesForAllPieces()

    this.#addEventListenersToPieces()

    if (this.#playerColor === COLORS.WHITE) {
      this.#whiteTimer = new Timer({ selector: 'down-timer', minutes: this.#duration, colorTimer: COLORS.WHITE })
      this.#blackTimer = new Timer({ selector: 'up-timer', minutes: this.#duration, colorTimer: COLORS.BLACK })
    } else {
      this.#whiteTimer = new Timer({ selector: 'up-timer', minutes: this.#duration, colorTimer: COLORS.WHITE })
      this.#blackTimer = new Timer({ selector: 'down-timer', minutes: this.#duration, colorTimer: COLORS.BLACK })
    }

    this.#whiteTimer.start()
    this.#gameStarted = true
    this.#gameInitAudio.play()
  }

  #addEventListenersToPieces() {
    for (let file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
      for (let rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
        let idx = this.#board.fileAndRankToIdx(file, rank)
        let element = this.#board.getElementByIdx(idx)

        element.setAttribute('draggable', 'true')
        element.addEventListener('mousedown', this.#mousedown.bind(this, file, rank))
        element.addEventListener('mouseup', this.#mouseup.bind(this, file, rank))
        element.addEventListener('dragstart', this.#dragstart.bind(this, file, rank))
        element.addEventListener('dragover', this.#dragover)
        element.addEventListener('drop', this.#drop.bind(this, file, rank))
      }
    }
  }

  #mousedown(fileSrc, rankSrc, event) {

    let { idx, piece } = this.#board.getPiece(fileSrc, rankSrc)

    if (piece && piece.color !== this.#playerColor || !this.#gameStarted)
      return

    this.#showLegalMoves(piece)
  }

  #mouseup(fileSrc, rankSrc, event) {
    let { idx, piece } = this.#board.getPiece(fileSrc, rankSrc)

    this.#hideLegalMoves(piece)
  }

  #dragstart(fileSrc, rankSrc, event) {
    event.dataTransfer.setData('text/plain', JSON.stringify({ fileSrc: fileSrc, rankSrc: rankSrc }))
    event.dataTransfer.effectAllowed = 'move'
  }

  #dragover(event) {
    event.preventDefault();
  }

  #drop(fileDst, rankDst, event) {
    event.preventDefault();
    if (this.#colorToPlay !== this.#playerColor || !this.#gameStarted)
      return

    let pieces = this.#board.pieces

    // Target cell gets data from piece of source cell
    let { fileSrc, rankSrc } = JSON.parse(event.dataTransfer.getData('text/plain'))
    let { idx: idxSrc, piece: pieceSrc } = this.#board.getPiece(fileSrc, rankSrc)
    let { idx: idxDst, piece: pieceDst } = this.#board.getPiece(fileDst, rankDst)

    if (pieceSrc && pieceSrc.color !== this.#playerColor)
      return

    this.#hideLegalMoves(pieceSrc)

    // Check that user is not dropping in the same cell or trying to drag an empty cell
    if (!pieceSrc || pieceDst && (pieceSrc.file === pieceDst.file && pieceSrc.rank === pieceDst.rank || pieceSrc.type === PIECES.EMPTY))
      return

    // Check if movement is valid
    if (!pieceSrc.legalMoves.includes(idxDst)) {
      return
    }

    this.#moveSend(idxSrc, pieceSrc, idxDst, fileDst, rankDst, pieceDst, true)

    this.#updateTurn()
    if (this.#isForcedDraw(true)) return

    this.#searchForCheck()
    const checkmate = this.#calcLegalMovesForAllPieces()

    if (checkmate) {
      let detail = { title: 'You win', body: 'You win because of chekmate.' }
      window.dispatchEvent(new CustomEvent("modal", { detail: detail }))
      this.#sendWebSocketMessage(new MessageWS({ flag: FLAGS_WS.CHECKMATE }))
      this.#endGame()
    }

    if(this.#receiveDrawRequest) this.declineDraw()


  }

  #moveSend(idxSrc, pieceSrc, idxDst, fileDst, rankDst, pieceDst, send = true) {
    this.#showLastMove(idxSrc, idxDst)


    if (send) {
      let payload = new MessageWS({ idxSrc: idxSrc, idxDst: idxDst })
      this.#sendWebSocketMessage(payload)
    }

    let lastRank = pieceSrc.rank
    let lastFile = pieceSrc.file

    //pawn have moved in diagonal without kill
    if (pieceSrc.type === PIECES.PAWN && pieceDst == null && fileDst !== lastFile) {
      let { idx, piece } = this.#board.getPiece(fileDst, lastRank)
      this.#board.removePiece(piece)
    }
    else {
      this.#board.removePiece(pieceDst)
    }

    pieceSrc.firstMove = false
    pieceSrc.setCell(fileDst, rankDst)
    this.#board.pieces[idxSrc] = PIECES.EMPTY
    this.#board.pieces[idxDst] = pieceSrc.type | pieceSrc.color

    // Check if piece is a pawn that has reached promotion ranks
    if (pieceSrc.rank === RANKS.RANK_8 && pieceSrc.type === PIECES.PAWN && pieceSrc.color === COLORS.WHITE) {
      this.#board.PawnPromotion(pieceSrc, idxDst)
    }
    else if (pieceSrc.rank === RANKS.RANK_1 && pieceSrc.type === PIECES.PAWN && pieceSrc.color === COLORS.BLACK) {
      this.#board.PawnPromotion(pieceSrc, idxDst)
    }
    else if (pieceSrc.type === PIECES.KING) { // enroque
      if (idxSrc - idxDst === 2) { // left
        let idxRook = idxSrc - 4
        let idxDst = idxRook + 3

        let { idx1, piece: lrook } = this.#board.getPieceByIdx(idxRook)
        let { idx2, piece: pieceDst } = this.#board.getPieceByIdx(idxDst)

        let { file, rank } = this.#board.idxToFileAndRank(idxDst) // dst
        this.#moveSend(idxRook, lrook, idxDst, file, rank, pieceDst, false)
      }
      else if (idxSrc - idxDst === -2) { // right
        let idxRook = idxSrc + 3
        let idxDst = idxRook - 2

        let { idx1, piece: lrook } = this.#board.getPieceByIdx(idxRook)
        let { idx2, piece: pieceDst } = this.#board.getPieceByIdx(idxDst)

        let { file, rank } = this.#board.idxToFileAndRank(idxDst) // dst
        this.#moveSend(idxRook, lrook, idxDst, file, rank, pieceDst, false)
      }
    }

    this.#moveAudio.play()
  }

  #moveReceive(idxSrc, pieceSrc, idxDst, fileDst, rankDst, pieceDst) {
    let lastRank = pieceSrc.rank
    let lastFile = pieceSrc.file

    //pawn have moved in diagonal without kill
    if (pieceSrc.type === PIECES.PAWN && pieceDst == null && fileDst !== lastFile) {
      let { idx, piece } = this.#board.getPiece(fileDst, lastRank)
      this.#board.removePiece(piece)
    }
    else {
      this.#board.removePiece(pieceDst)
    }
    this.#pawnJump = -99
    this.#showLastMove(idxSrc, idxDst)

    pieceSrc.firstMove = false
    pieceSrc.setCell(fileDst, rankDst)
    this.#board.pieces[idxSrc] = PIECES.EMPTY
    this.#board.pieces[idxDst] = pieceSrc.type | pieceSrc.color

    // Check if piece is a pawn that has reached promotion ranks
    if (pieceSrc.type === PIECES.PAWN) {
      if (pieceSrc.color === COLORS.WHITE) {
        if (pieceSrc.rank === RANKS.RANK_8) { // Last row
          this.#board.PawnPromotion(pieceSrc, idxDst)
        }
      }
      else {
        if (pieceSrc.rank === RANKS.RANK_1) { // Last row
          this.#board.PawnPromotion(pieceSrc, idxDst)
        }
      }

      // check if the player jumped with the pawn
      if (abs(rankDst - lastRank) === 2) {
        this.#pawnJump = lastFile
      }
    }
    else if (pieceSrc.type === PIECES.KING) { // enroque
      if (idxSrc - idxDst === 2) { // left
        let idxRook = idxSrc - 4
        let idxDst = idxRook + 3

        let { idx1, piece: lrook } = this.#board.getPieceByIdx(idxRook)
        let { idx2, piece: pieceDst } = this.#board.getPieceByIdx(idxDst)

        let { file, rank } = this.#board.idxToFileAndRank(idxDst) // dst
        this.#moveSend(idxRook, lrook, idxDst, file, rank, pieceDst, false)
      }
      else if (idxSrc - idxDst === -2) { // right
        let idxRook = idxSrc + 3
        let idxDst = idxRook - 2

        let { idx1, piece: lrook } = this.#board.getPieceByIdx(idxRook)
        let { idx2, piece: pieceDst } = this.#board.getPieceByIdx(idxDst)

        let { file, rank } = this.#board.idxToFileAndRank(idxDst) // dst
        this.#moveSend(idxRook, lrook, idxDst, file, rank, pieceDst, false)
      }
    }

    this.#updateTurn()
    this.#searchForCheck()
    this.#calcLegalMovesForAllPieces()

    this.#moveAudio.play()
  }

  // Calculates legal moves for all pieces and send a message if its checkmate
  #calcLegalMovesForAllPieces() {
    let whiteCanMove = false
    this.#board.whitePieces.forEach(async piece => {
      this.#board.calcLegalMoves(piece, this.#colorToPlay, this.#isCheck, this.#cellsToProtect, this.#pawnJump)
      whiteCanMove = piece.legalMoves.length > 0 || whiteCanMove
    })

    let blackCanMove = false
    this.#board.blackPieces.forEach(async piece => {
      this.#board.calcLegalMoves(piece, this.#colorToPlay, this.#isCheck, this.#cellsToProtect, this.#pawnJump)
      blackCanMove = piece.legalMoves.length > 0 || blackCanMove
    })

    const checkmate = !blackCanMove && !whiteCanMove
    return checkmate
  }

  /*
    Sets variables isCheck and cellsToProtect
  */
  #searchForCheck() {
    let king = this.#board.getKing(this.#colorToPlay)
    let kingIdx = this.#board.fileAndRankToIdx(king.file, king.rank)
    let enemyColor = this.#colorToPlay ^ COLORS.WHITE
    let bullies = this.#board.bullyPiecesIdx(kingIdx, enemyColor)

    if (bullies.length != 0) {
      this.#isCheck = true
      this.#cellsToProtect = []

      if (bullies.length > 1) { // cant be bloqued
        this.#cellsToProtect = []
      }
      else {
        let bullyIdx = bullies[0]
        let bullyTypeColor = this.#board.pieces[bullyIdx] // type | color
        let bullyColor = bullyTypeColor & COLORS.WHITE
        let bullyType = bullyTypeColor - bullyColor

        if (bullyType === PIECES.KNIGHT) { // cant block knight, only kill him
          this.#cellsToProtect = this.#cellsToProtect.concat(bullyIdx)
        } else {
          this.#cellsToProtect = this.#cellsToProtect.concat(this.#board.getMovesFromTo(kingIdx, bullyIdx, PIECE_OFFSETS.KING)) //path to block or kill
        }

      }
    } else {
      this.#isCheck = false
      this.#cellsToProtect = []
    }
  }

  /**
   * The game is only king vs king
   */
  #isForcedDraw (sendSocket = false) {
    if (this.#board.blackPieces.length === 1 && this.#board.whitePieces.length === 1) {
      if (sendSocket)
        this.#sendWebSocketMessage(new MessageWS({ flag: FLAGS_WS.FORCED_DRAW }))

      let detail = { title: 'Draw', body: 'Insufficient material.' }
      showModal(new CustomEvent('modal', { detail: detail }))
      this.#endGame()
      return true
    }

    return false
  }

  #updateTurn() {
    if (this.#colorToPlay === COLORS.WHITE) {
      this.#whiteTimer.pause()
      this.#blackTimer.start()

      this.#whiteTimer.element.classList.add('timer-stop')
      this.#blackTimer.element.classList.remove('timer-stop')
      this.#colorToPlay = COLORS.BLACK
    } else {
      this.#whiteTimer.start()
      this.#blackTimer.pause()

      this.#whiteTimer.element.classList.remove('timer-stop')
      this.#blackTimer.element.classList.add('timer-stop')
      this.#colorToPlay = COLORS.WHITE
    }
  }

  #endGame() {
    this.#whiteTimer.pause()
    this.#blackTimer.pause()
    this.#wsConn.close()
    this.#gameStarted = false
  }

  #onwsmessage(event) {
    let msg = JSON.parse(event.data)

    if (msg.errorcode || (typeof msg) == 'number') {
      return
    }

    if (msg.url) {
      this.gameUrl = msg.url
      return
    }

    if (msg.timer) {
      if (this.#playerColor === COLORS.WHITE) {
        this.#whiteTimer.setTimer(0, msg.timer.minutes, msg.timer.seconds)
        this.#blackTimer.setTimer(0, msg.opponentTimer.minutes, msg.opponentTimer.seconds)
      } else {
        this.#whiteTimer.setTimer(0, msg.opponentTimer.minutes, msg.opponentTimer.seconds)
        this.#blackTimer.setTimer(0, msg.timer.minutes, msg.timer.seconds)
      }
      return
    }

    let detail = null
    switch (msg.flag) {
      case FLAGS_WS.CHECKMATE:
        detail = { title: 'You lose', body: 'You lose because of chekmate.' }
        window.dispatchEvent(new CustomEvent("modal", { detail: detail }))
        this.#endGame()
        return

      case FLAGS_WS.ABANDON:
        detail = { title: 'You win', body: 'You win because your oppenent abandoned.' }
        window.dispatchEvent(new CustomEvent("modal", { detail: detail }))
        this.#endGame()
        return

      case FLAGS_WS.TIMEOUT:
        detail = { title: 'You win', body: 'You win because of time.' }
        window.dispatchEvent(new CustomEvent("modal", { detail: detail }))
        this.#endGame()
        return

      case FLAGS_WS.OFFER_DRAW:
        detail = { title: 'Draw offer', body: 'Your opponent offered draw.' }
        window.dispatchEvent(new CustomEvent("modal", { detail: detail }))
        window.dispatchEvent(new CustomEvent("drawoffer", { detail: { hidden: false } }))
        this.#receiveDrawRequest = true
        return

      case FLAGS_WS.ACCEPT_DRAW:
        this.acceptDraw()
        return

      case FLAGS_WS.DECLINE_DRAW:
        detail = { title: 'Draw offer', body: 'Your opponent declined draw.' }
        window.dispatchEvent(new CustomEvent("modal", { detail: detail }))
        window.dispatchEvent(new CustomEvent("drawoffer", { detail: { hidden: true } }))
        this.#drawRequestActive = false
        return

      case FLAGS_WS.FORCED_DRAW:
        this.#isForcedDraw(false)
        return

      case FLAGS_WS.GAME_START:
        this.#playerColor = (msg.color == "White") ? COLORS.WHITE : COLORS.BLACK
        this.#restart()
        return

      default:
        let { idx: idxSrc, piece: pieceSrc } = this.#board.getPieceByIdx(msg.idxsrc)
        let { idx: idxDst, piece: pieceDst } = this.#board.getPieceByIdx(msg.idxdst)
        let { file: fileDst, rank: rankDst } = this.#board.idxToFileAndRank(idxDst)
        this.#moveReceive(idxSrc, pieceSrc, idxDst, fileDst, rankDst, pieceDst)
    }
  }

  async #showLegalMoves(piece) {
    if (!piece) return

    piece.legalMoves.forEach(idx => {
      let element = this.#board.getElementByIdx(idx)
      element.classList.add('legal-move')
    });
  }

  async #hideLegalMoves(piece) {
    if (!piece) return

    piece.legalMoves.forEach(idx => {
      let element = this.#board.getElementByIdx(idx)
      element.classList.remove('legal-move')
    });
  }

  async #showLastMove(idxSrc, idxDst) {
    this.#hideLastMove()

    this.#lastMoveSrc = this.#board.getElementByIdx(idxSrc)
    this.#lastMoveDst = this.#board.getElementByIdx(idxDst)

    this.#lastMoveSrc.classList.add('last-move')
    this.#lastMoveDst.classList.add('last-move')
  }

  async #hideLastMove() {
    if (this.#lastMoveSrc && this.#lastMoveDst) {
      this.#lastMoveSrc.classList.remove('last-move')
      this.#lastMoveDst.classList.remove('last-move')
    }
  }
}