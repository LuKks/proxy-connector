# proxy-connector

Proxy wrapper that ensures connectivity and supports fetch and axios

```
npm i proxy-connector
```

## Usage

```js
const ProxyConnector = require('proxy-connector')

const proxy = new ProxyConnector({
  protocol: 'http',
  host: 'example.com',
  port: 3128,
  username: 'example',
  password: 'secret123',
  session: Math.random().toString()
})

await proxy.check()

console.log(proxy.address)
```

Axios:

```js
const res = await axios.get('https://checkip.amazonaws.com', { proxy: proxy.toObject() })

console.log(res.data)
```

Fetch:

```js
const { HttpsProxyAgent } = require('https-proxy-agent')

const agent = new HttpsProxyAgent(proxy.toUpstream())
const res = await fetch('https://checkip.amazonaws.com', { agent })

console.log(await res.text())
```

## API

#### `proxy = new ProxyConnector(options)`

Create a new instance.

Options:

```js
{
  protocol, // Defaults to process.env.PROXY_PROTOCOL or 'http'
  host, // Defaults to process.env.PROXY_HOST
  port, // Defaults to process.env.PROXY_PORT
  username, // Defaults to process.env.PROXY_USERNAME
  password, // Defaults to process.env.PROXY_PASSWORD
  country, // E.g. 'ar' (depends on your provider)
  city,
  session, // Defaults to a random fixed session
  streaming: false
}
```

#### `proxy.url`

Returns a constructed URL based on the protocol, host, and port.

#### `proxy.password`

Returns a constructed password based on the country, city, and session.

#### `upstream = proxy.toUpstream()`

Returns the full proxy URL with username and password included.

Example: `http://user:pass@host.com:3128`

#### `upstream = proxy.toObject()`

Returns the proxy settings with username and password included.

Example: `{ protocol, host, port, auth: { username, password } }`.

#### `proxy.randomize()`

Changes the session to a new random one.

#### `await proxy.check()`

Ensures that the proxy works. It can be called multiple times.

It also saves the proxy IP in `proxy.address`.

It uses [connectivity-check](https://github.com/lukks/connectivity-check) internally.

## License

MIT
