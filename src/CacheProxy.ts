import * as httpProxy from 'http-proxy';
import { IncomingMessage, ServerResponse, ClientRequest } from 'http';
import { PassThrough, Readable } from 'stream';
import { wordpressBypassRules, wordpressCacheRules } from './rules/wordpress';
import { getNameSpace, hashRequestUrl } from './helpers';
import { WebCache } from './cache';
import { headerPasses } from './headers';

export interface CacheProxy {
  web(req: IncomingMessage, res: ServerResponse): Promise<void>;
}

export function createCacheProxy(
  cache: WebCache,
  proxyOptions?: httpProxy.ServerOptions
): CacheProxy {
  const _proxy = httpProxy.createProxy({
    xfwd: true,
    /* selfHandleResponse: true, */
    ...proxyOptions
  });

  async function isCached(req: IncomingMessage): Promise<boolean> {
    const namespace = getNameSpace(req);
    const key = hashRequestUrl(req);

    return cache.has(namespace, `${key}.json`);
  }

  async function applyHeaders(
    pReq: IncomingMessage,
    req: IncomingMessage,
    res: ServerResponse
  ) {
    const headPasses = Object.keys(headerPasses);
    headPasses.forEach(key => {
      headerPasses[key](req, res, pReq, proxyOptions);
    });
  }

  async function cacheResponse(
    pReq: Readable,
    req: IncomingMessage,
    res: ServerResponse
  ) {
    const namespace = getNameSpace(req);
    const key = hashRequestUrl(req);
    // cache content
    cache.setStream(namespace, key.toString(), pReq);
    // cache headers
    pReq.on('end', () => {
      const headers: string = JSON.stringify(res.getHeaders());
      cache.setValue(namespace, `${key}.json`, headers);
    });
  }

  async function serveCache(req: IncomingMessage, res: ServerResponse) {
    const namespace = getNameSpace(req);
    const key = hashRequestUrl(req);

    const headersString = await cache.getValue(namespace, `${key}.json`);
    const headers = JSON.parse(headersString);
    // write headers
    Object.keys(headers).forEach(header => {
      res.setHeader(header, headers[header]);
    });
    res.setHeader('x-from-cache', 1);
    // get stream from storage
    const stream = await cache.getStream(namespace, key.toString());
    stream.pipe(res);
  }

  async function serveFromOrigin(req: IncomingMessage, res: ServerResponse) {
    _proxy.web(req, res, {
      target: {
        host: 'vocalisator.com',
        hostname: '185.104.29.58',
        protocol: 'http:'
      },
      changeOrigin: true,
      secure: false
    });
  }

  async function web(req: IncomingMessage, res: ServerResponse) {
    // middleware to check if request can be from cache
    const serveFromCache = !wordpressBypassRules.some(
      rule => rule(req) === false
    );

    if (!serveFromCache) {
      serveFromOrigin(req, res);
    } else if (await isCached(req)) {
      serveCache(req, res);
    } else {
      serveFromOrigin(req, res);
    }
  }

  async function proxyReq(
    pReq: ClientRequest,
    req: IncomingMessage,
    res: ServerResponse
  ) {
    // console.log('proxyReq', getNameSpace(req), pReq.getHeaders());
  }

  async function proxyRes(
    pReq: IncomingMessage,
    req: IncomingMessage,
    res: ServerResponse
  ) {
    // apply headers
    // applyHeaders(pReq, req, res);

    // create passthrough stream
    const stream = new PassThrough();
    pReq.pipe(stream);
    // pReq.pipe(res);
    const shouldCache = !wordpressCacheRules.some(
      rule => rule(pReq, req) === false
    );

    if (shouldCache) {
      await cacheResponse(stream, req, res);
    }
  }

  _proxy.on('proxyReq', proxyReq);
  _proxy.on('proxyRes', proxyRes);

  return Object.freeze({
    web
  });
}
