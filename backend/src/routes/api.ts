import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as customerController from '../controllers/customerController';
import * as productController from '../controllers/productController';
import * as reminderController from '../controllers/reminderController';
import * as notificationController from '../controllers/notificationController';
import * as dashboardController from '../controllers/dashboardController';
import * as aiController from '../controllers/aiController';
import * as adminController from '../controllers/adminController';
import * as reportController from '../controllers/reportController';

const router = Router();

// --- PUBLIC AUTH ROUTES ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/verify-otp', authController.verifyOtp);
router.post('/auth/reset-password', authController.resetPassword);

// --- AUTHENTICATED ROUTES ---
router.use(authenticateToken);

// Customer Management CRUD
router.get('/customers', customerController.getCustomers);
router.get('/customers/:id', customerController.getCustomerById);
router.post('/customers', requireRole(['Coordinator', 'Admin']), customerController.createCustomer);
router.put('/customers/:id', requireRole(['Coordinator', 'Admin']), customerController.updateCustomer);
router.delete('/customers/:id', requireRole(['Admin']), customerController.deleteCustomer);

// Product Directory & Stock CRUD
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', requireRole(['Coordinator', 'Admin']), productController.createProduct);
router.put('/products/:id', requireRole(['Coordinator', 'Admin']), productController.updateProduct);
router.delete('/products/:id', requireRole(['Admin']), productController.deleteProduct);

// Reminder Engine Cycles
router.get('/reminders', reminderController.getReminders);
router.post('/reminders/trigger-check', reminderController.triggerManualCheck);
router.put('/reminders/:id/status', reminderController.updateReminderStatus);
router.post('/reminders/:id/snooze', reminderController.snoozeReminder);

// Notification Logs and Previews
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/previews', notificationController.getNotificationPreviews);
router.post('/notifications/:id/send', notificationController.sendSimulatedNotification);

// Dashboard stats aggregation
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// Local Heuristics AI Engine
router.get('/ai/recommendations/:customerId', aiController.getRecommendations);

// B2B Reports Downloads
router.get('/reports/download', reportController.downloadReport);

// Admin Controls (Admin role only)
router.get('/admin/settings', requireRole(['Admin']), adminController.getSettings);
router.put('/admin/settings', requireRole(['Admin']), adminController.updateSettings);
router.get('/admin/users', requireRole(['Admin']), adminController.getUsers);
router.put('/admin/users/:id', requireRole(['Admin']), adminController.updateUserRole);
router.get('/admin/audit-logs', requireRole(['Admin']), adminController.getAuditLogs);

export default router;
