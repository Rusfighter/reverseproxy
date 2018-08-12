import { IncomingMessage } from 'http';
import { BypassCacheRule, CacheRule } from './index';

export const wordpressBypassRules: BypassCacheRule[] = [
  (req: IncomingMessage) => {
    // console.log(req.method);
    return req.method === 'GET';
  },
  (req: IncomingMessage) => {
    const url = req.url;
    const reg = /\/(wp-admin\/|xmlrpc.php|wp-.*.php|feed\/|sitemap(_index)?.xml)/;
    // console.log(req.url);
    return !reg.test(url);
  },
  (req: IncomingMessage) => {
    console.log(req.headers);
    return true;
  }
];

export const wordpressCacheRules: CacheRule[] = [
  (pReq: IncomingMessage, req: IncomingMessage) => {
    const url = req.url;
    const reg = /\/(wp-admin\/|xmlrpc.php|wp-.*.php|feed\/|sitemap(_index)?.xml)/;
    // console.log(req.url);
    return !reg.test(url);
  },
  (pReq: IncomingMessage, req: IncomingMessage) => {
    return req.method === 'GET';
  },
  (pReq: IncomingMessage, req: IncomingMessage) => {
    const contentTypesToCache = [
      'text/html',
      'application/javascript',
      'text/css',
      'image/jpeg',
      'image/png'
    ];

    const contentType = pReq.headers['content-type'];
    return contentTypesToCache.some(t => contentType.includes(t));
  }
];
