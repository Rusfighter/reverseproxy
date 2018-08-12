import { IncomingMessage, ServerResponse } from 'http';

export const headerPasses = {
  removeChunked(
    req: IncomingMessage,
    res: ServerResponse,
    proxyRes: IncomingMessage
  ) {
    if (req.httpVersion === '1.0') {
      delete proxyRes.headers['transfer-encoding'];
    }
  },

  setConnection(
    req: IncomingMessage,
    res: ServerResponse,
    proxyRes: IncomingMessage
  ) {
    if (req.httpVersion === '1.0') {
      proxyRes.headers.connection = req.headers.connection || 'close';
    } else if (req.httpVersion !== '2.0' && !proxyRes.headers.connection) {
      proxyRes.headers.connection = req.headers.connection || 'keep-alive';
    }
  },

  /**
   * Copy headers from proxyResponse to response
   * set each header in response object.
   *
   * @param {ClientRequest} Req Request object
   * @param {IncomingMessage} Res Response object
   * @param {proxyResponse} Res Response object from the proxy request
   * @param {Object} Options options.cookieDomainRewrite: Config to rewrite cookie domain
   *
   * @api private
   */
  writeHeaders(
    req: IncomingMessage,
    res: ServerResponse,
    proxyRes: IncomingMessage,
    options
  ) {
    Object.keys(proxyRes.headers).forEach(key => {
      const header = proxyRes.headers[key];
      if (header !== undefined) {
        res.setHeader(String(key).trim(), header);
      }
    });
  },

  writeStatusCode: function(
    req: IncomingMessage,
    res: ServerResponse,
    proxyRes: IncomingMessage
  ) {
    // From Node.js docs: response.writeHead(statusCode[, statusMessage][, headers])
    if (proxyRes.statusMessage) {
      res.statusCode = proxyRes.statusCode;
      res.statusMessage = proxyRes.statusMessage;
    } else {
      res.statusCode = proxyRes.statusCode;
    }
  }
};
