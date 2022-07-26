const tape = require('tape')
const ProxyConnector = require('./')
const net = require('net')
const axios = require('axios')
const fetch = require('like-fetch')

if (!process.env.PROXY_PROTOCOL || !process.env.PROXY_HOST || !process.env.PROXY_PORT || !process.env.PROXY_USERNAME || !process.env.PROXY_PASSWORD) {
  console.error('You have to pass all the ENV variables like this:')
  console.error('PROXY_PROTOCOL="http" PROXY_HOST="example.com" PROXY_PORT="3128" PROXY_USERNAME="example" PROXY_PASSWORD="secret123" npm run test')
  process.exit(1)
}

// Depending on your proxy provider stability, tests might fail
// due timeout, etc or geojs.io could report a different country, etc
// in that case, you should try running the tests again

tape('basic', async function (t) {
  const proxy = new ProxyConnector({
    protocol: process.env.PROXY_PROTOCOL,
    host: process.env.PROXY_HOST,
    port: process.env.PROXY_PORT,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
    session: Math.random().toString()
  })

  t.is(proxy.originAddress, '')
  await proxy.localReady()
  t.ok(net.isIP(proxy.originAddress) !== 0)

  t.is(proxy.address, '')
  await proxy.ready()
  t.ok(net.isIP(proxy.address) !== 0)

  t.notEqual(proxy.originAddress, proxy.address)
})

tape('toUpstream', async function (t) {
  const proxy = new ProxyConnector({
    protocol: process.env.PROXY_PROTOCOL,
    host: process.env.PROXY_HOST,
    port: process.env.PROXY_PORT,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
    session: Math.random().toString()
  })

  await proxy.ready()

  // const res = await fetch('https://checkip.amazonaws.com', { agent: new HttpsProxyAgent(proxy.toUpstream()) })
  const res = await fetch('https://checkip.amazonaws.com', { proxy: proxy.toUpstream() })
  const ip = (await res.text()).trim()
  t.is(ip, proxy.address)
})

tape('toObject', async function (t) {
  const proxy = new ProxyConnector({
    protocol: process.env.PROXY_PROTOCOL,
    host: process.env.PROXY_HOST,
    port: process.env.PROXY_PORT,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
    session: Math.random().toString()
  })

  await proxy.ready()

  const res = await axios.get('https://checkip.amazonaws.com', { proxy: proxy.toObject() })
  const ip = res.data.trim()
  t.is(ip, proxy.address)
})

tape('country, also fetch', async function (t) {
  const proxy = new ProxyConnector({
    protocol: process.env.PROXY_PROTOCOL,
    host: process.env.PROXY_HOST,
    port: process.env.PROXY_PORT,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
    session: Math.random().toString()
  })

  const checker = 'https://get.geojs.io/v1/ip/geo.json'

  proxy.country = 'ar'
  const res1 = await fetch(checker, { proxy: proxy.toUpstream(), retry: { max: 3 }, timeout: 10000 })
  const body1 = await res1.json()
  t.is(body1.country_code, 'AR')

  proxy.country = 'us'
  const res2 = await fetch(checker, { proxy: proxy.toUpstream(), retry: { max: 3 }, timeout: 10000 })
  const body2 = await res2.json()
  t.is(body2.country_code, 'US')

  proxy.country = 'au'
  const res3 = await fetch(checker, { proxy: proxy.toUpstream(), retry: { max: 3 }, timeout: 10000 })
  const body3 = await res3.json()
  t.is(body3.country_code, 'AU')

  proxy.country = 'mx'
  const res4 = await fetch(checker, { proxy: proxy.toUpstream(), retry: { max: 3 }, timeout: 10000 })
  const body4 = await res4.json()
  t.is(body4.country_code, 'MX')
})

tape('same session', async function (t) {
  const proxy = new ProxyConnector({
    protocol: process.env.PROXY_PROTOCOL,
    host: process.env.PROXY_HOST,
    port: process.env.PROXY_PORT,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
    session: Math.random().toString()
  })

  await proxy.ready()
  const address1 = proxy.address

  await proxy.ready()
  const address2 = proxy.address

  t.is(address1, address2)
})

tape('change session', async function (t) {
  const proxy = new ProxyConnector({
    protocol: process.env.PROXY_PROTOCOL,
    host: process.env.PROXY_HOST,
    port: process.env.PROXY_PORT,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
    session: Math.random().toString()
  })

  await proxy.ready()
  const address1 = proxy.address

  proxy.session = Math.random().toString()

  await proxy.ready()
  const address2 = proxy.address

  t.notEqual(address1, address2)
})
