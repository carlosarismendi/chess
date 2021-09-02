class MessageWS {
  #json = null

  constructor({
    idxSrc = 0, idxDst = 0,
    flag = FLAGS_WS.NONE
  }) {
    this.#json = {
      idxSrc: idxSrc,
      idxDst: idxDst,
      flag: flag
    }
  }

  toJSON() {
    return JSON.stringify(this.#json).toLowerCase()
  }
}
