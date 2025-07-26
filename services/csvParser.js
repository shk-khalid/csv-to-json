const fs = require('fs').promises;
const jsonBuilder = require('../utils/jsonBuilder');

class CSVParser {
  constructor() {
    this.csvPath = process.env.CSV_FILE_PATH || './csv/data.csv';
  }

  async parseCSVFromBuffer(buffer) {
    try {
      return this.parseCSVContent(buffer.toString('utf8'));
    } catch (err) {
      throw new Error(`Buffer parse failed: ${err.message}`);
    }
  }

  async parseCSV() {
    try {
      const content = await fs.readFile(this.csvPath, 'utf8');
      return this.parseCSVContent(content);
    } catch (err) {
      throw new Error(`File parse failed: ${err.message}`);
    }
  }

  parseCSVContent(content) {
    const lines = this.splitLines(content);
    if (lines.length < 2) {
      throw new Error('CSV needs header + at least one row');
    }

    const headers = this.parseRow(lines[0]);
    this.checkHeaders(headers);

    return lines.slice(1).reduce((users, line) => {
      const row = this.parseRow(line);
      if (!row.some(cell => cell.trim())) return users;

      const user = this.buildUser(headers, row);
      if (user) users.push(user);
      return users;
    }, []);
  }

  splitLines(content) {
    const lines = [];
    let buf = '', inQuotes = false;

    for (const ch of content) {
      if (ch === '"') inQuotes = !inQuotes;
      if (ch === '\n' && !inQuotes) {
        if (buf.trim()) lines.push(buf.trim());
        buf = '';
      } else if (ch !== '\r') {
        buf += ch;
      }
    }
    if (buf.trim()) lines.push(buf.trim());
    return lines;
  }

  parseRow(row) {
    const cells = [];
    let buf = '', inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"' && row[i + 1] === '"' && inQuotes) {
        buf += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(buf.trim());
        buf = '';
      } else {
        buf += ch;
      }
    }
    cells.push(buf.trim());
    return cells;
  }

  checkHeaders(headers) {
    const required = ['name.firstName', 'name.lastName', 'age'];
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length) {
      throw new Error(`Missing headers: ${missing.join(', ')}`);
    }
  }

  buildUser(headers, row) {
    try {
      const data = {};
      headers.forEach((h, i) => {
        if (row[i]?.trim()) data[h] = row[i].trim();
      });

      const nested = jsonBuilder.buildNestedObject(data);
      const { name, age: ageStr, address } = nested;
      if (!name?.firstName || !name?.lastName || !ageStr) return null;

      const age = parseInt(ageStr, 10);
      if (isNaN(age) || age < 0 || age > 150) return null;

      const user = {
        name: `${name.firstName} ${name.lastName}`,
        age,
        address: address || null,
        additional_info: {}
      };

      Object.keys(nested).forEach(key => {
        if (!['name', 'age', 'address'].includes(key)) {
          user.additional_info[key] = nested[key];
        }
      });

      if (!Object.keys(user.additional_info).length) {
        user.additional_info = null;
      }

      return user;
    } catch {
      return null;
    }
  }
}

module.exports = new CSVParser();