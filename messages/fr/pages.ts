import type enPages from '../en/pages';
import type { TranslationSchema } from '../types';
import pagesAuth from './pages-auth';
import pagesHelp from './pages-help';
import pagesLegal from './pages-legal';
import pagesMarketing from './pages-marketing';
import pagesProduct from './pages-product';

export default {
  ...pagesAuth,
  ...pagesHelp,
  ...pagesLegal,
  ...pagesMarketing,
  ...pagesProduct,
} as const satisfies TranslationSchema<typeof enPages>;
