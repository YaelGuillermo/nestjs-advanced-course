// src/common/middlewares/lang-prefix-express.middleware.ts
import type { NextFunction, Request, Response } from 'express';
import { stripLangPrefixFromUrl } from '../utils/lang.util';

const LANG_HEADER = 'x-lang';

export function langPrefixExpressMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const result = stripLangPrefixFromUrl(req.url);

  if (!result.hasLangPrefix || !result.lang) {
    next();
    return;
  }

  req.headers[LANG_HEADER] = result.lang;
  req.url = result.url;

  next();
}
