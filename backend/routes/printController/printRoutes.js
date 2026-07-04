const express = require('express');
const router = express.Router();
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const os = require('os');
const pdfToPrinter = require('pdf-to-printer');
const { v4: uuidv4 } = require('uuid');

router.post('/receipt', async (req, res) => {
  try {
    const { receiptImage, kotImage } = req.body;
    
    if (!receiptImage) {
      return res.status(400).json({ success: false, message: 'No receipt image provided' });
    }

    const processAndPrintImage = async (base64Data, label) => {
      // Create a new PDFDocument
      const pdfDoc = await PDFDocument.create();
      
      // Remove header from base64 if present (e.g., data:image/png;base64,...)
      const base64Cleaned = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const imageBytes = Buffer.from(base64Cleaned, 'base64');
      
      const pngImage = await pdfDoc.embedPng(imageBytes);
      const pngDims = pngImage.scale(0.5); // Adjust scale for thermal printer sizing

      // Add a page matching the image dimensions
      const page = pdfDoc.addPage([pngDims.width, pngDims.height]);

      // Draw the PNG image
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pngDims.width,
        height: pngDims.height,
      });

      // Serialize the PDFDocument to bytes
      const pdfBytes = await pdfDoc.save();
      
      // Write to a temporary file
      const tempFilename = path.join(os.tmpdir(), `temp_${label}_${uuidv4()}.pdf`);
      fs.writeFileSync(tempFilename, pdfBytes);

      // Send to default system printer silently
      console.log(`Printing ${label} to default printer...`);
      await pdfToPrinter.print(tempFilename);

      // Clean up temp file
      fs.unlinkSync(tempFilename);
    };

    // 1. Print Receipt
    await processAndPrintImage(receiptImage, 'receipt');

    // 2. Print KOT if it exists
    if (kotImage) {
      // Small delay between printing to avoid printer spooler issues
      await new Promise(resolve => setTimeout(resolve, 500));
      await processAndPrintImage(kotImage, 'kot');
    }

    res.json({ success: true, message: 'Printed successfully to default system printer' });
  } catch (error) {
    console.error('Printing error:', error);
    res.status(500).json({ success: false, message: 'Error printing receipt', error: error.message });
  }
});

module.exports = router;
