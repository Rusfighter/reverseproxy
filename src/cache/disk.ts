import * as Fs from 'fs-extra';
import * as Path from 'path';
import { Readable } from 'stream';
import { WebCache } from '.';

export function createDiskCache({ cacheDir = 'tmp' }): WebCache {
  async function has(namespace: string, key: string): Promise<boolean> {
    const filePath = Path.join(cacheDir, namespace, key);
    return Fs.stat(filePath)
      .then(() => true)
      .catch(() => false);
  }
  async function getStream(namespace: string, key: string): Promise<Readable> {
    const path = Path.join(cacheDir, namespace);
    const contentPath = Path.join(path, key.toString());
    return Fs.createReadStream(contentPath);
  }
  async function getValue(namespace: string, key: string): Promise<string> {
    const filePath = Path.join(cacheDir, namespace, key);
    const headersString = await Fs.readFile(filePath, { encoding: 'utf8' });
    return headersString;
  }
  async function setStream(
    namespace: string,
    key: string,
    stream: Readable
  ): Promise<void> {
    const filePath = Path.join(cacheDir, namespace);
    await Fs.ensureDir(filePath);
    const responseWriter = Fs.createWriteStream(Path.join(filePath, key));

    stream.pipe(responseWriter);
  }
  async function setValue(
    namespace: string,
    key: string,
    value: string
  ): Promise<void> {
    const filePath = Path.join(cacheDir, namespace);
    await Fs.ensureDir(filePath);
    await Fs.writeFile(Path.join(filePath, key), value, { encoding: 'utf8' });
  }
  async function reset(namespace: string): Promise<void> {
    const filePath = Path.join(cacheDir, namespace);
    return Fs.emptyDir(filePath);
  }

  return Object.freeze({
    has,
    getStream,
    getValue,
    setStream,
    setValue,
    reset
  });
}
