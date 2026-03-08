import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map(s => s.trim());
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Stripe webhook needs raw body — mount BEFORE json parser
import paymentProcessingRoutes from './routes/paymentProcessing.js';
app.use('/api/payment-processing/stripe/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || './uploads')));

// Import routes
import authRoutes from './routes/auth.js';
import clientAuthRoutes from './routes/clientAuth.js';
import clientRoutes from './routes/clients.js';
import appointmentRoutes from './routes/appointments.js';
import invoiceRoutes from './routes/invoices.js';
import projectRoutes from './routes/projects.js';
import prospectRoutes from './routes/prospects.js';
import leadRoutes from './routes/leads.js';
import expenseRoutes from './routes/expenses.js';
import paymentRoutes from './routes/payments.js';
import timeEntryRoutes from './routes/timeEntries.js';
import emailTemplateRoutes from './routes/emailTemplates.js';
import notificationRoutes from './routes/notifications.js';
import activityLogRoutes from './routes/activityLog.js';
import businessDbRoutes from './routes/businessDb.js';
import researchRoutes from './routes/research.js';
import userRoutes from './routes/users.js';
import intakesRouter from './routes/intakes.js';
import auditsRouter from './routes/audits.js';
import auditCategoriesRouter from './routes/auditCategories.js';
import { templateRouter as recTemplateRouter, recRouter as recommendationsRouter } from './routes/recommendations.js';
import portalRouter from './routes/portal.js';
import clientFinancialsRouter from './routes/clientFinancials.js';
import interventionsRouter from './routes/interventions.js';
import aiRouter from './routes/ai.js';
import growthTargetsRouter from './routes/growthTargets.js';
import executionPlansRouter from './routes/executionPlans.js';
import aiRecommendationsRouter from './routes/aiRecommendations.js';
import calendarRouter from './routes/calendar.js';

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/client-auth', clientAuthRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/clients', clientFinancialsRouter);
app.use('/api/clients', interventionsRouter);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/prospects', prospectRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/business-db', businessDbRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/intakes', intakesRouter);
app.use('/api/audits', auditsRouter);
app.use('/api/audit-categories', auditCategoriesRouter);
app.use('/api/recommendation-templates', recTemplateRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/portal', portalRouter);
app.use('/api/ai', aiRouter);
app.use('/api/clients', growthTargetsRouter);
app.use('/api/clients', executionPlansRouter);
app.use('/api/ai-recommendations', aiRecommendationsRouter);
app.use('/api/payment-processing', paymentProcessingRoutes);
app.use('/api/calendar', calendarRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Three Seas Digital API running on port ${PORT}`);
});
