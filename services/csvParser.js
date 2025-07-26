const fs = require('fs').promises;
const path = require('path');
const jsonBuilder = require('../utils/jsonBuilder');

class CSVParser {
  constructor() {
    this.csvPath = process.env.CSV_FILE_PATH || './csv/data.csv';
  }

  /**
   * Parse CSV file manually without external libraries
   */
  async parseCSV() {
    try {
      const csvContent = await fs.readFile(this.csvPath, 'utf8');
      const lines = this.splitCSVLines(csvContent);
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      const headers = this.parseCSVRow(lines[0]);
      const users = [];

      // Validate required headers
      this.validateRequiredHeaders(headers);

      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        const row = this.parseCSVRow(lines[i]);
        
        // Skip empty rows
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          continue;
        }

        const user = this.processRow(headers, row);
        if (user) {
          users.push(user);
        }
      }

      return users;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Split CSV content into lines, handling potential line breaks within quoted fields
   */
  splitCSVLines(content) {
    const lines = [];
    let currentLine = '';
    let inQuotes = false;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      }
      
      if (char === '\n' && !inQuotes) {
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = '';
      } else if (char !== '\r') {
        currentLine += char;
      }
    }
    
    // Add the last line if it exists
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  }

  /**
   * Parse a single CSV row, handling quoted fields with commas
   */
  parseCSVRow(row) {
    const cells = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Handle escaped quotes
          currentCell += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    
    // Add the last cell
    cells.push(currentCell.trim());
    
    return cells;
  }

  /**
   * Validate that required headers are present
   */
  validateRequiredHeaders(headers) {
    const requiredHeaders = ['name.firstName', 'name.lastName', 'age'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
  }

  /**
   * Process a single row and convert it to user object
   */
  processRow(headers, row) {
    try {
      // Create key-value pairs from headers and row data
      const data = {};
      for (let i = 0; i < headers.length && i < row.length; i++) {
        if (row[i] && row[i].trim()) {
          data[headers[i]] = row[i].trim();
        }
      }

      // Build nested JSON structure
      const nestedData = jsonBuilder.buildNestedObject(data);

      // Validate required fields
      if (!nestedData.name?.firstName || !nestedData.name?.lastName || !nestedData.age) {
        console.warn('Skipping row due to missing required fields:', data);
        return null;
      }

      // Convert age to integer
      const age = parseInt(nestedData.age);
      if (isNaN(age) || age < 0 || age > 150) {
        console.warn('Skipping row due to invalid age:', nestedData.age);
        return null;
      }

      // Build user object according to database schema
      const user = {
        name: `${nestedData.name.firstName} ${nestedData.name.lastName}`,
        age: age,
        address: nestedData.address || null,
        additional_info: {}
      };

      // Add any fields that don't belong to name, age, or address to additional_info
      Object.keys(nestedData).forEach(key => {
        if (key !== 'name' && key !== 'age' && key !== 'address') {
          user.additional_info[key] = nestedData[key];
        }
      });

      // If additional_info is empty, set it to null
      if (Object.keys(user.additional_info).length === 0) {
        user.additional_info = null;
      }

      return user;
    } catch (error) {
      console.warn('Error processing row:', error.message, row);
      return null;
    }
  }
}

module.exports = new CSVParser();