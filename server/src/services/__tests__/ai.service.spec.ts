import ollama from 'ollama';
import { generateXsltFromPrompt } from '../ai.service';
import { validateXml } from '../pdf.service';

// Mock dependencies
jest.mock('ollama', () => ({
  chat: jest.fn(),
}));

jest.mock('../pdf.service', () => ({
  validateXml: jest.fn().mockReturnValue({ valid: true }),
}));

// Helper to cast mocked functions
const mockedOllamaChat = ollama.chat as jest.Mock;

describe('ai.service', () => {
  const prompt = 'Add a blue background to the header';
  const currentXslt = '<xsl:stylesheet>...</xsl:stylesheet>';
  const sampleXml = '<data>...</data>';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully generate XSLT from AI response', async () => {
    const mockContent = 'I have updated the header background. \n```xml\n<xsl:stylesheet>modified</xsl:stylesheet>\n```';
    
    mockedOllamaChat.mockResolvedValueOnce({
      message: { content: mockContent }
    });

    const result = await generateXsltFromPrompt(prompt, currentXslt, sampleXml);

    expect(result.xslt).toBe('<xsl:stylesheet>modified</xsl:stylesheet>');
    expect(result.message).toContain('I have updated the header background');
    expect(mockedOllamaChat).toHaveBeenCalledTimes(1);
    expect(mockedOllamaChat).toHaveBeenCalledWith(expect.objectContaining({
        model: 'qwen2.5-coder:7b',
        messages: expect.any(Array),
    }));
  });

  it('should handle XML content without code blocks', async () => {
    const mockContent = '<?xml version="1.0"?><xsl:stylesheet>no-code-block</xsl:stylesheet>';
    
    mockedOllamaChat.mockResolvedValueOnce({
      message: { content: mockContent }
    });

    const result = await generateXsltFromPrompt(prompt, currentXslt, sampleXml);

    expect(result.xslt).toBe(mockContent);
    expect(result.message).toBe('Updated the XSLT template.');
  });

  it('should throw error when ollama is not running', async () => {
    mockedOllamaChat.mockRejectedValueOnce(new Error('fetch failed: connection refused'));

    await expect(generateXsltFromPrompt(prompt, currentXslt, sampleXml))
      .rejects.toThrow('Ollama is not running. Please start the Ollama application on your Mac.');
  });

  it('should throw error when model is not found', async () => {
    mockedOllamaChat.mockRejectedValueOnce(new Error('model not found'));

    await expect(generateXsltFromPrompt(prompt, currentXslt, sampleXml))
      .rejects.toThrow('The required AI model is not downloaded. Please run "ollama run qwen2.5-coder:7b" in your terminal first.');
  });

  it('should throw error when no code block is found', async () => {
    mockedOllamaChat.mockResolvedValueOnce({
      message: { content: 'This is not XML and has no code block.' }
    });

    await expect(generateXsltFromPrompt(prompt, currentXslt, sampleXml))
      .rejects.toThrow('Could not extract XSLT code block from the response.');
  });
});
