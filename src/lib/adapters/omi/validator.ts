import { OmiWebhookPayload, OmiWebhookPayloadSchema } from '../../models/omi';
import { safeEqual } from '../../auth/caller';

export interface ValidationResult {
  isValid: boolean;
  data?: OmiWebhookPayload;
  error?: string;
  statusCode: number;
}

export interface ValidationOptions {
  /** Only for trusted in-process callers (the demo simulator route). Never set from request data. */
  skipSecret?: boolean;
}

function extractSecret(header?: string | null): string {
  if (!header) return '';
  const trimmed = header.trim();
  return trimmed.toLowerCase().startsWith('bearer ') ? trimmed.slice(7).trim() : trimmed;
}

/** A real deployment must never accept unauthenticated webhooks. */
function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.RECALLFLOW_MODE !== 'demo';
}

export function validateOmiWebhookPayload(
  payload: unknown,
  secretHeader?: string | null,
  options: ValidationOptions = {}
): ValidationResult {
  if (!options.skipSecret) {
    const configuredSecret = process.env.OMI_WEBHOOK_SECRET?.trim();
    if (configuredSecret) {
      if (!safeEqual(extractSecret(secretHeader), configuredSecret)) {
        return {
          isValid: false,
          error: 'Unauthorized: Invalid or missing Omi webhook secret signature',
          statusCode: 401,
        };
      }
    } else if (isProductionRuntime()) {
      // Fail closed: no secret configured in production means the webhook is disabled.
      return {
        isValid: false,
        error: 'Webhook disabled: OMI_WEBHOOK_SECRET is not configured',
        statusCode: 503,
      };
    }
  }

  const parsed = OmiWebhookPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((e) => `${e.path.join('.') || 'payload'}: ${e.message}`)
      .join(', ');
    return {
      isValid: false,
      error: `Bad Request: ${errorMessages}`,
      statusCode: 400,
    };
  }

  return {
    isValid: true,
    data: parsed.data,
    statusCode: 200,
  };
}
