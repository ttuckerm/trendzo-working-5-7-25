/**
 * Request Validation & Sanitization Middleware
 * Production-ready input validation, sanitization, and attack prevention
 */

import { NextRequest, NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'array' | 'object' | 'date';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
  allowHTML?: boolean;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  code: string;
}

/**
 * SQL Injection Detection Patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
  /('|\"|;|--|\/\*|\*\/)/,
  /(\bSCRIPT\b|\bALERT\b|\bONLOAD\b|\bONERROR\b)/i,
  /(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)/i,
  /(\bUNION\b.*\bSELECT\b)/i,
  /(\bDROP\b.*\bTABLE\b)/i
];

/**
 * XSS Detection Patterns
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi
];

/**
 * LDAP Injection Detection Patterns
 */
const LDAP_INJECTION_PATTERNS = [
  /[()&|!]/,
  /\*\s*\)/,
  /\(\s*\|/,
  /\)\s*\(/
];

/**
 * Path Traversal Detection Patterns
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi
];

/**
 * Command Injection Detection Patterns
 */
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]/,
  /\s+(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|curl|wget|nc|ncat|telnet|ssh|ftp)\s+/i,
  /(^|\s)(rm|mv|cp|chmod|chown|kill|killall|sudo|su)\s+/i
];

/**
 * File Upload Validation
 */
const DANGEROUS_FILE_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'jsp', 'php', 'asp', 'aspx',
  'sh', 'bash', 'ps1', 'py', 'rb', 'pl', 'sql', 'html', 'htm', 'xml', 'svg'
];

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'text/plain', 'application/json', 'application/pdf',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg'
];

/**
 * Input Sanitizer Class
 */
export class InputSanitizer {
  /**
   * Sanitize string input
   */
  static sanitizeString(input: string, allowHTML: boolean = false): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Basic trimming and normalization
    let sanitized = input.trim().normalize('NFKC');

    if (allowHTML) {
      // Use DOMPurify for HTML sanitization
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target'],
        FORBID_SCRIPTS: true,
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input']
      });
    } else {
      // Strip all HTML tags
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Encode dangerous characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') {
      return '';
    }

    return validator.normalizeEmail(email.trim().toLowerCase()) || '';
  }

  /**
   * Sanitize URL input
   */
  static sanitizeUrl(url: string): string {
    if (typeof url !== 'string') {
      return '';
    }

    const sanitized = url.trim();
    
    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:'];
    const lowerUrl = sanitized.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return '';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    if (typeof filename !== 'string') {
      return '';
    }

    // Remove path traversal attempts
    let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '');
    
    // Remove hidden file indicators
    sanitized = sanitized.replace(/^\.+/, '');
    
    // Limit length
    sanitized = sanitized.substring(0, 255);
    
    return sanitized || 'file';
  }

  /**
   * Deep sanitize object
   */
  static sanitizeObject(obj: any, schema?: ValidationSchema): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, schema));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const rule = schema?.[key];
        const sanitizedKey = this.sanitizeString(key);
        
        if (typeof value === 'string') {
          sanitized[sanitizedKey] = this.sanitizeString(value, rule?.allowHTML);
        } else {
          sanitized[sanitizedKey] = this.sanitizeObject(value, schema);
        }
      }
      
      return sanitized;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    return obj;
  }
}

/**
 * Attack Detection Class
 */
