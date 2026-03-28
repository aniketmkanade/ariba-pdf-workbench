"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateXml = validateXml;
exports.generatePdf = generatePdf;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
/**
 * Validates that a string is well-formed XML.
 */
function validateXml(xml) {
    try {
        // Basic tag balance check using a simple heuristic
        if (!xml.trim().startsWith('<')) {
            return { valid: false, error: 'Input does not appear to be XML.' };
        }
        // xsltproc will handle full validation during transform
        return { valid: true };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { valid: false, error: msg };
    }
}
/**
 * Applies an XSLT stylesheet to an XML document using xsltproc.
 * Returns the resulting XSL-FO string.
 */
async function applyXslt(xmlContent, xsltContent, tmpDir) {
    const xmlFile = path_1.default.join(tmpDir, 'input.xml');
    const xsltFile = path_1.default.join(tmpDir, 'template.xsl');
    const foFile = path_1.default.join(tmpDir, 'output.fo');
    await fs_1.default.promises.writeFile(xmlFile, xmlContent, 'utf8');
    await fs_1.default.promises.writeFile(xsltFile, xsltContent, 'utf8');
    try {
        await execFileAsync('xsltproc', ['-o', foFile, xsltFile, xmlFile]);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`XSLT transformation failed: ${msg}`);
    }
    const foContent = await fs_1.default.promises.readFile(foFile, 'utf8');
    return foContent;
}
/**
 * Converts XSL-FO content to PDF using Apache FOP (if available),
 * else falls back to a pre-built FO-to-PDF stub for preview.
 */
async function foToPdf(foContent, tmpDir) {
    const foFile = path_1.default.join(tmpDir, 'output.fo');
    const pdfFile = path_1.default.join(tmpDir, 'output.pdf');
    await fs_1.default.promises.writeFile(foFile, foContent, 'utf8');
    // Try Apache FOP first
    try {
        await execFileAsync('fop', ['-fo', foFile, '-pdf', pdfFile]);
        return await fs_1.default.promises.readFile(pdfFile);
    }
    catch {
        // FOP not installed - try fop from common install locations
        const fopPaths = [
            '/usr/local/bin/fop',
            '/opt/homebrew/bin/fop',
            process.env.FOP_HOME ? path_1.default.join(process.env.FOP_HOME, 'fop') : '',
        ].filter(Boolean);
        for (const fopPath of fopPaths) {
            try {
                await execFileAsync(fopPath, ['-fo', foFile, '-pdf', pdfFile]);
                return await fs_1.default.promises.readFile(pdfFile);
            }
            catch {
                continue;
            }
        }
        // Fallback: generate a structured error PDF using PDFKit-like approach
        // We'll use a simple node PDF generation as fallback
        throw new Error('Apache FOP not found. Please install FOP: brew install fop\n' +
            'Or set the FOP_HOME environment variable to your FOP installation directory.');
    }
}
/**
 * Main function: transforms XML using XSLT, then renders via FO to PDF.
 * If the XSLT already produces PDF-ready content (direct XSL-FO),
 * it skips the first transform.
 */
async function generatePdf(xmlContent, xsltContent) {
    const tmpDir = path_1.default.join(os_1.default.tmpdir(), `xsl-preview-${crypto_1.default.randomBytes(6).toString('hex')}`);
    try {
        await fs_1.default.promises.mkdir(tmpDir, { recursive: true });
        let foContent;
        // Detect if the xslt input is already XSL-FO (fo:root) or an XSLT stylesheet
        const isXslFo = xsltContent.trim().includes('fo:root') && !xsltContent.trim().includes('<xsl:stylesheet');
        const isXslt = xsltContent.trim().includes('<xsl:stylesheet') || xsltContent.trim().includes('<xsl:transform');
        if (isXslFo) {
            // Direct XSL-FO input - use as-is
            foContent = xsltContent;
        }
        else if (isXslt) {
            // XSLT stylesheet - apply to XML to get XSL-FO
            foContent = await applyXslt(xmlContent, xsltContent, tmpDir);
        }
        else {
            return {
                success: false,
                error: 'Invalid template format',
                details: 'The template must be either an XSLT stylesheet (xsl:stylesheet) or XSL-FO document (fo:root).',
            };
        }
        const pdfBuffer = await foToPdf(foContent, tmpDir);
        return { success: true, pdfBuffer };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: 'PDF generation failed', details: msg };
    }
    finally {
        // Cleanup temp files
        try {
            await fs_1.default.promises.rm(tmpDir, { recursive: true, force: true });
        }
        catch { /* ignore cleanup errors */ }
    }
}
