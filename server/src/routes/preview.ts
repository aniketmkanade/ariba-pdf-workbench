import { Router, Request, Response } from 'express';
import { generatePdf } from '../services/pdf.service';

const router = Router();

/**
 * POST /api/preview
 * Body: { xml: string, xslt: string }
 * Returns: PDF file stream or JSON error
 */
router.post('/', async (req: Request, res: Response) => {
  const { xml, xslt } = req.body as { xml?: string; xslt?: string };

  if (!xml || !xslt) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields',
      details: 'Both "xml" and "xslt" fields are required.',
    });
    return;
  }

  const result = await generatePdf(xml, xslt);

  if (!result.success || !result.pdfBuffer) {
    res.status(500).json({
      success: false,
      error: result.error || 'Unknown error',
      details: result.details,
    });
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
  res.setHeader('Content-Length', result.pdfBuffer.length);
  res.send(result.pdfBuffer);
});

export default router;
