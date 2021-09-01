class MessageWS {
  constructor({
    fileSrc = 0, rankSrc = 0,
    fileDst = 0, rankDst = 0,
    legalMove = false,
    checkMate = false,
    abandon = false,
    createGame = false,
    timeOut = false
  }) {
    this.json = {
      fileSrc: fileSrc,
      rankSrc: rankSrc,
      fileDst: fileDst,
      rankDst: rankDst,
      legalMove: legalMove,
      checkMate: checkMate,
      abandon: abandon,
      createGame: createGame,
      timeOut: timeOut
    }
  }

  toJSON() {
    return JSON.stringify(this.json).toLowerCase()
  }
}