import { Request } from 'express';

const getClientUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};
export default getClientUserAgent;
