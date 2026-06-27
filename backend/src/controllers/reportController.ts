import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateCSVReport, generateExcelReport, generatePDFReport } from '../services/reportService';

export async function downloadReport(req: AuthenticatedRequest, res: Response) {
  const { type, format } = req.query;

  if (!type || !format) {
    return res.status(400).json({ error: 'Report type and file format are required.' });
  }

  try {
    const filename = `${type}_report_${Date.now()}`;

    if (format === 'csv') {
      const csvContent = await generateCSVReport(type as string);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      return res.status(200).send(csvContent);
    } 
    
    else if (format === 'xlsx' || format === 'excel') {
      const excelBuffer = await generateExcelReport(type as string);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
      return res.status(200).send(excelBuffer);
    } 
    
    else if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(type as string);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
      return res.status(200).send(pdfBuffer);
    } 
    
    else {
      return res.status(400).json({ error: `Unsupported document format: ${format}` });
    }
  } catch (err: any) {
    console.error('Report Controller Error:', err);
    res.status(500).json({ error: err.message });
  }
}
