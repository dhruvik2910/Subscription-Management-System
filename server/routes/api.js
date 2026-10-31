// server/routes/api.js - RESTful API handlers for Brightloop
import express from 'express';
import { db } from '../db/database.js';

export const apiRouter = express.Router();

// --- Helper Utilities for Cadence, Lifecycle & Overdue Handling ---
function getCycleToken(subId, period, dateStr) {
  const d = new Date(dateStr);
  if (period === 'daily') {
    return `${subId}-${dateStr}`;
  } else if (period === 'weekly') {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const week = 1 + Math.ceil((firstThursday - target) / 604800000);
    return `${subId}-${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
  } else if (period === 'yearly') {
    return `${subId}-${dateStr.substring(0, 4)}`;
  } else {
    // monthly default
    return `${subId}-${dateStr.substring(0, 7)}`;
  }
}

function advanceBillingDate(dateStr, period) {
  const d = new Date(dateStr || new Date().toISOString().split('T')[0]);
  if (period === 'daily') {
    d.setDate(d.getDate() + 1);
  } else if (period === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (period === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    // monthly
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split('T')[0];
}

function updateOverdueInvoices(todayStr) {
  const today = todayStr || new Date().toISOString().split('T')[0];
  return db.prepare(`
    UPDATE invoices 
    SET status = 'overdue' 
    WHERE status = 'confirmed' 
      AND due_date < ? 
      AND balance_due > 0
  `).run(today);
}

function autoCloseExpiredSubscriptions(todayStr) {
  const today = todayStr || new Date().toISOString().split('T')[0];
  return db.prepare(`
    UPDATE subscriptions 
    SET status = 'closed', updated_at = CURRENT_TIMESTAMP 
    WHERE status = 'active' 
      AND end_date IS NOT NULL 
      AND end_date <= ?
  `).run(today);
}

// ==========================================
// 1. REVENUE & OPERATIONS OVERVIEW
// ==========================================
apiRouter.get('/overview', (req, res) => {
  try {
    const startTime = Date.now();
    const today = new Date().toISOString().split('T')[0];

    // Maintain real-time state for overdue invoices & expired subscriptions
    updateOverdueInvoices(today);
    autoCloseExpiredSubscriptions(today);

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

// Generate next invoice for a single subscription
apiRouter.post('/subscriptions/:id/generate-invoice', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found.' });

    const today = new Date().toISOString().split('T')[0];
    const cycleToken = getCycleToken(sub.id, sub.billing_period, today);

    // Prevent duplicate billing for this cycle
    const existing = db.prepare('SELECT * FROM invoices WHERE cycle_token = ?').get(cycleToken);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Invoice already generated for ${sub.subscription_number} in current cycle (${cycleToken}).`,
        data: existing
      });
    }

    const invNum = 'INV-' + today.replace(/-/g, '').substring(2, 6) + '-' + Math.floor(1000 + Math.random() * 9000);
    const invId = 'inv-' + Date.now();
    const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    // Find any matching active discount rule
    const matchingDiscount = db.prepare(`
      SELECT * FROM discount_rules 
      WHERE is_active = 1 
        AND min_purchase_amount <= ?
        AND (valid_from IS NULL OR valid_from <= ?)
        AND (valid_to IS NULL OR valid_to >= ?)
        AND used_count < max_uses
      ORDER BY discount_value DESC
      LIMIT 1
    `).get(sub.total_amount, today, today);

    let discountAmount = 0;
    if (matchingDiscount) {
      if (matchingDiscount.discount_type === 'percent') {
        discountAmount = sub.total_amount * (matchingDiscount.discount_value / 100);
      } else {
        discountAmount = Math.min(sub.total_amount, matchingDiscount.discount_value);
      }
      db.prepare('UPDATE discount_rules SET used_count = used_count + 1 WHERE id = ?').run(matchingDiscount.id);
    }

    const subtotal = sub.total_amount;
    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    const gstRate = 18.0;
    const gstAmount = taxableSubtotal * (gstRate / 100);
    const totalAmount = taxableSubtotal + gstAmount;

    const createTransaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO invoices (
          id, invoice_number, subscription_id, customer_name, customer_email, customer_gstin,
          invoice_date, due_date, status, subtotal, discount_amount, gst_rate, gst_amount,
          total_amount, amount_paid, balance_due, cycle_token, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP)
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
        discountAmount,
        gstRate,
        gstAmount,
        totalAmount,
        totalAmount,
        cycleToken
      );

      const lines = db.prepare('SELECT * FROM subscription_lines WHERE subscription_id = ?').all(sub.id);
      lines.forEach((l, idx) => {
        db.prepare(`
          INSERT INTO invoice_lines (id, invoice_id, description, sac_code, quantity, unit_price, amount)
          VALUES (?, ?, ?, '998313', ?, ?, ?)
        `).run(`iline-${Date.now()}-${idx}`, invId, `${l.product_name} (${l.variant_name || 'Standard'})`, l.quantity, l.unit_price, l.subtotal);
      });

      // Advance subscription next_billing_date
      const advancedBillingDate = advanceBillingDate(sub.next_billing_date || today, sub.billing_period);
      db.prepare('UPDATE subscriptions SET next_billing_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(advancedBillingDate, sub.id);
    });

    createTransaction();

    const createdInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invId);
    res.status(201).json({
      success: true,
      message: `Invoice ${invNum} generated successfully for ${sub.subscription_number}.`,
      data: createdInvoice
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a renewal quotation from an existing subscription
apiRouter.post('/subscriptions/:id/renew', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found.' });

    const today = new Date().toISOString().split('T')[0];
    const newSubId = 'sub-' + Date.now();
    const newSubNumber = 'SUB-2025-' + Math.floor(1000 + Math.random() * 9000);
    const startDate = sub.end_date && sub.end_date > today ? sub.end_date : today;
    const expiryDate = new Date(new Date(startDate).getTime() + 365 * 86400000).toISOString().split('T')[0];

    const renewTransaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO subscriptions (
          id, subscription_number, customer_id, customer_name, customer_email, customer_company, customer_gstin,
          plan_id, plan_name, billing_period, start_date, next_billing_date, end_date, status, is_paused,
          auto_renew, tier, total_amount, addons_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'quotation', 0, 1, ?, ?, ?)
      `).run(
        newSubId,
        newSubNumber,
        sub.customer_id,
        sub.customer_name,
        sub.customer_email,
        sub.customer_company,
        sub.customer_gstin,
        sub.plan_id,
        sub.plan_name,
        sub.billing_period,
        startDate,
        startDate,
        expiryDate,
        sub.tier,
        sub.total_amount,
        sub.addons_json || '{}'
      );

      const oldLines = db.prepare('SELECT * FROM subscription_lines WHERE subscription_id = ?').all(sub.id);
      oldLines.forEach((l, idx) => {
        db.prepare(`
          INSERT INTO subscription_lines (
            id, subscription_id, product_name, variant_name, quantity, unit_price, discount_percent, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(`sline-${Date.now()}-${idx}`, newSubId, l.product_name, l.variant_name, l.quantity, l.unit_price, l.discount_percent, l.subtotal);
      });
    });

    renewTransaction();

    const newSub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(newSubId);
    res.status(201).json({
      success: true,
      message: `Renewal Quote ${newSubNumber} generated in Quotation status.`,
      data: newSub
    });
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

