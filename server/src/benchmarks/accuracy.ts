import { generateXsltFromPrompt } from '../services/ai.service';
import { validateXml } from '../services/pdf.service';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);
const ITERATIONS = 10;
const DOC_TYPES = ['asn', 'hu', 'po'];

const SAMPLE_XML: Record<string, string> = {
  po: `<?xml version="1.0" encoding="UTF-8"?>
<PurchaseOrder orderID="PO-2024-001" orderDate="2024-01-15">
  <Supplier><Name>Acme Supplies</Name></Supplier>
  <Buyer><Name>SAP Ariba Demo</Name></Buyer>
  <LineItems>
    <LineItem><Description>Widget A</Description><Quantity>100</Quantity><UnitPrice>15.50</UnitPrice></LineItem>
  </LineItems>
  <TotalAmount>1550.00</TotalAmount>
</PurchaseOrder>`,

  asn: `<?xml version="1.0" encoding="UTF-8"?>
<AdvanceShipNotice asnID="ASN-2024-055" shipDate="2024-01-20">
  <Shipper><Name>Acme Logistics</Name></Shipper>
  <ShipTo><Name>Warehouse A</Name></ShipTo>
  <Items>
    <Item><PartNum>P-101</PartNum><Qty>500</Qty></Item>
  </Items>
</AdvanceShipNotice>`,

  hu: `<?xml version="1.0" encoding="UTF-8"?>
<HandlingUnitHierarchy shipmentID="SHIP-2024-099">
  <HandlingUnit huID="P-001" type="Pallet">
    <HandlingUnit huID="B-001" type="Box">
      <Item itemID="PART-X" quantity="50"/>
    </HandlingUnit>
  </HandlingUnit>
</HandlingUnitHierarchy>`,
};

const INITIAL_XSLT = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
  <xsl:template match="/"><fo:root><fo:layout-master-set><fo:simple-page-master master-name="A4"><fo:region-body/></fo:simple-page-master></fo:layout-master-set><fo:page-sequence master-reference="A4"><fo:flow flow-name="xsl-region-body"><fo:block>Initial</fo:block></fo:flow></fo:page-sequence></fo:root></xsl:template>
</xsl:stylesheet>`;

async function validateXslt(xmlContent: string, xsltContent: string): Promise<{ success: boolean; error?: string }> {
    const tmpDir = path.join(os.tmpdir(), `bench-${crypto.randomBytes(4).toString('hex')}`);
    try {
        await fs.promises.mkdir(tmpDir, { recursive: true });
        const xmlFile = path.join(tmpDir, 'in.xml');
        const xslFile = path.join(tmpDir, 'tmpl.xsl');
        const foFile = path.join(tmpDir, 'out.fo');

        await fs.promises.writeFile(xmlFile, xmlContent);
        await fs.promises.writeFile(xslFile, xsltContent);

        // Use xsltproc to verify the transform works and produces valid XSL-FO
        await execFileAsync('xsltproc', ['--nonet', '-o', foFile, xslFile, xmlFile]);
        
        // Basic check: did it produce <fo:root>?
        const foResult = await fs.promises.readFile(foFile, 'utf8');
        if (!foResult.includes('fo:root')) {
            return { success: false, error: 'Output missing fo:root' };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    } finally {
        await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
}

async function runBenchmark() {
  console.log('🚀 Accuracy Benchmark (using xsltproc validation)');
  const results: Record<string, { total: number; success: number; errors: string[] }> = {};

  for (const type of DOC_TYPES) {
    console.log(`\n📂 Testing: ${type.toUpperCase()}`);
    results[type] = { total: ITERATIONS, success: 0, errors: [] };
    const xml = SAMPLE_XML[type];

    for (let i = 1; i <= ITERATIONS; i++) {
        process.stdout.write(`  [${i}/${ITERATIONS}] Generating... `);
        try {
            const aiPrompt = `Generate a robust XSL-FO template for an ${type.toUpperCase()} document. Use tables for items and clear headers.`;
            const aiResponse = await generateXsltFromPrompt(aiPrompt, INITIAL_XSLT, xml);
            
            const valResult = await validateXslt(xml, aiResponse.xslt);
            if (valResult.success) {
                results[type].success++;
                process.stdout.write('✅ PASS\n');
            } else {
                throw new Error(valResult.error);
            }
        } catch (err: any) {
            results[type].errors.push(err.message);
            process.stdout.write(`❌ FAIL (${err.message.substring(0, 40)}...)\n`);
        }
    }
  }

  // Generate Report
  const reportPath = path.join(process.cwd(), 'accuracy_report.md');
  let report = `# AI Generation Accuracy Report\n\n`;
  report += `| Format | Success Rate | Pass/Total |\n`;
  report += `| :--- | :--- | :--- |\n`;

  for (const type of DOC_TYPES) {
      const accuracy = (results[type].success / ITERATIONS) * 100;
      report += `| ${type.toUpperCase()} | **${accuracy.toFixed(0)}%** | ${results[type].success}/${ITERATIONS} |\n`;
  }
  
  report += `\n> **Note**: Accuracy was measured by verifying if the AI generated valid XSL-FO (checked via xsltproc transformation) for the given XML inputs.`;
  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Report generated: ${reportPath}`);
}

runBenchmark();
