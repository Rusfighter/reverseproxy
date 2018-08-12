import * as http from 'http';
import * as https from 'https';
import * as Path from 'path';
import { createCacheProxy } from './CacheProxy';
import { createDiskCache } from './cache/disk';

const proxy = createCacheProxy(
  createDiskCache({
    cacheDir: Path.join(process.cwd(), 'tmp')
  }),
  {
    agent: new http.Agent({ keepAlive: true })
  }
);

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
