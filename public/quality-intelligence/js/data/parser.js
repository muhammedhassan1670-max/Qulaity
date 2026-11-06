/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: data/parser.js
 * ============================================================================
 * Robust universal parser for CSV, XLSX, and XLS files.
 * Transforms raw file data into standardized: { columns: [], rows: [] }
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DataParser = {
        /**
         * Parse a File object (CSV, XLSX, XLS, JSON)
         * @param {File} file
         * @param {Function} [onProgress] - Optional callback ({ stage, percent, stageName, log })
         * @returns {Promise<{ columns: string[], rows: Object[], filename: string, fileSize: number, fileType: string }>}
         */
        async parseFile(file, onProgress = null) {
            if (!file) throw new Error('No file provided for parsing');

            const ext = (file.name.split('.').pop() || '').toLowerCase();
            const fileSize = file.size || 0;
            const filename = file.name;

            if (onProgress) onProgress({ stage: 1, percent: 5, stageName: 'Streaming file buffer: ' + filename + ' (' + (Math.round(fileSize/1024) || 1) + ' KB)...', log: 'STREAM_INIT: Reading binary chunks...' });

            if (ext === 'csv' || ext === 'txt' || ext === 'tsv') {
                const text = await this._readFileAsText(file, onProgress);
                const { columns, rows } = await this.parseCSVTextAsync(text, onProgress);
                return { columns, rows, filename, fileSize, fileType: ext === 'tsv' ? 'tsv' : 'csv' };
            } else if (ext === 'json') {
                const text = await this._readFileAsText(file, onProgress);
                if (onProgress) onProgress({ stage: 2, percent: 30, stageName: 'Deconstructing JSON object hierarchy...', log: 'JSON_PARSE: Decompressing object tree...' });
                const parsed = JSON.parse(text);
                const rows = Array.isArray(parsed) ? parsed : (parsed.data && Array.isArray(parsed.data) ? parsed.data : [parsed]);
                if (rows.length === 0) throw new Error('JSON file contains no data rows');
                const colSet = new Set();
                rows.forEach(r => {
                    if (r && typeof r === 'object') Object.keys(r).forEach(k => colSet.add(k));
                });
                const columns = Array.from(colSet);
                return { columns, rows, filename, fileSize, fileType: 'json' };
            } else if (ext === 'xlsx' || ext === 'xls') {
                const arrayBuffer = await this._readFileAsArrayBuffer(file, onProgress);
                const { columns, rows } = await this.parseExcelBuffer(arrayBuffer, onProgress);
                return { columns, rows, filename, fileSize, fileType: ext };
            } else {
                throw new Error('Unsupported file format (.' + ext + '). Supported formats: CSV, TSV, XLSX, XLS, JSON.');
            }
        },

        /**
         * Read file as UTF-8 text with streaming progress
         */
        _readFileAsText(file, onProgress = null) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                if (onProgress) {
                    reader.onprogress = (e) => {
                        if (e.lengthComputable && e.total > 0) {
                            const pct = Math.min(18, Math.max(5, Math.round((e.loaded / e.total) * 18)));
                            onProgress({ stage: 1, percent: pct, stageName: 'Streaming text data: ' + Math.round(e.loaded/1024) + 'KB / ' + Math.round(e.total/1024) + 'KB...', log: 'READ_BYTES: ' + e.loaded + '/' + e.total });
                        }
                    };
                }
                reader.onload = () => {
                    if (onProgress) onProgress({ stage: 1, percent: 18, stageName: 'Binary data stream ingested successfully (100%)', log: 'BUFFER_LOADED: Ready for matrix parsing' });
                    resolve(reader.result);
                };
                reader.onerror = () => reject(new Error('Failed to read file as text'));
                reader.readAsText(file, 'UTF-8');
            });
        },

        /**
         * Read file as ArrayBuffer with streaming progress
         */
        _readFileAsArrayBuffer(file, onProgress = null) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                if (onProgress) {
                    reader.onprogress = (e) => {
                        if (e.lengthComputable && e.total > 0) {
                            const pct = Math.min(18, Math.max(5, Math.round((e.loaded / e.total) * 18)));
                            onProgress({ stage: 1, percent: pct, stageName: 'Ingesting Excel binary stream: ' + Math.round(e.loaded/1024) + 'KB / ' + Math.round(e.total/1024) + 'KB...', log: 'STREAM_CHUNKS: ' + e.loaded + '/' + e.total + ' bytes' });
                        }
                    };
                }
                reader.onload = () => {
                    if (onProgress) onProgress({ stage: 1, percent: 18, stageName: 'Binary byte array ingested, unpacking workbook archives...', log: 'EXCEL_BUFFER_LOADED: Archive extracted' });
                    resolve(reader.result);
                };
                reader.onerror = () => reject(new Error('Failed to read Excel file'));
                reader.readAsArrayBuffer(file);
            });
        },

        /**
         * Asynchronous CSV parsing with live chunk progress and non-blocking event-loop yielding
         */
        async parseCSVTextAsync(csvText, onProgress = null) {
            if (!csvText || typeof csvText !== 'string') {
                throw new Error('CSV text is empty or invalid');
            }

            let cleanText = csvText.replace(/^\uFEFF/, '').trim();
            if (!cleanText) throw new Error('CSV file contains no data');

            if (onProgress) onProgress({ stage: 2, percent: 22, stageName: 'Detecting delimiter & schema structure...', log: 'CSV_SCAN: Auto-detecting delimiter...' });
            await new Promise(r => setTimeout(r, 10));

            const delimiter = this._detectDelimiter(cleanText);
            const matrix = this._csvToMatrix(cleanText, delimiter);
            if (matrix.length === 0) throw new Error('No rows found in CSV');

            const rawHeaders = matrix[0];
            const columns = this._sanitizeHeaders(rawHeaders);
            const totalRows = matrix.length - 1;

            if (onProgress) onProgress({ stage: 2, percent: 28, stageName: `Detected ${columns.length} columns, decompressing ${totalRows} records...`, log: `HEADER_SANITY: ${columns.length} columns verified` });

            const rows = [];
            const chunkSize = Math.max(250, Math.round(totalRows / 12));

            for (let i = 1; i < matrix.length; i++) {
                const rowCells = matrix[i];
                if (!Array.isArray(rowCells)) continue;

                const rowObj = {};
                for (let c = 0; c < columns.length; c++) {
                    const col = columns[c];
                    let val = rowCells[c];
                    if (val !== undefined && val !== null && String(val).trim() !== '') {
                        val = String(val).trim();
                        const lowVal = val.toLowerCase();
                        if (lowVal === 'nan' || lowVal === 'null' || lowVal === 'none' || lowVal === 'n/a' || val === '-') {
                            val = null;
                        }
                    } else {
                        val = null;
                    }
                    rowObj[col] = val;
                }
                rows.push(rowObj);

                if (i % chunkSize === 0 || i === matrix.length - 1) {
                    if (onProgress) {
                        const progressRatio = totalRows > 0 ? (rows.length / totalRows) : 1;
                        const chunkPct = 28 + Math.round(progressRatio * 24);
                        onProgress({
                            stage: 2,
                            percent: chunkPct,
                            stageName: `Extracting records (${rows.length.toLocaleString()} / ${totalRows.toLocaleString()})...`,
                            log: `CSV_CHUNK: Processed ${rows.length} rows`
                        });
                    }
                    await new Promise(r => setTimeout(r, 4));
                }
            }

            if (rows.length === 0) {
                throw new Error('CSV file contains headers but no data rows');
            }

            if (onProgress) onProgress({ stage: 2, percent: 52, stageName: `Successfully extracted ${rows.length.toLocaleString()} rows & ${columns.length} columns`, log: `CSV_COMPLETE: ${rows.length} records parsed` });

            return { columns, rows };
        },

        /**
         * Parse raw CSV text synchronously with auto-delimiter detection and quote support (RFC 4180)
         */
        parseCSVText(csvText) {
            if (!csvText || typeof csvText !== 'string') {
                throw new Error('CSV text is empty or invalid');
            }

            // Remove BOM if present
            let cleanText = csvText.replace(/^\uFEFF/, '').trim();
            if (!cleanText) throw new Error('CSV file contains no data');

            // Detect delimiter from first few non-empty lines
            const delimiter = this._detectDelimiter(cleanText);

            // Parse lines with RFC 4180 quote awareness
            const matrix = this._csvToMatrix(cleanText, delimiter);
            if (matrix.length === 0) throw new Error('No rows found in CSV');

            // First row = headers
            const rawHeaders = matrix[0];
            const columns = this._sanitizeHeaders(rawHeaders);

            // Convert remaining rows to objects
            const rows = [];
            for (let i = 1; i < matrix.length; i++) {
                const rowCells = matrix[i];
                if (!Array.isArray(rowCells)) continue;

                const rowObj = {};
                columns.forEach((col, idx) => {
                    let val = rowCells[idx];
                    if (val !== undefined && val !== null && String(val).trim() !== '') {
                        val = String(val).trim();
                        const lowVal = val.toLowerCase();
                        if (lowVal === 'nan' || lowVal === 'null' || lowVal === 'none' || lowVal === 'n/a' || val === '-') {
                            val = null;
                        }
                    } else {
                        val = null;
                    }
                    rowObj[col] = val;
                });

                rows.push(rowObj);
            }

            if (rows.length === 0) {
                throw new Error('CSV file contains headers but no data rows');
            }

            return { columns, rows };
        },

        /**
         * Parse Excel (XLSX / XLS) ArrayBuffer using SheetJS (XLSX) with chunked progressive extraction
         */
        async parseExcelBuffer(arrayBuffer, onProgress = null) {
            if (onProgress) onProgress({ stage: 2, percent: 20, stageName: 'Decompressing Excel workbook (SheetJS Engine)...', log: 'XLSX_ENGINE: Extracting workbook xml streams...' });
            await this._ensureXLSX();
            const XLSX = (typeof window !== 'undefined' && window.XLSX) ? window.XLSX : (typeof XLSX !== 'undefined' ? XLSX : null);

            if (!XLSX) {
                throw new Error('XLSX library is not loaded');
            }

            if (onProgress) onProgress({ stage: 2, percent: 24, stageName: 'Parsing workbook schema & sheet index...', log: 'WORKBOOK_READ: Parsing sheets index...' });
            await new Promise(r => setTimeout(r, 25));

            const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
            if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('Excel workbook contains no readable sheets');
            }

            // Read the first non-empty sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            if (onProgress) onProgress({ stage: 2, percent: 28, stageName: 'Extracting primary worksheet: [' + sheetName + ']...', log: 'SHEET_ACTIVE: "' + sheetName + '" with range ' + (worksheet ? (worksheet['!ref'] || 'unknown') : 'unknown') });
            await new Promise(r => setTimeout(r, 25));

            // Convert sheet to JSON array of arrays for header hygiene
            const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
            if (!matrix || matrix.length === 0) {
                throw new Error('Worksheet "' + sheetName + '" is empty');
            }

            // Find header row (first non-empty row)
            let headerRowIdx = -1;
            for (let i = 0; i < matrix.length; i++) {
                if (Array.isArray(matrix[i]) && matrix[i].some(c => c != null && String(c).trim() !== '')) {
                    headerRowIdx = i;
                    break;
                }
            }

            if (headerRowIdx === -1) {
                throw new Error('Could not detect headers in Excel sheet');
            }

            const rawHeaders = matrix[headerRowIdx];
            const columns = this._sanitizeHeaders(rawHeaders);
            const totalDataRows = matrix.length - headerRowIdx - 1;

            if (onProgress) onProgress({ stage: 2, percent: 32, stageName: 'Detected ' + columns.length + ' columns, extracting ' + totalDataRows.toLocaleString() + ' records...', log: 'HEADER_SANITY_OK: ' + columns.length + ' columns detected' });

            const rows = [];
            const chunkSize = Math.max(30, Math.round(totalDataRows / 16));

            for (let i = headerRowIdx + 1; i < matrix.length; i++) {
                const rowCells = matrix[i];
                if (!Array.isArray(rowCells)) continue;

                const rowObj = {};
                columns.forEach((col, cIdx) => {
                    let cellVal = rowCells[cIdx];
                    if (cellVal instanceof Date) {
                        cellVal = cellVal.toISOString().split('T')[0];
                    } else if (cellVal != null) {
                        cellVal = String(cellVal).trim();
                        const lowVal = cellVal.toLowerCase();
                        if (cellVal === '' || lowVal === 'nan' || lowVal === 'null' || lowVal === 'none' || lowVal === 'n/a' || cellVal === '-') {
                            cellVal = null;
                        }
                    } else {
                        cellVal = null;
                    }
                    rowObj[col] = cellVal;
                });

                rows.push(rowObj);

                // Dynamic progress reporting every chunk
                if (onProgress && (rows.length % chunkSize === 0 || i === matrix.length - 1)) {
                    const progressRatio = totalDataRows > 0 ? (rows.length / totalDataRows) : 1;
                    const chunkPct = 32 + Math.round(progressRatio * 20);
                    onProgress({
                        stage: 2,
                        percent: chunkPct,
                        stageName: 'Extracted ' + rows.length.toLocaleString() + ' / ' + totalDataRows.toLocaleString() + ' records (' + Math.round(progressRatio * 100) + '%)...',
                        log: 'ROW_CHUNK: ' + rows.length + '/' + totalDataRows + ' records converted'
                    });
                    await new Promise(r => setTimeout(r, 6));
                }
            }

            if (rows.length === 0) {
                throw new Error('Excel sheet contains headers but no data records');
            }

            if (onProgress) onProgress({ stage: 2, percent: 52, stageName: 'Successfully extracted ' + rows.length.toLocaleString() + ' records & ' + columns.length + ' columns', log: 'MATRIX_EXTRACTION_SUCCESS: ' + rows.length + ' rows verified' });
            await new Promise(r => setTimeout(r, 10));

            return { columns, rows };
        },

        /**
         * Ensure SheetJS XLSX library is ready
         */
        _ensureXLSX() {
            if (typeof window !== 'undefined' && window.XLSX) {
                return Promise.resolve(window.XLSX);
            }
            if (typeof XLSX !== 'undefined') {
                return Promise.resolve(XLSX);
            }
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const interval = setInterval(() => {
                    attempts++;
                    if (typeof window !== 'undefined' && window.XLSX) {
                        clearInterval(interval);
                        resolve(window.XLSX);
                    } else if (attempts > 50) {
                        clearInterval(interval);
                        reject(new Error('SheetJS (XLSX) library is not available. Please ensure xlsx.full.min.js is loaded.'));
                    }
                }, 50);
            });
        },

        /**
         * Auto-detect delimiter among comma, semicolon, tab, pipe
         */
        _detectDelimiter(text) {
            const sampleLines = text.split(/\r?\n|\r/).slice(0, 10).filter(l => l.trim().length > 0);
            const candidates = [',', ';', '\t', '|'];
            const scores = { ',': 0, ';': 0, '\t': 0, '|': 0 };

            sampleLines.forEach(line => {
                candidates.forEach(delim => {
                    const count = (line.split(delim).length - 1);
                    scores[delim] += count;
                });
            });

            let best = ',';
            let maxCount = 0;
            candidates.forEach(d => {
                if (scores[d] > maxCount) {
                    maxCount = scores[d];
                    best = d;
                }
            });

            return maxCount > 0 ? best : ',';
        },

        /**
         * RFC 4180 CSV parser supporting quotes and escaped delimiters
         */
        _csvToMatrix(text, delimiter) {
            const matrix = [];
            let row = [];
            let inQuotes = false;
            let current = '';

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const next = text[i + 1];

                if (char === '"') {
                    if (inQuotes && next === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === delimiter && !inQuotes) {
                    row.push(current.trim());
                    current = '';
                } else if ((char === '\r' || char === '\n') && !inQuotes) {
                    row.push(current.trim());
                    current = '';
                    if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
                        matrix.push(row);
                    }
                    row = [];
                    if (char === '\r' && next === '\n') i++;
                } else {
                    current += char;
                }
            }

            if (current !== '' || row.length > 0) {
                row.push(current.trim());
                if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
                    matrix.push(row);
                }
            }

            return matrix;
        },

        /**
         * Clean and unique header strings
         */
        _sanitizeHeaders(headers) {
            const seen = {};
            return headers.map((h, idx) => {
                let name = h != null ? String(h).trim() : '';
                if (!name) name = 'Column_' + (idx + 1);
                if (seen[name]) {
                    seen[name]++;
                    return name + '_' + seen[name];
                } else {
                    seen[name] = 1;
                    return name;
                }
            });
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.DataParser = DataParser;

})(typeof window !== 'undefined' ? window : globalThis);
