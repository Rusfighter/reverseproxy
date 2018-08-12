import { IncomingMessage } from 'http';

export interface BypassCacheRule {
  (req: IncomingMessage): boolean;
}

export interface CacheRule {
  (pReq: IncomingMessage, req: IncomingMessage): boolean;
}
