import { Request } from 'express';

const getClientIp = (req: Request) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return (xForwardedFor as string).split(',')[0].trim();
  }
  return req.socket.remoteAddress || '';
};

export default getClientIp;
