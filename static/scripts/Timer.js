class Timer {
  #isStopped = true
  constructor ({ selector, colorTimer, hours=0, minutes=0, seconds=0}) {
    this.element = document.getElementById(selector)
    this.colorTimer = colorTimer
    this.hours = hours
    this.minutes = minutes
    this.seconds = seconds

    this.currentTime = new Date()
    this.currentTime.setHours(hours, minutes, seconds, 500)

    this.element.innerText = this.#timeStr(this.currentTime)
    this.#isStopped = true
  }

  start () {
    this.#isStopped = false
    this.element.classList.remove('timer-stop')
  }

  #timeStr(time) {
    let minutes = time.getMinutes()
    let seconds = time.getSeconds()
    let timeStr = (minutes < 10) ? `0${minutes}` : `${minutes}`
    timeStr = (seconds < 10) ? `${timeStr}:0${seconds}` : `${timeStr}:${seconds}`

    return timeStr
  }

  pause () {
    this.#isStopped = true
    if (this.timer)
      clearInterval(this.timer)
  }

  reset () {
    this.pause()

    this.currentTime = new Date()
    this.currentTime.setHours(this.hours, this.minutes, this.seconds, 500)

    this.element.innerText = this.currentTime.toLocaleTimeString()
  }

  setTimer(hours, minutes, seconds) {
    let wasStopped = this.#isStopped

    this.pause()
    console.log(minutes, seconds)
    this.currentTime.setHours(hours, minutes, seconds, 0)
    this.element.innerText = this.#timeStr(this.currentTime)
  }
}