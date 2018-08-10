import * as httpProxy from 'http-proxy';
import { PassThrough } from 'stream';
import { IncomingMessage, ServerResponse } from 'http';
import * as Fs from 'fs-extra';
import * as Path from 'path';
import hash from './helpers/hash';

export interface CacheOptions {
  contentTypes?: string[];
  maxLength?: number;
}

function shouldCacheProxy(
  proxy: IncomingMessage,
  req: IncomingMessage,
  contentTypes,
  maxLength
): boolean {
  // only cache get
  const method = req.method;
  const contentType = proxy.headers['content-type'];
  const shouldCacheContentType = contentTypes.some(t =>
    contentType.includes(t)
  );
  const contentLength = parseInt(proxy.headers['content-length']);

  console.log(method, contentType, shouldCacheContentType, contentLength);

  return (
    method === 'GET' &&
    shouldCacheContentType &&
    contentLength < maxLength &&
    (proxy.statusCode >= 200 && proxy.statusCode < 300)
  );
}

function hashRequestUrl(request: IncomingMessage) {
  return hash(`${request.method}${request.url}`);
}

function getNameSpace(request: IncomingMessage) {
  return request.headers.host.split(':')[0];
}

function cacheHeaders(
  proxy: IncomingMessage,
  res: ServerResponse,
  namespace: string,
  key: number
) {
  proxy.on('end', async () => {
    console.log('write headers');
    const filePath = Path.join('tmp', namespace);
    await Fs.ensureDir(filePath);
    await Fs.writeFile(
      Path.join(filePath, `${key}.json`),
      JSON.stringify(res.getHeaders())
    );
  });
}

function isCached(req: IncomingMessage) {
  const namespace = getNameSpace(req);
  const key = hashRequestUrl(req);
  const filePath = Path.join('tmp', namespace, `${key}.json`);
  return Fs.stat(filePath)
    .then(() => true)
    .catch(() => false);
}

async function cacheContent(
  proxy: IncomingMessage,
  namespace: string,
  key: number
) {
  const stream = new PassThrough();
  proxy.pipe(stream);
  const filePath = Path.join('tmp', namespace);
  await Fs.ensureDir(filePath);
  const responseWriter = Fs.createWriteStream(
    Path.join(filePath, key.toString())
  );

  stream.pipe(responseWriter);
}

async function serverCache(req: IncomingMessage, res: ServerResponse) {
  // get headers
  const namespace = getNameSpace(req);
  const key = hashRequestUrl(req);
  const path = Path.join('tmp', namespace);
  const filePath = Path.join(path, `${key}.json`);
  const headersString = await Fs.readFile(filePath, { encoding: 'utf8' });
  const headers = JSON.parse(headersString);

  // write headers
  Object.keys(headers).forEach(header => {
    res.setHeader(header, headers[header]);
  });

  res.setHeader('x-from-cache', 1);
  console.log(res.getHeaders());
  // set content
  const contentPath = Path.join(path, key.toString());
  const createReadStream = Fs.createReadStream(contentPath);
  // console.log(content., res.getHeader('content-length'));
  // content.pipe(res);
  createReadStream.pipe(res);
}

export const createProxyWithCache = (
  options?: httpProxy.ServerOptions,
  cacheOptions?: CacheOptions
) => {
  const proxy = httpProxy.createProxy(options);
  const cacheOpts = cacheOptions || {};
  const contentTypes = cacheOpts.contentTypes || [
    'text/html',
    'application/javascript',
    'text/css'
  ]; // dont cache anything
  const maxLength = cacheOpts.maxLength || Number.MAX_VALUE;

  proxy.on('proxyRes', (proxyRes, req, res) => {
    // cache only get requests
    // create middleware
    const shouldCache = shouldCacheProxy(
      proxyRes,
      req,
      contentTypes,
      maxLength
    );
    console.log('shouldCache', shouldCache);
    if (shouldCache) {
      const namespace = getNameSpace(req);
      const key = hashRequestUrl(req);
      // cache stream (gzib if needed)
      cacheContent(proxyRes, namespace, key);
      cacheHeaders(proxyRes, res, namespace, key);
    }
  });

  async function web(req: IncomingMessage, res: ServerResponse) {
    const cached = await isCached(req);

    if (cached) {
      console.log('serve cached file');
      await serverCache(req, res);
      // res.write('works');
      // res.end();
    } else {
      // search for host in some LRU/Other DB
      // cache and make request
      proxy.web(req, res, {
        target: {
          host: 'vocalisator.com',
          hostname: '185.104.29.58',
          protocol: 'http:'
        },
        changeOrigin: true,
        secure: false
      });
    }
  }

  return Object.freeze({
    web
  });
};
