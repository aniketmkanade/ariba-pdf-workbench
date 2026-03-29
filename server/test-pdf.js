#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { generatePdf } from './dist/services/pdf.service.js';

const xmlPath = path.join(process.cwd(), 'samples/inputs/asn.xml');
const xslPath = path.join(process.cwd(), 'samples/templates/notes.xsl');
const outputPath = path.join(process.cwd(), 'samples/notes-output.pdf');

async function test() {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const xslt = fs.readFileSync(xslPath, 'utf8');

  console.log('Generating PDF...');
  const result = await generatePdf(xml, xslt);

  if (result.success && result.pdfBuffer) {
    fs.writeFileSync(outputPath, result.pdfBuffer);
    console.log(`PDF saved to ${outputPath}`);
  } else {
    console.error('Error:', result.error, result.details);
  }
}

test();