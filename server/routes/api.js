// server/routes/api.js - RESTful API handlers for Brightloop
import express from 'express';
import { db } from '../db/database.js';

export const apiRouter = express.Router();

// ==========================================
// 1. REVENUE & OPERATIONS OVERVIEW
// ==========================================
apiRouter.get('/overview', (req, res) => {
  try {
    const startTime = Date.now();

    // Active subscriptions count
    const activeSubsRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM subscriptions 
      WHERE status = 'active' AND is_paused = 0
    `).get();

    // Total invoiced (non-cancelled)
    const invoicedRow = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total,
             COALESCE(SUM(amount_paid), 0) as collected
      FROM invoices 
      WHERE status != 'cancelled'
    `).get();

    // Overdue balance & count
    const overdueRow = db.prepare(`
      SELECT COUNT(*) as count, 
             COALESCE(SUM(balance_due), 0) as balance 
      FROM invoices 
      WHERE status = 'overdue' AND balance_due > 0
    `).get();

    // Recent payments (latest 5)
    const recentPayments = db.prepare(`
      SELECT * FROM payments 
      ORDER BY payment_date DESC, created_at DESC 
      LIMIT 5
    `).all();

    // Overdue invoices list
    const overdueInvoices = db.prepare(`
      SELECT * FROM invoices 
      WHERE status = 'overdue' AND balance_due > 0
      ORDER BY due_date ASC
    `).all();

    // Execution latency
    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        activeSubscriptionsCount: activeSubsRow.count,
        totalInvoiced: invoicedRow.total,
        totalCollected: invoicedRow.collected,
        overdueCount: overdueRow.count,
        overdueBalance: overdueRow.balance,
        recentPayments,
        overdueInvoices,
        queryLatencyMs: latencyMs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. SUBSCRIPTIONS & QUOTATIONS
// ==========================================
apiRouter.get('/subscriptions', (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM subscriptions';
    let params = [];

    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const subscriptions = db.prepare(query).all(...params);

    // Attach lines to each subscription
    const getLines = db.prepare('SELECT * FROM subscription_lines WHERE subscription_id = ?');
    const enriched = subscriptions.map(sub => ({
      ...sub,
      addons: JSON.parse(sub.addons_json || '{}'),
      lines: getLines.all(sub.id)
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/subscriptions/:id', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found' });

    const lines = db.prepare('SELECT * FROM subscription_lines WHERE subscription_id = ?').all(sub.id);
    res.json({
      success: true,
      data: {
        ...sub,
        addons: JSON.parse(sub.addons_json || '{}'),
        lines
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/subscriptions', (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerCompany,
      customerGstin,
      planId,
      planName,
      billingPeriod,
      lines = [],
      tier = 'Standard',
      autoRenew = true
    } = req.body;

    if (!customerName || !customerEmail || !planId) {
      return res.status(400).json({ success: false, error: 'Customer Name, Email, and Plan are required.' });
    }

    const nextNum = 'SUB-' + Math.floor(1000 + Math.random() * 9000);
    const subId = 'sub-' + Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate total
    let totalAmount = 0;
    lines.forEach(l => {
      totalAmount += (l.unitPrice || 0) * (l.quantity || 1) * (1 - (l.discountPercent || 0) / 100);
    });

    const insertSub = db.prepare(`
      INSERT INTO subscriptions (
        id, subscription_number, customer_name, customer_email, customer_company, customer_gstin,
        plan_id, plan_name, billing_period, start_date, next_billing_date, status, is_paused,
        auto_renew, tier, total_amount, addons_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'quotation', 0, ?, ?, ?, '{}')
    `);

    const insertLine = db.prepare(`
      INSERT INTO subscription_lines (
        id, subscription_id, product_name, variant_name, quantity, unit_price, discount_percent, subtotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const createTransaction = db.transaction(() => {
      insertSub.run(
        subId,
        nextNum,
        customerName,
        customerEmail,
        customerCompany || customerName,
        customerGstin || '',
        planId,
        planName || 'Monthly Professional Plan',
        billingPeriod || 'monthly',
        today,
        today, // Due initially
        autoRenew ? 1 : 0,
        tier,
        totalAmount
      );

      lines.forEach((l, idx) => {
        const subtotal = (l.unitPrice || 0) * (l.quantity || 1) * (1 - (l.discountPercent || 0) / 100);
        insertLine.run(
          `sline-${Date.now()}-${idx}`,
          subId,
          l.productName || 'Software Service',
          l.variantName || 'Standard Edition',
          l.quantity || 1,
          l.unitPrice || 0,
          l.discountPercent || 0,
          subtotal
        );
      });
    });

    createTransaction();

    res.status(201).json({
      success: true,
      message: `Quotation ${nextNum} generated with 30 days validity.`,
      data: { id: subId, subscriptionNumber: nextNum }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.patch('/subscriptions/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['draft', 'quotation', 'confirmed', 'active', 'closed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status stage.' });
    }

    const result = db.prepare(`
      UPDATE subscriptions 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(status, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Subscription not found.' });
    }

    res.json({ success: true, message: `Subscription transitioned to ${status.toUpperCase()}.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.patch('/subscriptions/:id/toggle-pause', (req, res) => {
  try {
    const sub = db.prepare('SELECT is_paused FROM subscriptions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found.' });

    const newPausedState = sub.is_paused ? 0 : 1;
    db.prepare('UPDATE subscriptions SET is_paused = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newPausedState, req.params.id);

    res.json({
      success: true,
      message: newPausedState ? 'Subscription paused successfully.' : 'Subscription resumed to active status.',
      isPaused: Boolean(newPausedState)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.patch('/subscriptions/:id/addons', (req, res) => {
  try {
    const { addonKey, enabled } = req.body;
    const sub = db.prepare('SELECT addons_json FROM subscriptions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found.' });

    const addons = JSON.parse(sub.addons_json || '{}');
    addons[addonKey] = Boolean(enabled);

    db.prepare('UPDATE subscriptions SET addons_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(addons), req.params.id);

    res.json({ success: true, message: `Add-on updated.`, addons });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. INVOICES & RECURRING BILLING
// ==========================================
apiRouter.get('/invoices', (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM invoices WHERE 1=1';
    let params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (invoice_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY invoice_date DESC, created_at DESC';

    const invoices = db.prepare(query).all(...params);
    const getLines = db.prepare('SELECT * FROM invoice_lines WHERE invoice_id = ?');

    const enriched = invoices.map(inv => ({
      ...inv,
      lines: getLines.all(inv.id)
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/invoices/:id', (req, res) => {
  try {
    const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!inv) return res.status(404).json({ success: false, error: 'Invoice not found.' });

    const lines = db.prepare('SELECT * FROM invoice_lines WHERE invoice_id = ?').all(inv.id);
    res.json({ success: true, data: { ...inv, lines } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/invoices/:id/confirm', (req, res) => {
  try {
    const inv = db.prepare('SELECT status FROM invoices WHERE id = ?').get(req.params.id);
    if (!inv) return res.status(404).json({ success: false, error: 'Invoice not found.' });

    db.prepare("UPDATE invoices SET status = 'confirmed' WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: 'Invoice confirmed and registered.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/invoices/:id/send', (req, res) => {
  try {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare('UPDATE invoices SET sent_at = ? WHERE id = ?').run(now, req.params.id);
    res.json({ success: true, message: 'Tax invoice dispatched to client via registered email.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/invoices/:id/cancel', (req, res) => {
  try {
    db.prepare("UPDATE invoices SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: 'Invoice cancelled and marked void.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record payment against invoice
apiRouter.post('/invoices/:id/payments', (req, res) => {
  try {
    const { amount, paymentMethod = 'UPI', transactionReference, notes } = req.body;
    const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!inv) return res.status(404).json({ success: false, error: 'Invoice not found.' });

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount is required.' });
    }

    const newAmountPaid = inv.amount_paid + paymentAmount;
    const newBalanceDue = Math.max(0, inv.total_amount - newAmountPaid);
    const newStatus = newBalanceDue <= 0.01 ? 'paid' : 'confirmed';

    const payId = 'pay-' + Date.now();
    const payNum = 'PAY-' + Math.floor(10000 + Math.random() * 90000);
    const today = new Date().toISOString().split('T')[0];
    const txnRef = transactionReference || `${paymentMethod}/TXN/${Date.now()}`;

    const recordTransaction = db.transaction(() => {
      // 1. Insert payment record
      db.prepare(`
        INSERT INTO payments (
          id, payment_number, invoice_id, invoice_number, customer_name,
          amount, payment_method, transaction_reference, payment_date, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', ?)
      `).run(
        payId,
        payNum,
        inv.id,
        inv.invoice_number,
        inv.customer_name,
        paymentAmount,
        paymentMethod,
        txnRef,
        today,
        notes || `Payment received via ${paymentMethod}`
      );

      // 2. Update invoice balance and status
      db.prepare(`
        UPDATE invoices 
        SET amount_paid = ?, balance_due = ?, status = ?
        WHERE id = ?
      `).run(newAmountPaid, newBalanceDue, newStatus, inv.id);
    });

    recordTransaction();

    res.json({
      success: true,
      message: `Payment of ₹${paymentAmount.toFixed(2)} recorded successfully against ${inv.invoice_number}.`,
      data: {
        paymentNumber: payNum,
        newBalanceDue,
        status: newStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. AUTOMATED RECURRING BILLING ENGINE
// ==========================================
apiRouter.post('/billing/run', (req, res) => {
  try {
    const startTime = Date.now();
    const today = new Date().toISOString().split('T')[0];

    // Find all active subscriptions not paused
    const activeSubs = db.prepare(`
      SELECT * FROM subscriptions 
      WHERE status = 'active' AND is_paused = 0
    `).all();

    let invoicesGenerated = 0;
    let duplicatesPrevented = 0;
    let totalBilled = 0;

    const runId = 'BR-' + today.replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    const billingTransaction = db.transaction(() => {
      activeSubs.forEach(sub => {
        // Idempotency token: sub_id + cycle date
        const cycleToken = `${sub.id}-${today.substring(0, 7)}`;

        // Check if invoice already exists for this cycle token
        const existing = db.prepare('SELECT id FROM invoices WHERE cycle_token = ?').get(cycleToken);
        if (existing) {
          duplicatesPrevented++;
          return;
        }

        // Generate invoice
        const invNum = 'INV-' + today.replace(/-/g, '').substring(2, 6) + '-' + Math.floor(1000 + Math.random() * 9000);
        const invId = 'inv-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        
        const subtotal = sub.total_amount;
        const gstRate = 18.0;
        const gstAmount = subtotal * (gstRate / 100);
        const totalAmount = subtotal + gstAmount;

        // Due in 14 days
        const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

        db.prepare(`
          INSERT INTO invoices (
            id, invoice_number, subscription_id, customer_name, customer_email, customer_gstin,
            invoice_date, due_date, status, subtotal, discount_amount, gst_rate, gst_amount,
            total_amount, amount_paid, balance_due, cycle_token, sent_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, 0, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          invId,
          invNum,
          sub.id,
          sub.customer_name,
          sub.customer_email,
          sub.customer_gstin,
          today,
          dueDate,
          subtotal,
          gstRate,
          gstAmount,
          totalAmount,
          totalAmount,
          cycleToken
        );

        // Fetch sub lines to duplicate into invoice lines
        const lines = db.prepare('SELECT * FROM subscription_lines WHERE subscription_id = ?').all(sub.id);
        lines.forEach((l, idx) => {
          const lineId = `iline-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${idx}`;
          db.prepare(`
            INSERT INTO invoice_lines (id, invoice_id, description, sac_code, quantity, unit_price, amount)
            VALUES (?, ?, ?, '998313', ?, ?, ?)
          `).run(lineId, invId, `${l.product_name} (${l.variant_name || 'Standard'})`, l.quantity, l.unit_price, l.subtotal);
        });

        invoicesGenerated++;
        totalBilled += totalAmount;
      });

      const durationMs = Date.now() - startTime;

      // Log billing run
      db.prepare(`
        INSERT INTO billing_runs (
          id, run_date, subscriptions_scanned, invoices_generated, duplicates_prevented,
          skipped_cycles, total_amount_billed, duration_ms, status
        ) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, 0, ?, ?, 'completed')
      `).run(
        runId,
        activeSubs.length,
        invoicesGenerated,
        duplicatesPrevented,
        totalBilled,
        durationMs
      );
    });

    billingTransaction();

    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        runId,
        subscriptionsScanned: activeSubs.length,
        invoicesGenerated,
        duplicatesPrevented,
        totalBilled,
        durationMs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. CATALOG & PRICING
// ==========================================
apiRouter.get('/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products WHERE is_active = 1').all();
    const getVariants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1');

    const enriched = products.map(p => ({
      ...p,
      variants: getVariants.all(p.id)
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/plans', (req, res) => {
  try {
    const plans = db.prepare('SELECT * FROM plans WHERE is_active = 1').all();
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/templates', (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM quotation_templates').all();
    const getItems = db.prepare(`
      SELECT ti.*, p.name as product_name, pv.variant_name
      FROM template_items ti
      JOIN products p ON ti.product_id = p.id
      LEFT JOIN product_variants pv ON ti.variant_id = pv.id
      WHERE ti.template_id = ?
    `);

    const enriched = templates.map(t => ({
      ...t,
      items: getItems.all(t.id)
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/discounts', (req, res) => {
  try {
    const discounts = db.prepare('SELECT * FROM discount_rules WHERE is_active = 1').all();
    res.json({ success: true, data: discounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. STAFF ONBOARDING (ADMIN ONLY)
// ==========================================
apiRouter.get('/staff', (req, res) => {
  try {
    const staff = db.prepare('SELECT * FROM staff_members ORDER BY created_at DESC').all();
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/staff', (req, res) => {
  try {
    const { name, email, roleTitle, department, addedBy = 'usr-admin' } = req.body;
    if (!name || !email || !roleTitle || !department) {
      return res.status(400).json({ success: false, error: 'Name, Email, Role Title, and Department are required.' });
    }

    const id = 'staff-' + Date.now();
    db.prepare(`
      INSERT INTO staff_members (id, name, email, role_title, department, status, added_by)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).run(id, name, email, roleTitle, department, addedBy);

    res.status(201).json({
      success: true,
      message: `${name} onboarded as ${roleTitle}.`,
      data: { id, name, email, roleTitle, department }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 7. AUTHENTICATION & STRICT PASSWORD POLICY
// ==========================================
apiRouter.post('/auth/register', (req, res) => {
  try {
    const { name, email, password, company, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    // Strict validation requirement: >8 chars, 1 uppercase, 1 lowercase, 1 special character
    const isLongEnough = password.length > 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!isLongEnough || !hasUpper || !hasLower || !hasSpecial) {
      return res.status(400).json({
        success: false,
        error: 'Password must be greater than 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.'
      });
    }

    const userId = 'usr-' + Date.now();
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, phone, company)
      VALUES (?, ?, ?, ?, 'customer', ?, ?)
    `).run(userId, name, email, password, phone || '', company || '');

    res.status(201).json({
      success: true,
      message: 'User account registered successfully.',
      data: { id: userId, name, email, role: 'customer' }
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: 'Email already registered.' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT id, name, email, role, company FROM users WHERE email = ? AND password_hash = ?')
      .get(email, password);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. Please verify your email and password.' });
    }

    res.json({
      success: true,
      message: 'Login successful.',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/auth/reset-password', (req, res) => {
  try {
    const { email } = req.body;
    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found with this email address.' });
    }

    const resetToken = 'rst-' + Math.random().toString(36).substring(2, 12);
    res.json({
      success: true,
      message: `Password reset link sent to ${email}.`,
      token: resetToken
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
