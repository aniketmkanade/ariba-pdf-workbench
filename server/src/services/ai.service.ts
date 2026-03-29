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
  sampleXml: string
): Promise<{ xslt: string; message: string; docType?: string }> {
  
  const { type, guidance } = detectDocumentType(sampleXml);

  const systemInstruction = `You are an expert XSL-FO and XSLT developer for SAP Ariba PDF generation.
You are currently working on a **${type}** document.

DOCUMENT-SPECIFIC GUIDANCE:
${guidance}

STRICT RULES:
1. Always output the FULL, updated XSLT code. Do not output partial snippets — your output will directly replace the user's current template.
2. The XSLT must be valid, well-formed XML.
3. The XSLT must produce valid XSL-FO output (must include fo:root, fo:layout-master-set, fo:page-sequence, fo:flow).
4. Use A4 page size (21cm x 29.7cm) with 1.5cm margins.
5. Structure your response in exactly two parts:
   a) A brief, friendly message explaining what you changed (max 2 sentences).
   b) A single markdown code block containing the complete XSLT code.

Example format:
I've restructured the layout into a professional ${type} format with clear header and item sections.

\`\`\`xml
<xsl:stylesheet version="1.0" xmlns:xsl="..." xmlns:fo="...">
  ... (complete code) ...
</xsl:stylesheet>
\`\`\`
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
        { role: 'user', content: userInstruction }
      ],
      options: {
        temperature: 0.1,
      }
    });

    const text = response.message.content;
    if (!text) {
      throw new Error('No text returned from local AI');
    }

    // Extract code block and message
    const codeBlockRegex = /```(?:xml|xslt)?\n([\s\S]*?)```/;
    const match = codeBlockRegex.exec(text);
    
    if (!match) {
      if (text.trim().startsWith('<?xml')) {
         return { xslt: text, message: 'Updated the XSLT template.', docType: type };
      }
      throw new Error('Could not extract XSLT code block from the response.');
    }

    const xsltContent = match[1].trim();
    const message = text.replace(match[0], '').trim();

    return { 
      xslt: xsltContent, 
      message: message || `Generated a professional ${type} template using Local AI.`,
      docType: type
    };

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