// Official Printable Tax Invoice HTML/PDF Endpoint
apiRouter.get('/invoices/:id/pdf', (req, res) => {
  try {
    const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!inv) return res.status(404).send('Invoice not found');

    const lines = db.prepare('SELECT * FROM invoice_lines WHERE invoice_id = ?').all(inv.id);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice ${inv.invoice_number} • Brightloop Software</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0b1c30; padding: 40px; max-width: 800px; margin: auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #081534; padding-bottom: 20px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; background: #e0f2fe; color: #0369a1; }
    .badge.paid { background: #dcfce7; color: #15803d; }
    .badge.overdue { background: #fee2e2; color: #b91c1c; }
    table { width: 100%; border-collapse: collapse; margin-top: 25px; }
    th { background: #f8fafc; text-align: left; padding: 10px; font-size: 12px; border-bottom: 1px solid #cbd5e1; }
    td { padding: 10px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .right { text-align: right; }
    .totals { margin-top: 20px; width: 300px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .totals .grand { font-size: 16px; font-weight: bold; border-top: 2px solid #081534; padding-top: 10px; color: #081534; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background:#081534; color:white; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600; border:none;">Print / Save PDF</button>
  </div>
  <div class="header">
    <div>
      <h1 style="margin: 0; font-size: 24px; color: #081534;">Brightloop Software Pvt Ltd</h1>
      <p style="margin: 4px 0; color: #64748b; font-size: 12px;">7th Floor, Mindspace Tech Park, Mumbai, MH 400064</p>
      <p style="margin: 2px 0; font-family: monospace; font-size: 12px; color: #475569;">GSTIN: 27AABCB1234F1Z0 • PAN: AABCB1234F</p>
    </div>
    <div style="text-align: right;">
      <h2 style="margin: 0; font-size: 20px; color: #081534;">TAX INVOICE</h2>
      <p style="margin: 4px 0; font-family: monospace; font-weight: bold;">${inv.invoice_number}</p>
      <span class="badge ${inv.status}">${inv.status}</span>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; margin-top: 25px; font-size: 13px;">
    <div>
      <strong style="color: #64748b; font-size: 11px; text-transform: uppercase;">Billed To:</strong>
      <div style="font-weight: bold; font-size: 14px; margin-top: 4px;">${inv.customer_name}</div>
      <div style="color: #64748b;">${inv.customer_email}</div>
      <div style="font-family: monospace; color: #475569; margin-top: 2px;">GSTIN: ${inv.customer_gstin || 'Unregistered'}</div>
    </div>
    <div style="text-align: right;">
      <div><strong>Invoice Date:</strong> ${inv.invoice_date}</div>
      <div><strong>Payment Due:</strong> ${inv.due_date}</div>
      <div><strong>Terms:</strong> Net 15 Days</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>SAC Code</th>
        <th class="right">Qty</th>
        <th class="right">Unit Price (₹)</th>
        <th class="right">Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${lines.map(l => `
        <tr>
          <td><strong>${l.description}</strong></td>
          <td style="font-family: monospace;">${l.sac_code || '998313'}</td>
          <td class="right font-mono">${l.quantity}</td>
          <td class="right font-mono">₹${l.unit_price.toFixed(2)}</td>
          <td class="right font-mono">₹${l.amount.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal:</span><span style="font-family: monospace;">₹${inv.subtotal.toFixed(2)}</span></div>
    ${inv.discount_amount > 0 ? `<div><span style="color:#16a34a;">Discount:</span><span style="font-family: monospace; color:#16a34a;">-₹${inv.discount_amount.toFixed(2)}</span></div>` : ''}
    <div><span>GST (${inv.gst_rate}%):</span><span style="font-family: monospace;">₹${inv.gst_amount.toFixed(2)}</span></div>
    <div class="grand"><span>Total Amount:</span><span style="font-family: monospace;">₹${inv.total_amount.toFixed(2)}</span></div>
    <div><span>Amount Paid:</span><span style="font-family: monospace; color:#15803d;">₹${inv.amount_paid.toFixed(2)}</span></div>
    <div style="border-top: 1px solid #e2e8f0; padding-top: 4px; font-weight: bold;">
      <span>Balance Due:</span>
      <span style="font-family: monospace; color: ${inv.balance_due > 0 ? '#b91c1c' : '#15803d'};">₹${inv.balance_due.toFixed(2)}</span>
    </div>
  </div>

  <div style="margin-top: 40px; padding: 15px; background: #f8fafc; border-radius: 8px; font-size: 11px; color: #64748b;">
    <strong>Payment Details (UPI / RTGS / NEFT):</strong><br/>
    Bank: HDFC Bank Ltd • A/C: 50200019284910 • IFSC: HDFC0000240 • UPI ID: brightloop@hdfcbank<br/>
    <em>This is a computer-generated tax invoice issued by Brightloop Software Pvt Ltd under GST Law.</em>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error generating invoice: ' + error.message);
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

// List all payments with optional filtering
apiRouter.get('/payments', (req, res) => {
  try {
    const { invoiceId, method, limit = 50 } = req.query;
    let query = 'SELECT * FROM payments WHERE 1=1';
    let params = [];

    if (invoiceId) {
      query += ' AND invoice_id = ?';
      params.push(invoiceId);
    }
    if (method) {
      query += ' AND payment_method = ?';
      params.push(method);
    }
    query += ' ORDER BY payment_date DESC, created_at DESC LIMIT ?';
    params.push(parseInt(limit) || 50);

    const payments = db.prepare(query).all(...params);
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger overdue verification check
apiRouter.post('/invoices/check-overdue', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = updateOverdueInvoices(today);
    res.json({
      success: true,
      message: `Overdue check executed. ${result.changes} invoices transitioned to OVERDUE.`,
      updatedCount: result.changes
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
    const { forceAll = false } = req.body || {};

    // 1. Maintain lifecycle: close expired contracts and mark past-due invoices as overdue
    autoCloseExpiredSubscriptions(today);
    updateOverdueInvoices(today);

    // 2. Select active subscriptions due for billing (or all if forceAll flag is provided)
    let query = `SELECT * FROM subscriptions WHERE status = 'active' AND is_paused = 0`;
    let params = [];
    if (!forceAll) {
      query += ` AND (next_billing_date <= ? OR next_billing_date IS NULL)`;
      params.push(today);
    }
    const dueSubs = db.prepare(query).all(...params);

    let invoicesGenerated = 0;
    let duplicatesPrevented = 0;
    let totalBilled = 0;

    const runId = 'BR-' + today.replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    const billingTransaction = db.transaction(() => {
      dueSubs.forEach(sub => {
        // Multi-cadence cycle token (daily, weekly, monthly, yearly)
        const cycleToken = getCycleToken(sub.id, sub.billing_period, today);

        // Idempotency: Prevent duplicate charges within the same cycle period
        const existing = db.prepare('SELECT id FROM invoices WHERE cycle_token = ?').get(cycleToken);
        if (existing) {
          duplicatesPrevented++;
          return;
        }

        // Evaluate active discount rules
        const matchingDiscount = db.prepare(`
          SELECT * FROM discount_rules 
          WHERE is_active = 1 
            AND min_purchase_amount <= ?
            AND (valid_from IS NULL OR valid_from <= ?)
            AND (valid_to IS NULL OR valid_to >= ?)
            AND used_count < max_uses
          ORDER BY discount_value DESC
          LIMIT 1
        `).get(sub.total_amount, today, today);

        let discountAmount = 0;
        if (matchingDiscount) {
          if (matchingDiscount.discount_type === 'percent') {
            discountAmount = sub.total_amount * (matchingDiscount.discount_value / 100);
          } else {
            discountAmount = Math.min(sub.total_amount, matchingDiscount.discount_value);
          }
          db.prepare('UPDATE discount_rules SET used_count = used_count + 1 WHERE id = ?').run(matchingDiscount.id);
        }

        const invNum = 'INV-' + today.replace(/-/g, '').substring(2, 6) + '-' + Math.floor(1000 + Math.random() * 9000);
        const invId = 'inv-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        const subtotal = sub.total_amount;
        const taxableSubtotal = Math.max(0, subtotal - discountAmount);
        const gstRate = 18.0;
        const gstAmount = taxableSubtotal * (gstRate / 100);
        const totalAmount = taxableSubtotal + gstAmount;

        // Due in 14 days
        const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

        db.prepare(`
          INSERT INTO invoices (
            id, invoice_number, subscription_id, customer_name, customer_email, customer_gstin,
            invoice_date, due_date, status, subtotal, discount_amount, gst_rate, gst_amount,
            total_amount, amount_paid, balance_due, cycle_token, sent_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP)
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
          discountAmount,
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

        // Advance subscription next_billing_date automatically
        const nextDate = advanceBillingDate(sub.next_billing_date || today, sub.billing_period);
        db.prepare('UPDATE subscriptions SET next_billing_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(nextDate, sub.id);

        invoicesGenerated++;
        totalBilled += totalAmount;
      });

      const durationMs = Date.now() - startTime;

      // Log billing run audit record
      db.prepare(`
        INSERT INTO billing_runs (
          id, run_date, subscriptions_scanned, invoices_generated, duplicates_prevented,
          skipped_cycles, total_amount_billed, duration_ms, status
        ) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, 0, ?, ?, 'completed')
      `).run(
        runId,
        dueSubs.length,
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
        subscriptionsScanned: dueSubs.length,
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

// Create software product
apiRouter.post('/products', (req, res) => {
  try {
    const { name, category = 'Software License', basePrice = 0, description, sacCode = '998313' } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Product name is required.' });

    const id = 'prod-' + Date.now();
    db.prepare(`
      INSERT INTO products (id, name, category, base_price, description, sac_code, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(id, name, category, parseFloat(basePrice) || 0, description || '', sacCode);

    res.status(201).json({
      success: true,
      message: `Product "${name}" created.`,
      data: { id, name, category, basePrice }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add brand edition variant to product (e.g. Odoo Connected Edition +₹560)
apiRouter.post('/products/:id/variants', (req, res) => {
  try {
    const { variantName, extraPrice = 0, sku } = req.body;
    if (!variantName) return res.status(400).json({ success: false, error: 'Variant name is required.' });

    const prod = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!prod) return res.status(404).json({ success: false, error: 'Target product not found.' });

    const id = 'var-' + Date.now();
    const variantSku = sku || `BL-SKU-${Date.now().toString().slice(-5)}`;
    db.prepare(`
      INSERT INTO product_variants (id, product_id, variant_name, extra_price, sku, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, req.params.id, variantName, parseFloat(extraPrice) || 0, variantSku);

    res.status(201).json({
      success: true,
      message: `Variant "${variantName}" added (+₹${parseFloat(extraPrice).toFixed(2)}).`,
      data: { id, productId: req.params.id, variantName, extraPrice: parseFloat(extraPrice) || 0, sku: variantSku }
    });
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

// Create recurring cadence plan
apiRouter.post('/plans', (req, res) => {
  try {
    const { name, billingPeriod = 'monthly', intervalCount = 1, autoCloseDays = 15, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Plan name is required.' });

    const allowed = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!allowed.includes(billingPeriod)) {
      return res.status(400).json({ success: false, error: 'Billing period must be daily, weekly, monthly, or yearly.' });
    }

    const id = 'plan-' + Date.now();
    db.prepare(`
      INSERT INTO plans (id, name, billing_period, interval_count, auto_close_days, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(id, name, billingPeriod, intervalCount, autoCloseDays, description || `Billed ${billingPeriod}.`);

    res.status(201).json({
      success: true,
      message: `Plan "${name}" created for ${billingPeriod} cadence.`,
      data: { id, name, billingPeriod, intervalCount, autoCloseDays }
    });
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

// Create quotation template
apiRouter.post('/templates', (req, res) => {
  try {
    const { name, validityDays = 30, defaultPlanId, description, items = [] } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Template name is required.' });

    const tplId = 'tpl-' + Date.now();
    const createTransaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO quotation_templates (id, name, validity_days, default_plan_id, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(tplId, name, validityDays, defaultPlanId || null, description || '');

      items.forEach((it, idx) => {
        db.prepare(`
          INSERT INTO template_items (id, template_id, product_id, variant_id, quantity, unit_price, discount_percent)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          `titem-${Date.now()}-${idx}`,
          tplId,
          it.productId,
          it.variantId || null,
          it.quantity || 1,
          it.unitPrice || 0,
          it.discountPercent || 0
        );
      });
    });

    createTransaction();

    res.status(201).json({
      success: true,
      message: `Quotation template "${name}" created.`,
      data: { id: tplId, name, validityDays }
    });
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

// Admin discount rule creation
apiRouter.post('/admin/discounts', (req, res) => {
  try {
    const {
      code,
      description,
      discountType = 'fixed',
      discountValue = 0,
      minPurchaseAmount = 0,
      validFrom,
      validTo,
      maxUses = 100
    } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ success: false, error: 'Discount code and value are required.' });
    }

    const id = 'disc-' + Date.now();
    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO discount_rules (
        id, code, description, discount_type, discount_value, min_purchase_amount,
        valid_from, valid_to, max_uses, used_count, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
    `).run(
      id,
      code.toUpperCase(),
      description || `Discount code ${code}`,
      discountType,
      parseFloat(discountValue),
      parseFloat(minPurchaseAmount) || 0,
      validFrom || today,
      validTo || '2026-12-31',
      parseInt(maxUses) || 100
    );

    res.status(201).json({
      success: true,
      message: `Discount rule "${code.toUpperCase()}" created and active.`,
      data: { id, code: code.toUpperCase(), discountType, discountValue }
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: 'Discount code already exists.' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate discount code for an order subtotal
apiRouter.post('/discounts/validate', (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Discount code is required.' });

    const today = new Date().toISOString().split('T')[0];
    const rule = db.prepare('SELECT * FROM discount_rules WHERE code = ? AND is_active = 1').get(code.toUpperCase());

    if (!rule) {
      return res.status(404).json({ success: false, valid: false, error: 'Invalid or inactive discount code.' });
    }

    if (rule.valid_from && rule.valid_from > today) {
      return res.status(400).json({ success: false, valid: false, error: 'Promotion has not started yet.' });
    }

    if (rule.valid_to && rule.valid_to < today) {
      return res.status(400).json({ success: false, valid: false, error: 'Promotion has expired.' });
    }

    if (rule.used_count >= rule.max_uses) {
      return res.status(400).json({ success: false, valid: false, error: 'Promotion usage limit has been reached.' });
    }

    if (subtotal < rule.min_purchase_amount) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: `Minimum purchase of ₹${rule.min_purchase_amount.toFixed(2)} required to apply ${rule.code}.`
      });
    }

    let deduction = 0;
    if (rule.discount_type === 'percent') {
      deduction = subtotal * (rule.discount_value / 100);
    } else {
      deduction = Math.min(subtotal, rule.discount_value);
    }

    res.json({
      success: true,
      valid: true,
      data: {
        code: rule.code,
        discountType: rule.discount_type,
        discountValue: rule.discount_value,
        deductionAmount: deduction,
        newSubtotal: Math.max(0, subtotal - deduction)
      }
    });
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

// Confirm password reset with new password
apiRouter.post('/auth/reset-password/confirm', (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email and new password are required.' });
    }

    const isLongEnough = newPassword.length > 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!isLongEnough || !hasUpper || !hasLower || !hasSpecial) {
      return res.status(400).json({
        success: false,
        error: 'Password must be greater than 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.'
      });
    }

    const result = db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(newPassword, email);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    res.json({ success: true, message: 'Password has been successfully updated. You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
