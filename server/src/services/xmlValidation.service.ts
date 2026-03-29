import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  schemaApplied?: boolean;
}

export async function validateXmlFile(xmlContent: string): Promise<ValidationResult> {
  // Extract potential root tag to match with an XSD file
  const rootMatch = xmlContent.match(/<([a-zA-Z0-9_\-]+)[\s>]/);
  const rootTagName = rootMatch ? rootMatch[1] : null;

  const tmpDir = path.join(os.tmpdir(), `xml-val-${crypto.randomBytes(6).toString('hex')}`);
  await fs.promises.mkdir(tmpDir, { recursive: true });
  const xmlFile = path.join(tmpDir, 'input.xml');
  await fs.promises.writeFile(xmlFile, xmlContent, 'utf8');

  try {
    let xsdPath: string | null = null;
    
    if (rootTagName) {
      // Look for a corresponding XSD in the schemas directory
      const schemasDir = path.join(__dirname, '..', '..', '..', 'samples', 'schemas');
      const possiblePath = path.join(schemasDir, `${rootTagName}.xsd`);
      if (fs.existsSync(possiblePath)) {
        xsdPath = possiblePath;
      }
    }

    if (xsdPath) {
      // Validate against the exact XSD schema
      try {
        await execFileAsync('xmllint', ['--noout', '--schema', xsdPath, xmlFile]);
        return { valid: true, schemaApplied: true };
      } catch (err: any) {
        let stderr = err.stderr || err.message;
        // Clean up xmllint absolute paths for the user
        stderr = stderr.replace(new RegExp(xmlFile.replace(/\\/g, '\\\\'), 'g'), 'UploadedXML');
        const errors = stderr.split('\n')
          .filter((l: string) => l.trim().length > 0 && !l.includes('fails to validate'));
        return { valid: false, errors, schemaApplied: true };
      }
    } else {
      // No XSD found. Fallback: Validate basic well-formedness
      try {
        await execFileAsync('xmllint', ['--noout', xmlFile]);
        return { valid: true, schemaApplied: false };
      } catch (err: any) {
         let stderr = err.stderr || err.message;
         stderr = stderr.replace(new RegExp(xmlFile.replace(/\\/g, '\\\\'), 'g'), 'UploadedXML');
         const errors = stderr.split('\n')
          .filter((l: string) => l.trim().length > 0);
         return { valid: false, errors, schemaApplied: false };
      }
    }
  } finally {
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  }
}
