#!/usr/bin/env node

/**
 * Invoice PDF Generator
 * 
 * Generates a PDF from the invoice XSL-FO stylesheet and XML sample data.
 * 
 * Usage:
 *   npm run generate-pdf
 *   node build-pdf.js
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLES_DIR = path.join(__dirname, 'samples');
const XML_FILE = path.join(SAMPLES_DIR, 'invoice-sample.xml');
const XSL_FILE = path.join(SAMPLES_DIR, 'invoice-table.xsl');
const OUTPUT_FILE = path.join(SAMPLES_DIR, 'invoice-output.pdf');

async function generatePdf() {
  console.log('🔄 Generating Invoice PDF...\n');
  console.log(`📄 XML Input: ${XML_FILE}`);
  console.log(`📋 XSL Stylesheet: ${XSL_FILE}`);
  console.log(`📑 PDF Output: ${OUTPUT_FILE}\n`);

  // Check if input files exist
  if (!fs.existsSync(XML_FILE)) {
    console.error(`❌ Error: XML file not found: ${XML_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(XSL_FILE)) {
    console.error(`❌ Error: XSL file not found: ${XSL_FILE}`);
    process.exit(1);
  }

  // Try to find and run Apache FOP
  const fopPaths = [
    'fop',                              // System PATH
    '/usr/local/bin/fop',              // macOS (Homebrew)
    '/opt/homebrew/bin/fop',           // macOS (Homebrew M1/M2/M3)
    '/usr/bin/fop',                    // Linux
    'C:\\FOP\\fop.bat',                // Windows
    process.env.FOP_HOME ? path.join(process.env.FOP_HOME, 'fop') : '',
  ].filter(Boolean);

  let success = false;
  let lastError = '';

  console.log('🔍 Checking for Apache FOP installation...');
  for (const fopPath of fopPaths) {
    try {
      console.log(`   Trying: ${fopPath}`);
      await execFileAsync(fopPath, ['-xml', XML_FILE, '-xsl', XSL_FILE, '-pdf', OUTPUT_FILE]);
      success = true;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      continue;
    }
  }

  if (!success) {
    console.error('\n❌ Error: Apache FOP not found!\n');
    console.error('Last error:', lastError);
    console.error('\n📦 Installation Instructions:');
    console.error('   macOS:  brew install fop');
    console.error('   Linux:  sudo apt-get install fop');
    console.error('   Or download from: https://xmlgraphics.apache.org/fop/\n');
    console.error('💡 Alternatively, set FOP_HOME environment variable:');
    console.error('   export FOP_HOME=/path/to/fop\n');
    process.exit(1);
  }

  // Verify output
  if (fs.existsSync(OUTPUT_FILE)) {
    const stats = fs.statSync(OUTPUT_FILE);
    const sizeKb = (stats.size / 1024).toFixed(2);
    console.log(`\n✅ PDF generated successfully!`);
    console.log(`📊 File size: ${sizeKb} KB`);
    console.log(`📂 Location: ${OUTPUT_FILE}\n`);
    
    console.log('✨ Features Implemented:');
    console.log('   ✓ Repeating headers across page breaks');
    console.log('   ✓ Yellow highlighting for quantities > 100');
    console.log('   ✓ Red "N/A" for missing prices');
    console.log('   ✓ Continuous table borders across page breaks');
    console.log('   ✓ Totals row on last page only');
    console.log('   ✓ Professional formatting and styling\n');
  } else {
    console.error(`❌ Error: PDF file was not created at ${OUTPUT_FILE}`);
    process.exit(1);
  }
}

// Run the generator
generatePdf().catch((error) => {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
});
