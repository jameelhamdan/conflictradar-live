// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages, GetConfigResponse } from 'waku/router';

// prettier-ignore
import type { getConfig as File_About_getConfig } from './pages/about';
// prettier-ignore
import type { getConfig as File_Contact_getConfig } from './pages/contact';
// prettier-ignore
import type { getConfig as File_Index_getConfig } from './pages/index';
// prettier-ignore
import type { getConfig as File_NewsletterConfirmToken_getConfig } from './pages/newsletter/confirm/[token]';
// prettier-ignore
import type { getConfig as File_NewsletterIndex_getConfig } from './pages/newsletter/index';
// prettier-ignore
import type { getConfig as File_NewsletterUnsubscribeToken_getConfig } from './pages/newsletter/unsubscribe/[token]';
// prettier-ignore
import type { getConfig as File_NewsletterYearMonthDay_getConfig } from './pages/newsletter/[year]/[month]/[day]';
// prettier-ignore
import type { getConfig as File_Privacy_getConfig } from './pages/privacy';
// prettier-ignore
import type { getConfig as File_Terms_getConfig } from './pages/terms';

// prettier-ignore
type Page =
| ({ path: '/about' } & GetConfigResponse<typeof File_About_getConfig>)
| ({ path: '/contact' } & GetConfigResponse<typeof File_Contact_getConfig>)
| ({ path: '/' } & GetConfigResponse<typeof File_Index_getConfig>)
| ({ path: '/newsletter/confirm/[token]' } & GetConfigResponse<typeof File_NewsletterConfirmToken_getConfig>)
| ({ path: '/newsletter' } & GetConfigResponse<typeof File_NewsletterIndex_getConfig>)
| ({ path: '/newsletter/unsubscribe/[token]' } & GetConfigResponse<typeof File_NewsletterUnsubscribeToken_getConfig>)
| ({ path: '/newsletter/[year]/[month]/[day]' } & GetConfigResponse<typeof File_NewsletterYearMonthDay_getConfig>)
| ({ path: '/privacy' } & GetConfigResponse<typeof File_Privacy_getConfig>)
| ({ path: '/terms' } & GetConfigResponse<typeof File_Terms_getConfig>);

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>;
  }
  interface CreatePagesConfig {
    pages: Page;
  }
}
