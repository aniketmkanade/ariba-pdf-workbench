import ollama from 'ollama';
import { validateXml } from './pdf.service';

/**
 * Detects the Ariba document type from the XML root element.
 */
function detectDocumentType(xml: string): { type: 'ASN' | 'HU' | 'PO' | 'UNKNOWN'; guidance: string } {
  const trimmed = xml.trim();
  if (trimmed.includes('<AdvanceShipNotice') || trimmed.includes('<ASN')) {
    return {
      type: 'ASN',
      guidance: `This is an **Advance Shipping Notice (ASN)**. Focus on:
- A prominent shipment header showing ASN ID, ship date, and delivery date.
- A shipper/carrier section with tracking number.
- A table of Handling Units (HU) with weight and dimensions.
- A contents table listing items with part numbers and quantities.`
    };
  }
  if (trimmed.includes('<HandlingUnitHierarchy') || trimmed.includes('<HU')) {
    return {
      type: 'HU',
      guidance: `This is a **Handling Unit (HU) Hierarchy** document. Focus on:
- A recursive, nested visual representation using indented blocks for each HU level.
- Each HU block should show the HU ID, type (Pallet/Box/InnerPack), weight, and dimensions.
- Items at the leaf nodes should be listed clearly within their parent HU block.
- Use distinct left-border colors per level to make nesting visually clear.`
    };
  }
  if (trimmed.includes('<PurchaseOrder') || trimmed.includes('<PO')) {
    return {
      type: 'PO',
      guidance: `This is a **Purchase Order (PO)**. Focus on:
- A formal document layout with PO Number, order date, and currency prominently displayed.
- Side-by-side supplier and buyer address blocks.
- A detailed line items table with columns for Description, Quantity, Unit Price, and Total Price.
- A summary section at the bottom with subtotal, tax, and grand total.`
    };
  }
  return { type: 'UNKNOWN', guidance: 'Generate a professional, clean document layout.' };
}

/**
 * Calls a local Ollama model to generate or update XSL-FO based on the user's prompt.
 * Automatically detects the document type (ASN/HU/PO) to provide targeted guidance.
 */
export async function generateXsltFromPrompt(
  prompt: string,
  currentXslt: string,
  sampleXml: string,
  history: any[] = []
): Promise<{ xslt: string; message: string; docType?: string; diffs?: {search: string, replace: string}[]; fullText?: boolean }> {
  
  const { type, guidance } = detectDocumentType(sampleXml);

  const systemInstruction = `You are the **Ariba PDF Workbench AI**, a specialized local agent for SAP Ariba PDF engineering. Under no circumstances should you claim to be any other AI assistant (e.g., Claude, Haiku, GPT, etc.). You are an expert XML publishing engineer specializing in XSLT 1.0 and XSL-FO used with Apache FOP.

You are currently working on a **${type}** document.

DOCUMENT-SPECIFIC GUIDANCE:
${guidance}

STRICT RULES:
1. Carefully analyze the XML data provided as context. Map every requirement dynamically to appropriate XSLT or XSL-FO constructs.
2. The transformation MUST work for dynamic XML data. Do not assume a fixed number of elements (e.g. use apply-templates or for-each, do not hardcode single nodes).
3. Do not hard-code text values unless explicitly required.
4. Do not add features not explicitly requested in the requirements.
5. Use the simplest XSL-FO solution that satisfies the requirements.
6. Use XSLT 1.0 only and generate valid standard XSL-FO inside the transformation. CRITICAL: Do NOT use XSLT 2.0 functions (e.g. current-date(), format-date(), date-time()). Only XSLT 1.0 constructs are allowed.
7. Use correct FO structures such as: fo:root, fo:layout-master-set, fo:simple-page-master, fo:page-sequence, fo:static-content, fo:flow.
8. When needed, use advanced FO features (page-number, page-number-citation, markers, conditional page masters, dynamic page sequences).
9. Use A4 page size (21.0cm x 29.7cm) with 1.5cm margins.
10. CRITICAL RULE: Under NO circumstances should you output, alter, or mock input XML data. Do not hallucinate extra line items. Your ONE AND ONLY job is to write the dynamic XSLT stylesheet. If the data lacks items to test pagination, write an XSLT loop that behaves correctly when elements *do* exist, but NEVER return XML data.
11. CRITICAL RULE: You must output ONLY SEARCH/REPLACE blocks. Do NOT output the entire XSLT file. Use this exact syntax to specify what to change:
<<<<
[exact lines to replace, including exact whitespace]
====
[new lines to insert]
>>>>

Output format:
1. Brief explanation of the approach and notes about how the requirements are satisfied (max 3 sentences).
2. One or more SEARCH/REPLACE blocks.

Example format:
I've updated the table to support dynamic pagination across multiple pages and applied the required headers.

<<<<
    <fo:table-row>
      <fo:table-cell>
====
    <fo:table-row border-bottom="1pt solid black">
      <fo:table-cell background-color="#f0f0f0">
>>>>
`;

  const userInstruction = `
User Request: ${prompt}

Current XSLT template (update this):
\`\`\`xml
${currentXslt}
\`\`\`

Live XML data to map (${type} format):
\`\`\`xml
${sampleXml}
\`\`\`

IMPORTANT: Map the actual XML field names from the data above into your xsl:value-of selects. Do not use placeholder names.
Please provide the updated XSLT code according to the rules.`;

  try {
    const response = await ollama.chat({
      model: 'qwen2.5-coder:7b',
      messages: [
        { role: 'system', content: systemInstruction },
        ...history,
        { role: 'user', content: userInstruction }
      ],
      options: {
        temperature: 0.1,
        num_ctx: 8192
      }
    });

    const text = response.message.content;
    if (!text) {
      throw new Error('No text returned from local AI');
    }

    // Parse SEARCH/REPLACE blocks
    const diffs: {search: string, replace: string}[] = [];
    const diffRegex = /<<<<\n([\s\S]*?)\n====\n([\s\S]*?)\n>>>>/g;
    let m;
    while ((m = diffRegex.exec(text)) !== null) {
      diffs.push({ search: m[1], replace: m[2] });
    }

    if (diffs.length > 0) {
      const message = text.replace(/<<<<[\s\S]*?>>>>/g, '').trim();
      return { xslt: currentXslt, message: message || 'Applied patches.', docType: type, diffs, fullText: false };
    }

    // Fallback code block
    const codeBlockRegex = /```(?:xml|xslt)?\n([\s\S]*?)```/;
    const match = codeBlockRegex.exec(text);
    
    if (match) {
      const xsltContent = match[1].trim();
      const message = text.replace(match[0], '').trim();
      return { 
        xslt: xsltContent, 
        message: message || `Generated a professional ${type} template using Local AI.`,
        docType: type,
        fullText: true
      };
    } else if (text.trim().startsWith('<?xml')) {
      return { xslt: text, message: 'Updated the XSLT template.', docType: type, fullText: true };
    }

    return { xslt: currentXslt, message: text.trim(), docType: type, diffs: [], fullText: false };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Local AI (Ollama) Error:', msg);
    
    if (msg.includes('connection refused') || msg.includes('fetch failed')) {
      throw new Error('Ollama is not running. Please start the Ollama application on your Mac.');
    } else if (msg.includes('not found')) {
      throw new Error('The required AI model is not downloaded. Please run "ollama run qwen2.5-coder:7b" in your terminal first.');
    }
    
    throw new Error(`Failed to generate XSLT: ${msg}`);
  }
}

