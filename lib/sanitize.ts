/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by sanitizing user inputs
 */

/**
 * Sanitizes a string by removing/escaping HTML tags and special characters
 * @param input - The input string to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    // Remove any HTML tags
    .replace(/<[^>]*>/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes a string for storage (removes HTML tags but keeps safe characters)
 * Use this when storing in database/localStorage
 * @param input - The input string to sanitize
 * @returns Sanitized string safe for storage
 */
export function sanitizeForStorage(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove control characters except newlines, tabs, and carriage returns
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Limit length to prevent excessive storage
    .slice(0, 1000);
}

/**
 * Validates and sanitizes a name input
 * @param name - The name to validate and sanitize
 * @returns Object with isValid flag and sanitized name or error message
 */
export function validateAndSanitizeName(name: string): { isValid: boolean; sanitized?: string; error?: string } {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Name must be 50 characters or less' };
  }
  
  // Check for only whitespace
  if (!trimmed.replace(/\s/g, '').length) {
    return { isValid: false, error: 'Name cannot be only whitespace' };
  }
  
  const sanitized = sanitizeForStorage(trimmed);
  
  // Check if sanitization removed too much (likely malicious content)
  if (sanitized.length < trimmed.length * 0.7 && trimmed.length > 10) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates password input (basic validation, not sanitization for security)
 * @param password - The password to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || !password.trim()) {
    return { isValid: false, error: 'Password is required' };
  }
  
  const trimmed = password.trim();
  
  // Basic length check
  if (trimmed.length < 1) {
    return { isValid: false, error: 'Password cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Password must be 100 characters or less' };
  }
  
  return { isValid: true };
}
