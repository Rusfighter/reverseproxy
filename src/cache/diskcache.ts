import { WebCache } from '.';
import * as Fs from 'fs';
import * as Path from 'path';
import * as stream from 'stream';
import * as sha256 from 'hash.js/lib/hash/sha/256';
import * as http from 'http';

const keyToHash = q => {
  return sha256()
    .update(q)
    .digest('hex');
};

const existsPromise = (path: string) =>
  new Promise<boolean>(resolve => {
    Fs.exists(path, exists => {
      resolve(exists);
    });
  });

const createPath = async (currentPath, ...paths: string[]) => {
  if (paths.length > 0) {
    const path1 = Path.join(currentPath || process.cwd(), paths.shift());
    const exists = await existsPromise(path1);
    if (!exists) {
      await new Promise(resolve => {
        Fs.mkdir(path1, err => {
          resolve();
        });
      });
    }

    return createPath(path1, ...paths);
  } else {
    return currentPath;
  }
};

const getDirectory = async (dir: string) => {
  // check if folder exists
  return createPath(process.cwd(), 'tmp', dir);
};

export const createDiskCache = (): WebCache => {
  return {
    async get(namespace: string, key: string) {
      const path = Path.join(process.cwd(), 'tmp', namespace, keyToHash(key));
      const exists = await existsPromise(path);
      if (!exists) {
        return undefined;
      }

      const headers = await new Promise<http.OutgoingHttpHeaders>(
        (resolve, reject) => {
          Fs.readFile(`${path}_h`, 'utf8', (error, data) => {
            if (error) {
              reject(error);
            }
            resolve(JSON.parse(data));
          });
        }
      );

      const rStream = Fs.createReadStream(path);
      return {
        headers,
        stream: rStream
      };
    },
    async reset(namespace: string) {
      console.log('reset');
    },
    async set(
      namespace: string,
      key: string,
      response: http.ServerResponse,
      s: stream.Readable
    ) {
      const path = await getDirectory(namespace);
      const p = Path.join(path, keyToHash(key));
      const wStream = Fs.createWriteStream(p);

      // store file
      s.pipe(wStream).on('close', () => {
        const headers = JSON.stringify(response.getHeaders());
        console.log(headers);
        Fs.writeFileSync(`${p}_h`, headers, 'utf8');
      });
    }
  };
};
