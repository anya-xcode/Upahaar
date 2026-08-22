import { ApiError } from '../utils/ApiError.js';

/**
 * Request validation.
 *
 * Controllers used to hand-roll their own checks, which meant the rules for
 * "what is a valid order" lived in three places and drifted. A schema states it
 * once, and — just as importantly — the parsed result replaces `req.body`, so a
 * controller downstream can trust its input rather than re-checking it.
 *
 * Errors come back in the same shape as every other failure, with a `details`
 * array the client can map onto individual fields.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    for (const key of ['body', 'query', 'params']) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        const details = result.error.issues.map((i) => ({
          field: i.path.join('.') || key,
          message: i.message,
        }));
        // The first message is the one a toast will show, so make it readable.
        return next(new ApiError(400, details[0].message, details));
      }

      // `query` and `params` are getter-only on newer Express, so assign the
      // parsed value onto a shadow property the controllers already read.
      if (key === 'body') req.body = result.data;
      else Object.defineProperty(req, key, { value: result.data, writable: true, configurable: true });
    }
    next();
  };
}

export default validate;
