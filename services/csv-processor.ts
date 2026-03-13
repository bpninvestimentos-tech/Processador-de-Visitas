import { ProcessingMode, RawRow } from '../types';

// Helper: Parse CSV string to Array of Objects
export const parseCSV = (content: string): RawRow[] => {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Simple CSV parser handling quotes
  const parseLine = (text: string) => {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result.map(s => s.replace(/^"|"$/g, '').trim()); // Remove surrounding quotes
  };

  const headers = parseLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = parseLine(lines[i]);
    if (currentLine.length === headers.length) {
      const obj: RawRow = {};
      headers.forEach((header, index) => {
        obj[header] = currentLine[index];
      });
      data.push(obj);
    }
  }
  return data;
};

// Helper: Title Case
const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper: Clean Gallery
const cleanGallery = (str: string) => {
  if (!str) return '';
  // Remove "Galeria", "Galeria ", extra spaces
  return str.replace(/Galeria\s?/i, '').trim();
};

// Helper: Format Phone
const formatPhone = (str: string) => {
  if (!str) return '';
  let clean = str.replace(/[^\d+]/g, '');
  if (!clean.startsWith('+')) {
    clean = '+' + clean;
  }
  return clean;
};

// Helper: Sanitize ID (Numbers only)
const sanitizeID = (str: string) => {
  if (!str) return '';
  return str.replace(/[^\d]/g, '');
};

// Helper: Find value by partial header match (robustness)
const getValue = (row: RawRow, keyPart: string): string => {
  const key = Object.keys(row).find(k => k.toLowerCase().includes(keyPart.toLowerCase()));
  return key ? row[key] : '';
};

/**
 * Dynamic Field Helper:
 * Searches for a label in "Campo do formulário X" and returns "Resposta do formulário X".
 */
const findValueByLabel = (row: RawRow, labelPart: string): string => {
  const keys = Object.keys(row);
  for (const key of keys) {
    if (key.includes('Campo do formulário') && row[key].toLowerCase().includes(labelPart.toLowerCase())) {
      const match = key.match(/\d+/);
      if (match) {
        const index = match[0];
        const answerKey = `Resposta do formulário ${index}`;
        return row[answerKey] || '';
      }
    }
  }
  return '';
};

/**
 * Special Helper for IDs in Presencial mode:
 * Finds the Nth occurrence of "Nº Carteirinha".
 */
const findNthIdByLabel = (row: RawRow, n: number): string => {
  const keys = Object.keys(row);
  let count = 0;
  for (const key of keys) {
    if (key.includes('Campo do formulário') && row[key].toLowerCase().includes('carteirinha')) {
      count++;
      if (count === n) {
        const match = key.match(/\d+/);
        if (match) {
          return row[`Resposta do formulário ${match[0]}`] || '';
        }
      }
    }
  }
  return '';
};

// Helper: Extract Time (HH:MM)
const extractTime = (row: RawRow): string => {
  let val = getValue(row, 'Horário de início');
  if (!val) val = getValue(row, 'Horário');
  
  if (!val) return '00:00';
  const match = val.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return val;
};

export const processData = (rawText: string, mode: ProcessingMode): string => {
  const data = parseCSV(rawText);
  let outputRows: string[][] = [];

  // Sort by Time (Ascending per rules)
  const sortedData = [...data].sort((a, b) => {
    const timeA = extractTime(a);
    const timeB = extractTime(b);
    return timeA.localeCompare(timeB);
  });

  if (mode === ProcessingMode.VIDEOCHAMADA) {
    outputRows = sortedData.map(row => {
      const interno = findValueByLabel(row, 'Nome do apenado') || getValue(row, 'Resposta do formulário 0');
      const galeria = cleanGallery(findValueByLabel(row, 'Galeria') || getValue(row, 'Resposta do formulário 1'));
      const visitante = toTitleCase(getValue(row, 'Sobrenome'));
      const id = getValue(row, 'Nome'); 
      const tel = formatPhone(getValue(row, 'Tel'));
      const time = extractTime(row);

      return [
        toTitleCase(interno),
        galeria,
        visitante,
        id,
        tel,
        time
      ];
    });
  } else if (mode === ProcessingMode.VISITA_INTIMA) {
    outputRows = sortedData.map(row => {
      const interno = findValueByLabel(row, 'Nome do apenado') || getValue(row, 'Resposta do formulário 0');
      const galeria = findValueByLabel(row, 'Galeria') || getValue(row, 'Resposta do formulário 1');
      const visitante = findValueByLabel(row, 'Nome do visitante') || getValue(row, 'Resposta do formulário 2');
      const id = getValue(row, 'Nome');
      const time = extractTime(row);

      return [
        toTitleCase(interno),
        galeria,
        toTitleCase(visitante),
        id,
        time
      ];
    });
  } else if (mode === ProcessingMode.VISITA_PRESENCIAL) {
    // 8 Columns: [Interno],[Galeria],[Vis1],[ID1],[Vis2],[ID2],[Vis3],[ID3]
    outputRows = sortedData.map(row => {
      const apenado = findValueByLabel(row, 'Nome do apenado');
      const galeria = cleanGallery(findValueByLabel(row, 'Galeria'));
      
      const vis1 = findValueByLabel(row, '1º - Nome do visitante');
      const id1 = getValue(row, 'Nome'); // Rule: ID 1 is from Col "Nome"
      
      const vis2 = findValueByLabel(row, '2º - Nome do visitante');
      // ID 2 logic: 2nd visitor ID is the first occurrence of "Nº Carteirinha" linked to 2nd visitor (which is essentially the 1st one in order of form fields since Vis 1 ID is external)
      const id2 = vis2 ? findNthIdByLabel(row, 1) : '';
      
      const vis3 = findValueByLabel(row, '3º - Nome do visitante');
      const id3 = vis3 ? findNthIdByLabel(row, 2) : '';

      return [
        toTitleCase(apenado),
        galeria,
        toTitleCase(vis1),
        sanitizeID(id1),
        toTitleCase(vis2),
        sanitizeID(id2),
        toTitleCase(vis3),
        sanitizeID(id3)
      ];
    });
  }

  // Convert to CSV String (no header)
  return outputRows.map(row => row.join(',')).join('\n');
};