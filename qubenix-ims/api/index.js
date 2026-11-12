// Vercel serverless entry for the /api endpoint.
import app from '../server/src/app.js';

export default (req, res) => {
  const requestUrl = new URL(req.url || '/', 'http://vercel.local');
  const apiPath = requestUrl.searchParams.get('__api_path');
  if (apiPath !== null) {
    requestUrl.searchParams.delete('__api_path');
    req.url = `/api/${apiPath}${requestUrl.search}`;
  }
  return app(req, res);
};
