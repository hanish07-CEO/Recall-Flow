import { OmiWebhookPayload, OmiWebhookPayloadSchema } from '../../models/omi';

export interface ValidationResult {
  isValid: boolean;
  data?: OmiWebhookPayload;
  error?: string;
  statusCode: number;
}

export function validateOmiWebhookPayload(
  payload: unknown,
  secretHeader?: string | null
): ValidationResult {
  // If webhook secret is configured in the environment, enforce it
  const configuredSecret = process.env.OMI_WEBHOOK_SECRET;
  if (configuredSecret && configuredSecret.trim().length > 0) {
    if (!secretHeader || secretHeader.trim() !== configuredSecret.trim()) {
      return {
        isValid: false,
        error: 'Unauthorized: Invalid or missing Omi webhook secret signature',
        statusCode: 401,
      };
    }
  }

  // Validate JSON schema
  const parsed = OmiWebhookPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
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
