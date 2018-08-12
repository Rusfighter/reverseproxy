import { Readable } from 'stream';

export interface WebCache {
  has(namespace: string, key: string): Promise<boolean>;
  getStream(namespace: string, key: string): Promise<Readable>;
  getValue(namespace: string, key: string): Promise<string>;
  setStream(namespace: string, key: string, stream: Readable): Promise<void>;
  setValue(namespace: string, key: string, value: string): Promise<void>;
  reset(namespace: string): Promise<void>;
}
