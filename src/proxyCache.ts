import * as http from 'http';
import { createDiskCache } from './cache/diskcache';

const CacheContentTypes = [
  'text/html',
  'application/javascript',
  'text/css',
  'image/jpeg',
  'image/png'
];

/* function streamToBuffer(stream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];
    stream.on('error', reject);
    stream.on('data', data => buffers.push(data));
    stream.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
} */

const cache = createDiskCache();

function getHost(req: http.IncomingMessage) {
  return req.headers.host.split(':')[0];
}

const getKeyForRequest = (request: http.IncomingMessage) => {
  // $scheme$request_method$host$request_uri
  return `${request.method}${request.url}`;
};

export const cacheResponse = async (
  proxyRes: http.IncomingMessage,
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const contentType = proxyRes.headers['content-type'];

  const shouldCache =
    req.method === 'GET' &&
    CacheContentTypes.some(t => contentType.includes(t));

  if (shouldCache) {
    const key = getKeyForRequest(req);
    cache.set(getHost(req), key, res, proxyRes);
  }
};

export const getFromCache = async (
  request: http.IncomingMessage,
  response: http.ServerResponse
) => {
  const cacheKey = getKeyForRequest(request);
  const resource = await cache.get(getHost(request), cacheKey);

  if (!!resource) {
    // set headers
    response.setHeader('x-cache', 'HIT');
    Object.keys(resource.headers).forEach(key => {
      console.log(key, resource.headers[key]);
      response.setHeader(key, resource.headers[key]);
    });
    // resource.stream.pipe(response);
    return true;
  }

  return false;
};
