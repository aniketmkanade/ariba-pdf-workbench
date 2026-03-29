import { generatePdf, validateXml } from '../pdf.service';
import fs from 'fs';
import { execFile } from 'child_process';

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('mocked content'),
    mkdir: jest.fn().mockResolvedValue(undefined),
    rm: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('child_process', () => ({
  execFile: jest.fn(),
}));

// Helper to cast mocked functions
const mockedExecFile = execFile as unknown as jest.Mock;
const mockedExistSync = fs.existsSync as jest.Mock;
const mockedReadFile = fs.promises.readFile as jest.Mock;

describe('pdf.service', () => {
  describe('validateXml', () => {
    it('should return valid for well-formed XML', () => {
      const result = validateXml('<root><child>data</child></root>');
      expect(result.valid).toBe(true);
    });

    it('should return invalid for non-XML strings', () => {
      const result = validateXml('this is not xml');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Input does not appear to be XML.');
    });
  });

  describe('generatePdf', () => {
    const mockXml = '<data>test</data>';
    const mockXslt = '<xsl:stylesheet>...</xsl:stylesheet>';
    const mockFo = '<fo:root>...</fo:root>';

    beforeEach(() => {
      jest.clearAllMocks();
      // By default, no FOP fallback paths exist
      mockedExistSync.mockReturnValue(false);
    });

    it('should generate PDF from XSLT and XML', async () => {
      mockedExecFile.mockImplementation((...args: any[]) => {
        const cb = args[args.length - 1];
        cb(null, { stdout: '', stderr: '' });
      });
      mockedReadFile
        .mockResolvedValueOnce(mockFo)
        .mockResolvedValueOnce(Buffer.from('pdf-binary-data'));

      const result = await generatePdf(mockXml, mockXslt);

      expect(result.success).toBe(true);
      expect(result.pdfBuffer).toBeDefined();
    });

    it('should generate PDF directly from XSL-FO input', async () => {
      mockedExecFile.mockImplementation((...args: any[]) => {
        const cb = args[args.length - 1];
        cb(null, { stdout: '', stderr: '' });
      });
      mockedReadFile.mockResolvedValueOnce(Buffer.from('pdf-binary-data'));

      const result = await generatePdf(mockXml, mockFo);

      expect(result.success).toBe(true);
      expect(result.pdfBuffer).toBeDefined();
    });

    it('should handle XSLT transformation failure', async () => {
      mockedExecFile.mockImplementation((...args: any[]) => {
        const cb = args[args.length - 1];
        const cmd = args[0];
        if (cmd === 'xsltproc') {
          cb(new Error('xsltproc error'), { stdout: '', stderr: 'transform failed' });
        } else {
          cb(null, { stdout: '', stderr: '' });
        }
      });

      const result = await generatePdf(mockXml, mockXslt);

      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF generation failed');
      expect(result.details).toContain('XSLT transformation failed');
    });

    it('should handle FOP failure and return helpful error', async () => {
      mockedExecFile.mockImplementation((...args: any[]) => {
        const cb = args[args.length - 1];
        cb(new Error('spawn fop ENOENT'), { stdout: '', stderr: '' });
      });

      const result = await generatePdf(mockXml, mockFo);

      expect(result.success).toBe(false);
      expect(result.details).toContain('Apache FOP failed or not found');
    });
  });
});
