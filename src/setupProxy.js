const { createProxyMiddleware } = require("http-proxy-middleware");
const pkg = require("../package.json");

module.exports = function (app) {
  let headers = {};
  if (process.env.REMOTE_USER) {
    headers["Remote-User"] = process.env.REMOTE_USER;
  }

  let baseApiUrl = process.env.REACT_APP_API_URL ?? '/api';
  if (baseApiUrl.indexOf('/') !== 0) {
    baseApiUrl = `/${baseApiUrl}`;
  }

  app.use(
    baseApiUrl,
    createProxyMiddleware({
      target: pkg.proxy,
      changeOrigin: true,
      headers: headers
    }),
  );

  // Updated OpenSearch Dashboard configuration
  /*
  app.use(
    '/opensearch',
    createProxyMiddleware({
      target: 'http://localhost:5601/',
      changeOrigin: true,
      headers: headers,
      pathRewrite: {
        '^/opensearch': '',
      },
    })
  );*/
  app.use(
    '/opensearch',
    createProxyMiddleware({
      target: 'http://localhost:5601/',
      changeOrigin: true,
      headers: headers,
      pathRewrite: {
        '^/opensearch': '',
      },
      onProxyRes: function(proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      }
    })
  );
}
// package.json
/*
"proxy": {
    "api": {"base": "/api", "target": "http://localhost:8000"},
    "opensearch": {"base": "/opensearch", "target": "http://localhost:5410"}
  },
*/

/*
module.exports = function(app) {
  const proxyConfig = packageJson.proxy;

  if (proxyConfig && typeof proxyConfig === 'object') {
    Object.entries(proxyConfig).forEach(([key, value]) => {
      if (value.base && value.target) {
        app.use(
          value.base,
          createProxyMiddleware({
            target: value.target,
            changeOrigin: true,
            pathRewrite: {
              [`^${value.base}`]: '',
            },
          })
        );
        console.log(`Proxy set up for ${key}: ${value.base} -> ${value.target}`);
      }
    });
  }
};*/

// ---------------------------------------
// OLD setupProxy.js
// ---------------------------------------
/*
const { createProxyMiddleware } = require("http-proxy-middleware");
const pkg = require("../package.json");

module.exports = function (app) {
  let headers = {};
  if (process.env.REMOTE_USER) {
    headers["Remote-User"] = process.env.REMOTE_USER;
  }

  let baseApiUrl = process.env.REACT_APP_API_URL ?? '/api';
  if (baseApiUrl.indexOf('/') !== 0) {
    baseApiUrl = `/${baseApiUrl}`;
  }

  app.use(
    baseApiUrl,
    createProxyMiddleware({
      target: pkg.proxy,
      changeOrigin: true,
      headers: headers
    }),
  );
};
*/