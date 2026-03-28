"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pdf_service_1 = require("../services/pdf.service");
const router = (0, express_1.Router)();
/**
 * POST /api/preview
 * Body: { xml: string, xslt: string }
 * Returns: PDF file stream or JSON error
 */
router.post('/', async (req, res) => {
    const { xml, xslt } = req.body;
    if (!xml || !xslt) {
        res.status(400).json({
            success: false,
            error: 'Missing required fields',
            details: 'Both "xml" and "xslt" fields are required.',
        });
        return;
    }
    const result = await (0, pdf_service_1.generatePdf)(xml, xslt);
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
exports.default = router;
