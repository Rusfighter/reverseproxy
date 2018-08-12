import { IncomingMessage } from 'http';
import hash from './helpers/hash';

export function hashRequestUrl(request: IncomingMessage) {
  return hash(`${request.method}${request.url}`);
}

export function getNameSpace(request: IncomingMessage) {
  return request.headers.host.split(':')[0];
}
