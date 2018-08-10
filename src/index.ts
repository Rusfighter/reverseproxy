import * as http from 'http';
import * as https from 'https';
import { createProxyWithCache } from './proxyWithCache';

const proxy = createProxyWithCache({
  agent: new http.Agent({ keepAlive: true })
});

http.createServer(proxy.web).listen(8088);

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
