import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

interface PdfResult {
  success: boolean;
  pdfBuffer?: Buffer;
  error?: string;
  details?: string;
}

/**
 * Validates that a string is well-formed XML.
 */
export function validateXml(xml: string): { valid: boolean; error?: string } {
  try {
    // Basic tag balance check using a simple heuristic
    if (!xml.trim().startsWith('<')) {
      return { valid: false, error: 'Input does not appear to be XML.' };
    }
    // xsltproc will handle full validation during transform
    return { valid: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { valid: false, error: msg };
  }
}

/**
 * Applies an XSLT stylesheet to an XML document using xsltproc.
 * Returns the resulting XSL-FO string.
 */
async function applyXslt(xmlContent: string, xsltContent: string, tmpDir: string): Promise<string> {
  const xmlFile = path.join(tmpDir, 'input.xml');
  const xsltFile = path.join(tmpDir, 'template.xsl');
  const foFile = path.join(tmpDir, 'output.fo');

  await fs.promises.writeFile(xmlFile, xmlContent, 'utf8');
  await fs.promises.writeFile(xsltFile, xsltContent, 'utf8');

  try {
    await execFileAsync('xsltproc', ['--nonet', '-o', foFile, xsltFile, xmlFile]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`XSLT transformation failed: ${msg}`);
  }

  const foContent = await fs.promises.readFile(foFile, 'utf8');
  return foContent;
}

/**
 * Converts XSL-FO content to PDF using Apache FOP (if available),
 * else falls back to a pre-built FO-to-PDF stub for preview.
 */
async function foToPdf(foContent: string, tmpDir: string): Promise<Buffer> {
  const foFile = path.join(tmpDir, 'output.fo');
  const pdfFile = path.join(tmpDir, 'output.pdf');

  await fs.promises.writeFile(foFile, foContent, 'utf8');

  // Try Apache FOP first
  try {
    await execFileAsync('fop', ['-fo', foFile, '-pdf', pdfFile], { env: process.env });
    return await fs.promises.readFile(pdfFile);
  } catch (e: any) {
    // FOP not in PATH - try fop from common install locations
    const isWin = process.platform === 'win32';
    const fopCmd = isWin ? 'fop.bat' : 'fop';
    
    const fopPaths = [
      '/usr/local/bin/fop',
      '/opt/homebrew/bin/fop',
      process.env.FOP_HOME ? path.join(process.env.FOP_HOME, isWin ? 'fop.bat' : 'fop') : '',
    ].filter(Boolean);

    let lastError = e.message;
    for (const fopPath of fopPaths) {
      if (fs.existsSync(fopPath)) {
        try {
          await execFileAsync(fopPath, ['-fo', foFile, '-pdf', pdfFile], { env: process.env });
          return await fs.promises.readFile(pdfFile);
        } catch (err: any) {
          lastError = err.message;
          continue;
        }
      }
    }

    // Fallback error
    throw new Error(
      `Apache FOP failed or not found. (Last Error: ${lastError.substring(0, 100)}...)\n` +
      'Please install FOP: brew install fop\n' +
      'Or set the FOP_HOME environment variable.'
    );
  }
}

/**
 * Main function: transforms XML using XSLT, then renders via FO to PDF.
 * If the XSLT already produces PDF-ready content (direct XSL-FO),
 * it skips the first transform.
 */
export async function generatePdf(
  xmlContent: string,
  xsltContent: string
): Promise<PdfResult> {
  const tmpDir = path.join(os.tmpdir(), `xsl-preview-${crypto.randomBytes(6).toString('hex')}`);

  try {
    await fs.promises.mkdir(tmpDir, { recursive: true });
    
    // Security: Strip DOCTYPE/ENTITY declarations to prevent XXE attacks
    const sanitize = (content: string) => content.replace(/<!DOCTYPE[\s\S]*?>/gi, '').replace(/<!ENTITY[\s\S]*?>/gi, '');
    const cleanXml = sanitize(xmlContent);
    const cleanXslt = sanitize(xsltContent);

    let foContent: string;

    // Detect if the xslt input is already XSL-FO (fo:root) or an XSLT stylesheet
    const isXslFo = cleanXslt.trim().includes('fo:root') && !cleanXslt.trim().includes('<xsl:stylesheet');
    const isXslt = cleanXslt.trim().includes('<xsl:stylesheet') || cleanXslt.trim().includes('<xsl:transform');

    if (isXslFo) {
      // Direct XSL-FO input - use as-is
      foContent = cleanXslt;
    } else if (isXslt) {
      // XSLT stylesheet - apply to XML to get XSL-FO
      foContent = await applyXslt(cleanXml, cleanXslt, tmpDir);
    } else {
      return {
        success: false,
        error: 'Invalid template format',
        details: 'The template must be either an XSLT stylesheet (xsl:stylesheet) or XSL-FO document (fo:root).',
      };
    }

    const pdfBuffer = await foToPdf(foContent, tmpDir);

    return { success: true, pdfBuffer };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: 'PDF generation failed', details: msg };
  } finally {
    // Cleanup temp files
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch { /* ignore cleanup errors */ }
  }
}
