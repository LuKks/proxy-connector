# proxy-connector

Proxy wrapper that ensures connectivity and supports fetch, axios, etc.

![](https://img.shields.io/npm/v/proxy-connector.svg) ![](https://img.shields.io/npm/dt/proxy-connector.svg) ![](https://img.shields.io/badge/tested_with-tape-e683ff.svg) ![](https://img.shields.io/github/license/LuKks/proxy-connector.svg)

```
npm i proxy-connector
```

## Usage
```javascript
const ProxyConnector = require('proxy-connector')

const proxy = new ProxyConnector({
  protocol: 'http',
  host: 'example.com',
  port: 3128,
  username: 'example',
  password: 'secret123',
  session: Math.random().toString()
})

// Optional: ensure home/server connectivity
await proxy.localReady()
console.log(proxy.originAddress)

// Optional: ensure proxy connectivity
await proxy.ready()
console.log(proxy.address)
```

## Axios
```javascript
const res = await axios.get('https://checkip.amazonaws.com', { proxy: proxy.toObject() })
console.log(res.data)
```

## Fetch
```javascript
const HttpsProxyAgent = require('https-proxy-agent')

const agent = new HttpsProxyAgent(proxy.toUpstream())
const res = await fetch('https://checkip.amazonaws.com', { agent })
console.log(await res.text())
```

## License
MIT
