const net = require('net')
const test = require('brittle')
const dotenv = require('dotenv')
const axios = require('axios')
const fetch = require('like-fetch')
const { HttpsProxyAgent } = require('https-proxy-agent')
const ProxyConnector = require('./index.js')

dotenv.config()

if (
  !process.env.PROXY_PROTOCOL ||
  !process.env.PROXY_HOST ||
  !process.env.PROXY_PORT ||
  !process.env.PROXY_USERNAME ||
  !process.env.PROXY_PASSWORD
) {
  console.error('Missing env variables')
  process.exit(1)
}

test('basic', async function (t) {
  const proxy = new ProxyConnector({
    protocol: process.env.PROXY_PROTOCOL,
    host: process.env.PROXY_HOST,
    port: process.env.PROXY_PORT,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
    // Higher or better pool of proxies
    country: 'us',
    streaming: true
  })

  t.is(proxy.originAddress, null)
  await proxy.check(true)
  t.ok(net.isIP(proxy.originAddress) !== 0)

  t.is(proxy.address, null)
  await proxy.check()
  t.ok(net.isIP(proxy.address) !== 0)

  t.not(proxy.originAddress, proxy.address)
})

test('inherit env', async function (t) {
  const proxy = new ProxyConnector({ country: 'us', streaming: true })
  const upstream = proxy.toObject()

  t.ok(upstream.protocol)
  t.ok(upstream.host)
  t.ok(upstream.port)
  t.ok(upstream.auth.username)
  t.ok(upstream.auth.password)

  await proxy.check(true)
  await proxy.check()

  t.ok(net.isIP(proxy.originAddress) !== 0)
  t.ok(net.isIP(proxy.address) !== 0)

  t.not(proxy.originAddress, proxy.address)
})

test('toUpstream', async function (t) {
  const proxy = new ProxyConnector({ country: 'us', streaming: true })

  await proxy.check()

  const agent = new HttpsProxyAgent(proxy.toUpstream())
  const res = await fetch('https://checkip.amazonaws.com', { agent })
  const ip = (await res.text()).trim()

  t.is(ip, proxy.address)
})

test('toObject', async function (t) {
  const proxy = new ProxyConnector({ country: 'us', streaming: true })

  await proxy.check()

  const res = await axios.get('https://checkip.amazonaws.com', { proxy: proxy.toObject() })
  const ip = res.data.trim()

  t.is(ip, proxy.address)
})

test('country', async function (t) {
  const proxy = new ProxyConnector({ country: 'us', streaming: true })

  const GEO_URL = 'https://get.geojs.io/v1/ip/geo.json'

  proxy.country = 'ar'
  const res1 = await fetch(GEO_URL, { agent: HPA(proxy), retry: { max: 3 }, timeout: 10000 })
  const body1 = await res1.json()
  t.is(body1.country_code, 'AR')

  proxy.country = 'us'
  const res2 = await fetch(GEO_URL, { agent: HPA(proxy), retry: { max: 3 }, timeout: 10000 })
  const body2 = await res2.json()
  t.is(body2.country_code, 'US')

  function HPA (proxy) {
    return new HttpsProxyAgent(proxy.toUpstream())
  }
})

test('same session', async function (t) {
  const a = new ProxyConnector({ country: 'us', streaming: true })
  await a.check()

  const b = new ProxyConnector({ session: a.session, country: 'us', streaming: true })
  await b.check()

  t.is(a.address, b.address)
})

test('change session', async function (t) {
  const proxy = new ProxyConnector({ country: 'us', streaming: true })

  await proxy.check()
  const address1 = proxy.address

  proxy.session = Math.random().toString()

  await proxy.check()
  const address2 = proxy.address

  t.not(address1, address2)
})

test('randomize', async function (t) {
  const proxy = new ProxyConnector({ country: 'us', streaming: true })

  await proxy.check()
  const address1 = proxy.address

  const session1 = proxy.session
  proxy.randomize()
  const session2 = proxy.session

  await proxy.check()
  const address2 = proxy.address

  t.not(address1, address2)
  t.not(session1, session2)
})
