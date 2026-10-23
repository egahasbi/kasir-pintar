import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { generateDemandForecast, getDynamicDiscounts } from '../services/forecast.service.js';
import { handleAiChat, handleSalesInsight } from '../controllers/ai.controller.js';
import {
  getInventoryItems,
  updateProductStock,
  getLowStockAlerts,
} from '../controllers/inventory.controller.js';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized access', details: error?.message });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'cashier',
    };

    next();
  } catch (err: any) {
    res.status(500).json({ error: 'Authentication processing failed', details: err.message });
  }
};

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/ai/chat', requireAuth, handleAiChat);
router.post('/ai/sales-insight', requireAuth, handleSalesInsight);

router.get('/inventory', requireAuth, getInventoryItems);
router.patch('/inventory/:id/stock', requireAuth, updateProductStock);
router.get('/inventory/alerts/low-stock', requireAuth, getLowStockAlerts);

router.get('/inventory/forecast', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const daysParam = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const storeId = req.query.storeId as string | undefined;

    if (Number.isNaN(daysParam) || daysParam <= 0) {
      res.status(400).json({ error: 'Invalid days parameter. Must be positive integer.' });
      return;
    }

    const forecasts = await generateDemandForecast(daysParam, storeId);
    res.status(200).json({ success: true, data: forecasts });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate demand forecast',
      message: error.message || 'Internal server error',
    });
  }
});

router.get('/discounts/dynamic', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const storeId = req.query.storeId as string | undefined;

    const discounts = await getDynamicDiscounts({ category, storeId });
    res.status(200).json({ success: true, data: discounts });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve dynamic discounts',
      message: error.message || 'Internal server error',
    });
  }
});

export default router;