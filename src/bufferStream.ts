import { Readable } from 'stream';

export default class BufferStream extends Readable {
  private _source: Buffer;
  private _length: number;
  private _offset: number;

  constructor(source: Buffer) {
    super();
    this._source = source;
    this._offset = 0;
    this._length = source.length;

    // When the stream has ended, try to clean up the memory references.
    this.on('end', this._destroy.bind(this));
  }

  _read(size: number) {
    if (this._offset < this._length) {
      this.push(this._source.slice(this._offset, this._offset + size));

      this._offset += size;
    }

    // If we've consumed the entire source buffer, close the readable stream.
    if (this._offset >= this._length) {
      this.push(null);
    }
  }

  _destroy() {
    this._source = null;
    this._offset = null;
    this._length = null;
  }
}
