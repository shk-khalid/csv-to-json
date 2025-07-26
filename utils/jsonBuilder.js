/**
 * Utility class for building nested JSON objects from dot-separated keys
 */
class JSONBuilder {
  /**
   * Convert flat object with dot-separated keys to nested object
   * Example: { 'name.firstName': 'John', 'name.lastName': 'Doe' } 
   * becomes: { name: { firstName: 'John', lastName: 'Doe' } }
   */
  buildNestedObject(flatObject) {
    const result = {};

    Object.keys(flatObject).forEach(key => {
      const value = flatObject[key];
      this.setNestedValue(result, key, value);
    });

    return result;
  }

  /**
   * Set a nested value in an object using dot notation
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      
      current = current[key];
    }

    // Set the final value
    const finalKey = keys[keys.length - 1];
    current[finalKey] = this.convertValue(value);
  }

  /**
   * Convert string values to appropriate types
   */
  convertValue(value) {
    if (typeof value !== 'string') {
      return value;
    }

    // Trim whitespace
    value = value.trim();

    // Handle empty strings
    if (value === '') {
      return '';
    }

    // Try to convert to number
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    if (/^\d*\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Handle boolean strings
    if (value.toLowerCase() === 'true') {
      return true;
    }
    
    if (value.toLowerCase() === 'false') {
      return false;
    }

    // Handle null/undefined strings
    if (value.toLowerCase() === 'null') {
      return null;
    }

    if (value.toLowerCase() === 'undefined') {
      return undefined;
    }

    // Return as string
    return value;
  }

  /**
   * Get a nested value from an object using dot notation
   */
  getNestedValue(obj, path) {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Check if a nested path exists in an object
   */
  hasNestedPath(obj, path) {
    return this.getNestedValue(obj, path) !== undefined;
  }
}

module.exports = new JSONBuilder();