export class AttackDetector {
  /**
   * Detect SQL injection attempts
   */
  static detectSQLInjection(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    const normalizedInput = input.toLowerCase().replace(/\s+/g, ' ');
    
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(normalizedInput));
  }

  /**
   * Detect XSS attempts
   */
  static detectXSS(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    return XSS_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Detect LDAP injection attempts
   */
  static detectLDAPInjection(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    return LDAP_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Detect path traversal attempts
   */
  static detectPathTraversal(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Detect command injection attempts
   */
  static detectCommandInjection(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    return COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Comprehensive attack detection
   */
  static detectAnyAttack(input: string): { isAttack: boolean; attackTypes: string[] } {
    const attacks = [];

    if (this.detectSQLInjection(input)) attacks.push('SQL_INJECTION');
    if (this.detectXSS(input)) attacks.push('XSS');
    if (this.detectLDAPInjection(input)) attacks.push('LDAP_INJECTION');
    if (this.detectPathTraversal(input)) attacks.push('PATH_TRAVERSAL');
    if (this.detectCommandInjection(input)) attacks.push('COMMAND_INJECTION');

    return {
      isAttack: attacks.length > 0,
      attackTypes: attacks
    };
  }
}

/**
 * Validator Class
 */
export class Validator {
  /**
   * Validate single field
   */
  static validateField(value: any, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = [];
    const { field, type, required, minLength, maxLength, min, max, pattern, enum: enumValues, custom } = rule;

    // Check required
    if (required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
        value,
        code: 'REQUIRED'
      });
      return errors;
    }

    // Skip validation if value is empty and not required
    if (!required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // Type validation
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field,
            message: `${field} must be a string`,
            value,
            code: 'INVALID_TYPE'
          });
          break;
        }

        if (minLength !== undefined && value.length < minLength) {
          errors.push({
            field,
            message: `${field} must be at least ${minLength} characters long`,
            value,
            code: 'MIN_LENGTH'
          });
        }

        if (maxLength !== undefined && value.length > maxLength) {
          errors.push({
            field,
            message: `${field} must be no more than ${maxLength} characters long`,
            value,
            code: 'MAX_LENGTH'
          });
        }

        if (pattern && !pattern.test(value)) {
          errors.push({
            field,
            message: `${field} format is invalid`,
            value,
            code: 'INVALID_FORMAT'
          });
        }

        // Attack detection
        const attackResult = AttackDetector.detectAnyAttack(value);
        if (attackResult.isAttack) {
          errors.push({
            field,
            message: `${field} contains potentially malicious content`,
            value,
            code: 'SECURITY_VIOLATION'
          });
        }

        break;

      case 'number':
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        if (isNaN(numValue) || typeof numValue !== 'number') {
          errors.push({
            field,
            message: `${field} must be a valid number`,
            value,
            code: 'INVALID_TYPE'
          });
          break;
        }

        if (min !== undefined && numValue < min) {
          errors.push({
            field,
            message: `${field} must be at least ${min}`,
            value,
            code: 'MIN_VALUE'
          });
        }

        if (max !== undefined && numValue > max) {
          errors.push({
            field,
            message: `${field} must be no more than ${max}`,
            value,
            code: 'MAX_VALUE'
          });
        }

        break;

      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          errors.push({
            field,
            message: `${field} must be a boolean`,
            value,
            code: 'INVALID_TYPE'
          });
        }
        break;

      case 'email':
        if (!validator.isEmail(value)) {
          errors.push({
            field,
            message: `${field} must be a valid email address`,
            value,
            code: 'INVALID_EMAIL'
          });
        }
        break;

      case 'url':
        if (!validator.isURL(value)) {
          errors.push({
            field,
            message: `${field} must be a valid URL`,
            value,
            code: 'INVALID_URL'
          });
        }
        break;

      case 'uuid':
        if (!validator.isUUID(value)) {
          errors.push({
            field,
            message: `${field} must be a valid UUID`,
            value,
            code: 'INVALID_UUID'
          });
        }
        break;

      case 'date':
        if (!validator.isISO8601(value)) {
          errors.push({
            field,
            message: `${field} must be a valid ISO 8601 date`,
            value,
            code: 'INVALID_DATE'
          });
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            field,
            message: `${field} must be an array`,
            value,
            code: 'INVALID_TYPE'
          });
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors.push({
            field,
            message: `${field} must be an object`,
            value,
            code: 'INVALID_TYPE'
          });
        }
        break;
    }

    // Enum validation
    if (enumValues && !enumValues.includes(value)) {
      errors.push({
        field,
        message: `${field} must be one of: ${enumValues.join(', ')}`,
        value,
        code: 'INVALID_ENUM'
      });
    }

    // Custom validation
    if (custom) {
      const customResult = custom(value);
      if (customResult !== true) {
        errors.push({
          field,
          message: typeof customResult === 'string' ? customResult : `${field} failed custom validation`,
          value,
          code: 'CUSTOM_VALIDATION'
        });
      }
    }

    return errors;
  }

  /**
   * Validate object against schema
   */
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const sanitizedData: any = {};

    // Validate each field in schema
    for (const [fieldName, rule] of Object.entries(schema)) {
      const value = data?.[fieldName];
      const fieldErrors = this.validateField(value, rule);
      errors.push(...fieldErrors);

      // Sanitize if no errors and sanitization is enabled
      if (fieldErrors.length === 0 && rule.sanitize !== false) {
        if (rule.type === 'string') {
          sanitizedData[fieldName] = InputSanitizer.sanitizeString(value, rule.allowHTML);
        } else if (rule.type === 'email') {
          sanitizedData[fieldName] = InputSanitizer.sanitizeEmail(value);
        } else if (rule.type === 'url') {
          sanitizedData[fieldName] = InputSanitizer.sanitizeUrl(value);
        } else {
          sanitizedData[fieldName] = value;
        }
      } else {
        sanitizedData[fieldName] = value;
      }
    }

    // Deep sanitize the entire object
    const fullySanitized = InputSanitizer.sanitizeObject(sanitizedData, schema);

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: fullySanitized
    };
  }
}

