"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateXsltFromPrompt = generateXsltFromPrompt;
const ollama_1 = __importDefault(require("ollama"));
/**
 * Calls a local Ollama model to generate or update XSL-FO based on the user's prompt.
 */
async function generateXsltFromPrompt(prompt, currentXslt, sampleXml) {
    const systemInstruction = `You are an expert XSL-FO and XSLT developer for Ariba PDF generation.
Your job is to understand the user's request and output the complete, modified XSLT/XSL-FO code.

RULES:
1. Always output the FULL, updated XSLT code. Do not output partial snippets because your output will directly replace the user's current template.
2. The XSLT must be valid XML.
3. The XSLT must produce valid XSL-FO (fo:root, fo:layout-master-set, fo:page-sequence, etc.)
4. Structure your response in exactly two parts:
   a) A brief, friendly message explaining what you changed (max 2 sentences).
   b) A single markdown code block containing the complete XSLT code.
   
Example format:
I have updated the header background color to blue as requested.

\`\`\`xml
<xsl:stylesheet ...>
  ... (complete code) ...
</xsl:stylesheet>
\`\`\`
`;
    const userInstruction = `
User Request: ${prompt}

Here is the current XSLT template:
\`\`\`xml
${currentXslt}
\`\`\`

Here is the sample XML data we are working with:
\`\`\`xml
${sampleXml}
\`\`\`

Please provide the updated XSLT code according to the rules.`;
    try {
        const response = await ollama_1.default.chat({
            model: 'qwen2.5-coder:7b', // A strong open-source coding model
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: userInstruction }
            ],
            options: {
                temperature: 0.1, // Keep it deterministic for code generation
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
            // If the model didn't use a code block, try to parse the whole text if it looks like XML
            if (text.trim().startsWith('<?xml')) {
                return { xslt: text, message: 'Updated the XSLT template.' };
            }
            throw new Error('Could not extract XSLT code block from the response.');
        }
        const xsltContent = match[1].trim();
        const message = text.replace(match[0], '').trim();
        return {
            xslt: xsltContent,
            message: message || 'I have generated the updated template for you using Local AI.'
        };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Local AI (Ollama) Error:', msg);
        // Provide a helpful error if Ollama is not running or model not found
        if (msg.includes('connection refused') || msg.includes('fetch failed')) {
            throw new Error('Ollama is not running. Please start the Ollama application on your Mac.');
        }
        else if (msg.includes('not found')) {
            throw new Error('The required AI model is not downloaded. Please run "ollama run qwen2.5-coder:7b" in your terminal first.');
        }
        throw new Error(`Failed to generate XSLT: ${msg}`);
    }
}
