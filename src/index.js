#!/usr/bin/env node
require('dotenv-safe').load()

var isUrl = require('is-url')
var axios = require('axios')
var Bottleneck = require('bottleneck')

var limiter = new Bottleneck(1, 3200)
var totalPinsToAdd = 0

require('cli').withStdinLines(function (rawLines, newline) {
  var lines = rawLines
    .filter((rawLine, index) => {
      var keep = rawLine.trim() !== ''

      if (!keep) {
        this.output('WARN: ignoring empty line ' + (index + 1))
      }

      return keep
    })
    .map((rawLine, index) => {
      var line = rawLine.trim()
      if (!isUrl(line)) {
        throw new Error('FATAL: Error parsing url on line ' + (index + 1) + ' of the input file.')
      } else {
        return line
      }
    })

  totalPinsToAdd = lines.length

  this.output('INFO: Processing ' + totalPinsToAdd + ' pins.')
  if (totalPinsToAdd > 0) {
    addPins(lines)
  }
})

function addPin (url) {
  console.log(url)
  return axios.get('https://api.pinboard.in/v1/posts/add?description=' + encodeURIComponent(url) + '&url=' + encodeURIComponent(url) + '&auth_token=' + process.env.PINBOARD_API_TOKEN)
}

function addPins (pins) {
  return pins.map((pin) => {
    return limiter.schedule(addPin, pin)
  })
}
