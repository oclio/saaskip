import { withAuth } from '@/core/auth/middlewares/with-auth';
import { withIntl } from '@/core/i18n/middlewares/with-intl';
import type { CustomMiddleware } from '@/core/middlewares/types';
import { withAxiom } from '@/core/observability/axiom/middlewares/with-axiom';
import { withArcjet } from '@/core/security/arcjet/middlewares/with-arcjet';
import { withBodySizeLimit } from '@/core/security/body/middlewares/with-body-size-limit';
import { withSecureCookies } from '@/core/security/cookies/middlewares/with-secure-cookies';
import { withCsp } from '@/core/security/csp/middlewares/with-csp';
import { withCsrf } from '@/core/security/csrf/middlewares/with-csrf';

const stack: CustomMiddleware[] = [
  withSecureCookies,
  withIntl,
  withAxiom,
  withCsp,
  withCsrf,
  withBodySizeLimit,
  withArcjet,
  withAuth,
];

export default stack;
