class MessageWS {
  constructor({
    fileSrc = null, rankSrc = null,
    fileDst = null, rankDst = null,
    legalMove = null,
    checkMate = null,
    abandon = null,
    createGame = null
  }) {
    this.fileSrc    = fileSrc
    this.rankSrc    = rankSrc
    this.fileDst    = fileDst
    this.rankDst    = rankDst
    this.legalMove  = legalMove
    this.checkMate  = checkMate
    this.abandon    = abandon
    this.createGame = createGame
  }

  toJson() {
    return JSON.stringify(this).toLowerCase()
  }
}