const crypto = require('crypto')
const connectivityCheck = require('connectivity-check')

module.exports = class ProxyConnector {
  constructor (opts = {}) {
    this.protocol = opts.protocol || process.env.PROXY_PROTOCOL || 'http'
    this.host = opts.host || process.env.PROXY_HOST
    this.port = opts.port || process.env.PROXY_PORT
    this.username = opts.username || process.env.PROXY_USERNAME || null
    this._password = opts.password || process.env.PROXY_PASSWORD || null

    if (!this.host || !this.port) {
      throw new Error('Proxy host or port is missing')
    }

    this.country = opts.country || null
    this.city = opts.city || null
    this.session = opts.session || randomId()
    this.streaming = !!opts.streaming

    this.originAddress = null
    this.address = null
  }

  get sessionId () {
    // TODO: Remove old obfuscation on next version
    return 'sid' + crypto.createHash('md5').update(this.session).digest('hex')
  }

  get url () {
    return this.protocol + '://' + this.host + ':' + this.port
  }

  get password () {
    const country = this.country ? ('_country-' + this.country) : ''
    const city = this.city ? ('_country-' + this.city) : ''
    const session = this.session ? ('_session-' + this.sessionId + '_lifetime-168h') : ''
    const streaming = this.streaming ? ('_streaming-1') : ''

    return this._password + country + city + session + streaming
  }

  set password (value) {
    this._password = value
  }

  toUpstream () {
    const auth = this.username ? (this.username + ':' + this.password + '@') : ''

    return this.protocol + '://' + auth + this.host + ':' + this.port
  }

  toObject () {
    const auth = this.username ? { username: this.username, password: this.password } : null

    return { protocol: this.protocol, host: this.host, port: this.port, auth }
  }

  randomize () {
    this.session = randomId()
  }

  async check (local) {
    if (local) {
      this.originAddress = await connectivityCheck()
    } else {
      this.address = await connectivityCheck({ proxy: this.toUpstream() })
    }
  }

  // Keeping those for backwards compatibility
  async localReady () {
    await this.check(true)
  }

  async ready () {
    await this.check()
  }
}

function randomId () {
  return Math.random().toString().slice(2)
}
