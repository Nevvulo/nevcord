/**
 * Forked from DevYukine's http module and Snekfetch
 */

const querystring = require('querystring');
const https = require('https');
const http = require('http');
const url = require('url');

class HTTPError extends Error {
  constructor (message, res) {
    super(message);
    Object.assign(this, res);
    this.name = this.constructor.name;
  }
}

module.exports = class GenericRequest {
  constructor (method, uri) {
    this.opts = {
      method,
      uri,
      query: {},
      headers: {
        // todo: use discord UA
        'User-Agent': `Aethcord (https://github.com/aetheryx/aethcord)`
      }
    };
  }

  _objectify (key, value) {
    return key instanceof Object
      ? key
      : { [key]: value };
  }

  query (key, value) {
    Object.assign(this.opts.query, this._objectify(key, value));
    return this;
  }

  set (key, value) {
    Object.assign(this.opts.headers, this._objectify(key, value));
    return this;
  }

  send (data) {
    if (data instanceof Object) {
      const serialize = this.opts.headers['Content-Type'] === 'application/x-www-form-urlencoded'
        ? querystring.encode
        : JSON.stringify;

      this.opts.data = serialize(data);
    } else {
      this.opts.data = data;
    }

    return this;
  }

  execute () {
    return new Promise((resolve, reject) => {
      const { opts } = this;
      const { request } = opts.uri.startsWith('https')
        ? https
        : http;

      if (Object.keys(opts.query)[0]) {
        opts.uri += `?${querystring.encode(opts.query)}`;
      }

      const options = {
        ...opts,
        ...url.parse(opts.uri)
      };

      const req = request(options, (res) => {
        const data = [];

        res.on('data', (chunk) => {
          data.push(chunk);
        });

        res.once('error', reject);

        res.once('end', () => {
          const raw = String(Buffer.concat(data));

          const result = {
            raw,
            body: (() => {
              if ((/application\/json/).test(res.headers['content-type'])) {
                try {
                  return JSON.parse(raw);
                } catch (_) {
                  // fall through to raw
                }
              }

              return raw;
            })(),
            ok: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers
          };

          if (result.ok) {
            resolve(result);
          } else {
            reject(new HTTPError(`${res.statusCode} ${res.statusMessage}`, result));
          }
        });
      });

      req.once('error', reject);

      if (this.opts.data) {
        req.write(this.opts.data);
      }

      req.end();
    });
  }

  then (resolver, rejector) {
    if (this._res) {
      return this._res.then(resolver, rejector);
    }

    return (
      this._res = this.execute().then(resolver, rejector)
    );
  }

  catch (rejector) {
    return this.then(null, rejector);
  }
};