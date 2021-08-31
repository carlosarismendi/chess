class Timer {
  constructor ({ selector, colorTimer, hours=0, minutes=0, seconds=0}) {
    this.element = document.getElementById(selector)
    this.colorTimer = colorTimer
    this.hours = hours
    this.minutes = minutes
    this.seconds = seconds

    this.currentTime = new Date()
    this.currentTime.setHours(hours, minutes, seconds, 500)

    this.element.innerText = this.#timeStr(this.currentTime)
  }

  start () {
    this.element.classList.remove('timer-stop')
    this.timer = setInterval(async () => {
      this.currentTime.setMilliseconds(this.currentTime.getMilliseconds() - 10)

      this.element.innerText = this.#timeStr(this.currentTime)

      if (this.currentTime.getMinutes() <= 0 && this.currentTime.getSeconds() <= 0) {
        let evt = new CustomEvent('timeout', { detail: { colorTimer: this.colorTimer } })
        window.dispatchEvent(evt)
        this.pause()
      }
    }, 10)
  }

  #timeStr(time) {
    let minutes = time.getMinutes()
    let seconds = time.getSeconds()
    let timeStr = (minutes < 10) ? `0${minutes}` : `${minutes}`
    timeStr = (seconds < 10) ? `${timeStr}:0${seconds}` : `${timeStr}:${seconds}`

    return timeStr
  }

  pause () {
    if (this.timer)
      clearInterval(this.timer)
  }

  reset () {
    this.pause()

    this.currentTime = new Date()
    this.currentTime.setHours(this.hours, this.minutes, this.seconds, 500)

    this.element.innerText = this.currentTime.toLocaleTimeString()
  }
}