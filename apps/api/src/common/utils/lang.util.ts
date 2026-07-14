// src/common/utils/lang.util.ts
import { Lang } from '../enums/lang.enum';

export const DEFAULT_LANG = Lang.EN;

const SUPPORTED_LANGS = new Set<string>(Object.values(Lang));
const LANG_TOKEN_SEPARATOR = /[-_]/;

function normalizeLangToken(input: string | null | undefined): string | null {
  const token = input
    ? input.trim().toLowerCase().split(LANG_TOKEN_SEPARATOR)[0]
    : '';

  return token && token.length > 0 ? token : null;
}

export function resolveLang(input: string | null | undefined): Lang | null {
  const normalized = normalizeLangToken(input);

  if (!normalized || !SUPPORTED_LANGS.has(normalized)) {
    return null;
  }

  return normalized as Lang;
}

export function normalizeLang(input: string | null | undefined): Lang {
  return resolveLang(input) ?? DEFAULT_LANG;
}

export interface LangPrefixedUrl {
  readonly lang: Lang | null;
  readonly url: string;
  readonly hasLangPrefix: boolean;
}

export function stripLangPrefixFromUrl(url: string): LangPrefixedUrl {
  const queryIndex = url.indexOf('?');
  const pathname = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : url.slice(queryIndex);
  const normalizedPathname = pathname.startsWith('/')
    ? pathname
    : `/${pathname}`;
  const segments = normalizedPathname.split('/').filter(Boolean);
  const lang = resolveLang(segments[0]);

  if (!lang) {
    return {
      lang: null,
      url,
      hasLangPrefix: false,
    };
  }

  const nextSegments = segments.slice(1);
  const nextPathname = nextSegments.length ? `/${nextSegments.join('/')}` : '/';

  return {
    lang,
    url: `${nextPathname}${search}`,
    hasLangPrefix: true,
  };
}
