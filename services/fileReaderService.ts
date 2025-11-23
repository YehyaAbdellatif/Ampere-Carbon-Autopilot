import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import * as XLSX from 'xlsx';

// Set the worker source for pdf.js to enable PDF processing in the browser.
// Using the CDN link ensures the worker file is available without complex build configuration.
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs';
}

/**
 * Reads the textual content from a given file.
 * Supports .txt, .md, .docx, .pdf, and .xlsx/.xls files.
 * @param file The file to read.
 * @returns A promise that resolves with the text content of the file.
 */
export const readFileContent = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'doc') {
    return Promise.reject(new Error(".doc files are not supported. Please convert to .docx, .pdf, or .txt format."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          return reject(new Error("Failed to read file."));
        }

        if (extension === 'docx') {
          const result = await mammoth.extractRawText({ arrayBuffer: event.target.result as ArrayBuffer });
          resolve(result.value);
        } else if (extension === 'pdf') {
          // Pass the data as a Uint8Array, which is more robust for pdf.js.
          const pdfData = new Uint8Array(event.target.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          const numPages = pdf.numPages;
          let fullText = '';
          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // The items array can contain more than just TextItem, so we check for 'str' property.
            const pageText = textContent.items.map(item => ('str' in item ? (item as any).str : '')).join(' ');
            fullText += pageText + '\n';
          }
          resolve(fullText);
        } else if (extension === 'xlsx' || extension === 'xls') {
          const data = new Uint8Array(event.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          let text = '';
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            text += `--- Sheet: ${sheetName} ---\n`;
            // @ts-ignore
            text += jsonData.map((row: any[]) => row.join(', ')).join('\n');
            text += '\n\n';
          });
          resolve(text);
        } else {
          // This case handles .txt, .md, and other text-based files. The result is already a string.
          resolve(event.target.result as string);
        }
      } catch (error: any) {
        console.error("Error processing file:", error);
        reject(new Error(`Could not process ${file.name}. Error: ${error.message || error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    // For docx, pdf, and xlsx we need to read as ArrayBuffer. For others, read as text.
    if (extension === 'docx' || extension === 'pdf' || extension === 'xlsx' || extension === 'xls') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};