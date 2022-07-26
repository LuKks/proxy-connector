const fetch = require('like-fetch')
const crypto = require('crypto')
const net = require('net')

module.exports = class ProxyConnector {
  constructor ({ protocol, host, port, username, password, country, city, session }) {
    this.protocol = protocol || 'http'
    this.host = host
    this.port = port
    this.username = username
    this.password = password

    this.country = country
    this.city = city
    this.session = session === undefined ? Math.random().toString() : session

    this.checker = 'https://checkip.amazonaws.com'
    this.originAddress = ''
    this.address = ''
  }

  get sessionId () {
    return 'sid' + crypto.createHash('md5').update(this.session).digest('hex')
  }

  _password () {
    const country = this.country ? ('_country-' + this.country) : ''
    const city = this.city ? ('_country-' + this.city) : ''
    const session = this.session ? ('_session-' + this.sessionId + '_lifetime-24h') : ''
    return this.password + country + city + session
  }

  toUpstream () {
    return this.protocol + '://' + this.username + ':' + this._password() + '@' + this.host + ':' + this.port
  }

  toObject () {
    return { protocol: this.protocol, host: this.host, port: this.port, auth: { username: this.username, password: this._password() } }
  }

  async localReady () {
    this.originAddress = await this._getRemoteAddress(this.checker)
  }

  async ready () {
    this.address = await this._getRemoteAddress(this.checker, { proxy: this.toUpstream() })
  }

  async _getRemoteAddress (url, opts = {}) {
    const body = await fetch(url, {
      timeout: 10000,
      retry: { max: 3 },
      validateStatus: 200,
      responseType: 'text',
      ...opts
    })

    const address = body.trim()
    if (net.isIP(address) === 0) {
      throw new Error('INVALID')
    }

    return address
  }
}
