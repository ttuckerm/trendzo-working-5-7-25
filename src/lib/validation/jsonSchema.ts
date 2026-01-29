import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

// Create a singleton AJV instance
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Utility to compile and validate against a schema object
export function createValidator<T>(schema: object) {
  const validate = ajv.compile(schema);
  return (payload: unknown): { valid: boolean; errors: string[] } => {
    const ok = validate(payload);
    if (ok) return { valid: true, errors: [] };
    const errors = (validate.errors || []).map((e) => `${e.instancePath || '/'} ${e.message || ''}`.trim());
    return { valid: false, errors };
  };
}









