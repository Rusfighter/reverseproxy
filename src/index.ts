import * as http from 'http';
import * as https from 'https';
import * as httpProxy from 'http-proxy';
import { cacheResponse, getFromCache } from './proxyCache';

const proxy = httpProxy.createProxy({
  agent: new http.Agent({ keepAlive: true })
});

proxy.on('proxyRes', cacheResponse);

const handleRequest = async (req, resp) => {
  const exists = await getFromCache(req, resp);

  if (!exists) {
    // set logic
    proxy.web(req, resp, {
      target: {
        host: 'vocalisator.com',
        hostname: '185.104.29.58',
        protocol: 'http'
      },
      changeOrigin: true,
      secure: false
    });
  }
};

http.createServer(handleRequest).listen(8088);
