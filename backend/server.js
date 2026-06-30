const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const { pool } = require('./config/database');
const authRoutes = require('./routes/loginControllers/authRoutes');
const outletRoutes = require('./routes/outletControllers/outletroutes');
const posRoutes = require('./routes/POSControllers/POSroutes');
const dishesRoutes = require('./routes/dishesController/dishesRoutes');
const outletReportsRoutes = require('./routes/OutletReportsControllers/outletReportsRoutes');
const integrationRoutes = require('./routes/integrationControllers/integrationRoutes');
const auditLogsRoutes = require('./routes/auditLogsController/auditLogsRoutes');
// ✅ ADDED: Accounting routes — was missing entirely, which is why /api/accounting returned 404
const accountingRoutes = require('./routes/accountingControllers/accountingRoutes');
const staffAccountingRoutes = require('./routes/staffAccountingControllers/staffAccountingRoutes');
const printRoutes = require('./routes/printController/printRoutes');


// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', true);
const server = http.createServer(app);

const corsOriginEnv = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000';
const corsOrigin = corsOriginEnv.includes(',')
  ? corsOriginEnv.split(',').map(o => o.trim())
  : corsOriginEnv;

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join_outlet', (outletId) => {
    socket.join(`outlet_${outletId}`);
    console.log(`🔌 Socket ${socket.id} joined room: outlet_${outletId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ── Security & Performance ──────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "http://localhost:5000"],
      connectSrc: ["'self'", "http://localhost:5000", "ws://localhost:5000"],
      frameAncestors: ["'none'"],
    },
  },
  frameguard: { action: "deny" },
  noSniff: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

morgan.token('client-ip', (req) => {
  let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  if (ip.includes('::ffff:')) {
    ip = ip.split('::ffff:')[1];
  }
  return ip || '127.0.0.1';
});

app.use(morgan(':client-ip - :method :url :status :response-time ms'));
app.use(compression());

// ── CORS ────────────────────────────────────────────────
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// ── Rate Limiting ───────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
});
app.use("/api", limiter);

// ── Body Parsers ────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Serve Uploaded Images ───────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/dishes', dishesRoutes);
app.use('/api/reports', outletReportsRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
// ✅ ADDED: Register accounting routes at /api/accounting
app.use('/api/accounting', accountingRoutes);
app.use('/api/staff-accounting', staffAccountingRoutes);
app.use('/api/print', printRoutes);


// ── Health Check & Root Endpoints ───────────────────────
app.get("/", (req, res) => res.json({ status: "✅ Gupta Sandwich API running" }));
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'UP',
      timestamp: new Date(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      timestamp: new Date(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// ── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const testDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL database connected successfully via pg pool.');
    client.release();

    const { seedDefaultUsers } = require('./utils/seeder');
    await seedDefaultUsers(pool);

    server.listen(PORT, () => {
      console.log(`✅ Backend server is running on port ${PORT}`);
      console.log(`📍 CORS enabled for: ${corsOrigin}`);
    });
  } catch (err) {
    console.error('❌ Unable to connect to the database:', err);
    process.exit(1);
  }
};

testDatabaseConnection();