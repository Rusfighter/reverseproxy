import * as stream from 'stream';
import * as http from 'http';

export interface WebResource {
  stream: stream.Readable;
  headers: http.OutgoingHttpHeaders;
}

export interface WebCache {
  get(namespace: string, key: string): Promise<WebResource | undefined>;
  set(
    namespace: string,
    key: string,
    response: http.ServerResponse,
    resource: stream.Readable
  ): Promise<void>;
  reset(namespace: string): Promise<void>;
}
