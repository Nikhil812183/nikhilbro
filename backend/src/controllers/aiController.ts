import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getCustomerRecommendations } from '../services/aiRecommendation';

export async function getRecommendations(req: AuthenticatedRequest, res: Response) {
  const { customerId } = req.params;

  if (!customerId) {
    return res.status(400).json({ error: 'Customer ID is required for AI recommendations' });
  }

  try {
    const payload = await getCustomerRecommendations(customerId);
    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