/**
 * File Upload Validator
 */
export class FileUploadValidator {
  static validateFile(file: File, maxSize: number = 10 * 1024 * 1024): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push({
        field: 'file',
        message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        value: file.size,
        code: 'FILE_TOO_LARGE'
      });
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && DANGEROUS_FILE_EXTENSIONS.includes(extension)) {
      errors.push({
        field: 'file',
        message: `File type .${extension} is not allowed`,
        value: extension,
        code: 'DANGEROUS_FILE_TYPE'
      });
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push({
        field: 'file',
        message: `MIME type ${file.type} is not allowed`,
        value: file.type,
        code: 'INVALID_MIME_TYPE'
      });
    }

    // Sanitize filename
    const sanitizedName = InputSanitizer.sanitizeFilename(file.name);
    if (sanitizedName !== file.name) {
      errors.push({
        field: 'filename',
        message: 'Filename contains invalid characters',
        value: file.name,
        code: 'INVALID_FILENAME'
      });
    }

    return errors;
  }
}

/**
 * Validation Middleware Factory
 */
export function createValidationMiddleware(schema: ValidationSchema) {
  return async (req: NextRequest): Promise<{ isValid: boolean; response?: NextResponse; sanitizedData?: any }> => {
    try {
      let data: any = {};

      // Parse request body
      const contentType = req.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        try {
          data = await req.json();
        } catch (error) {
          return {
            isValid: false,
            response: NextResponse.json({
              error: 'Invalid JSON in request body',
              code: 'INVALID_JSON'
            }, { status: 400 })
          };
        }
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData();
        data = Object.fromEntries(formData.entries());
      }

      // Add query parameters
      const url = new URL(req.url);
      for (const [key, value] of url.searchParams.entries()) {
        data[key] = value;
      }

      // Validate data
      const result = Validator.validate(data, schema);

      if (!result.isValid) {
        return {
          isValid: false,
          response: NextResponse.json({
            error: 'Validation failed',
            errors: result.errors
          }, { status: 400 })
        };
      }

      return {
        isValid: true,
        sanitizedData: result.sanitizedData
      };

    } catch (error) {
      console.error('Validation middleware error:', error);
      return {
        isValid: false,
        response: NextResponse.json({
          error: 'Internal validation error'
        }, { status: 500 })
      };
    }
  };
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  viralPrediction: {
    url: {
      field: 'url',
      type: 'url' as const,
      required: true,
      maxLength: 2048
    },
    content: {
      field: 'content',
      type: 'string' as const,
      required: false,
      maxLength: 10000,
      allowHTML: false
    },
    niche: {
      field: 'niche',
      type: 'string' as const,
      required: false,
      maxLength: 100,
      enum: [
        'Fitness & Health',
        'Personal Finance/Investing',
        'Business/Entrepreneurship',
        'Food/Nutrition Comparisons',
        'Beauty/Skincare',
        'Real Estate/Property',
        'Self-Improvement/Productivity',
        'Dating/Relationships',
        'Education/Study Tips',
        'Career/Job Advice'
      ]
    },
    options: {
      field: 'options',
      type: 'object' as const,
      required: false
    }
  },

  userRegistration: {
    email: {
      field: 'email',
      type: 'email' as const,
      required: true,
      maxLength: 255
    },
    password: {
      field: 'password',
      type: 'string' as const,
      required: true,
      minLength: 8,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    },
    name: {
      field: 'name',
      type: 'string' as const,
      required: true,
      minLength: 2,
      maxLength: 100
    }
  },

  apiKeyCreation: {
    name: {
      field: 'name',
      type: 'string' as const,
      required: true,
      minLength: 3,
      maxLength: 100
    },
    permissions: {
      field: 'permissions',
      type: 'array' as const,
      required: true
    },
    expiresAt: {
      field: 'expiresAt',
      type: 'date' as const,
      required: false
    }
  }
};

// duplicate re-export removed; classes are already exported above