class Timer {
  constructor ({ selector, hours=0, minutes=0, seconds=0}) {
    this.element = document.getElementById(selector)
    this.hours = hours
    this.minutes = minutes
    this.seconds = seconds

    this.currentTime = new Date()
    this.currentTime.setHours(hours, minutes, seconds, 500)

    this.element.innerText = this.currentTime.toLocaleTimeString()
  }

  start () {
    this.timer = setInterval(async () => {
      this.currentTime.setMilliseconds(this.currentTime.getMilliseconds() - 10)
      this.element.innerText = this.currentTime.toLocaleTimeString()
    }, 10)
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