import type enConfig from '../en';
import type { TranslationSchema } from '../types';
import components from './components';
import dashboard from './dashboard';
import emails from './emails';
import errors from './errors';
import forms from './forms';
import hooks from './hooks';
import labels from './labels';
import meta from './meta';
import pages from './pages';

const fr = {
  components,
  dashboard,
  emails,
  errors,
  forms,
  hooks,
  labels,
  meta,
  pages,
} as const satisfies TranslationSchema<typeof enConfig>;

export default fr;
