import { Router, Request, Response } from 'express';
import { validateXmlFile } from '../services/xmlValidation.service';

const router = Router();

/**
 * POST /api/validate
 * Body: { xml: string }
 * Returns: { valid: boolean, schemaApplied: boolean, errors?: string[] }
 */
router.post('/', async (req: Request, res: Response) => {
  const { xml } = req.body as { xml?: string };

  if (!xml) {
    res.status(400).json({
      valid: false,
      errors: ['Missing "xml" field in request body.']
    });
    return;
  }

  try {
    const result = await validateXmlFile(xml);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      valid: false,
      errors: [error.message || 'Internal server error during validation']
    });
  }
});

export default router;
