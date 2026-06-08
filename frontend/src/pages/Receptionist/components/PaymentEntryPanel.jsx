import React from 'react';

import { CircleDollarSign, ReceiptText } from 'lucide-react';

function PaymentEntryPanel({ form, setForm, onSubmit, loading }) {
  return (
    <section className="panel">
      <h3 className="panel-title">Payment Entry</h3>
      <form
        className="form-grid"



        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >

        <div className="field-stack">
          <label className="field-label" htmlFor="payment-billing-id">
            <ReceiptText size={14} />
            Billing ID
          </label>
          <div className="input-wrap">
            <ReceiptText size={14} className="input-icon" />
            <input
              id="payment-billing-id"
              placeholder="Billing ID"
              value={form.billingId}
              onChange={(e) => setForm((prev) => ({ ...prev, billingId: e.target.value }))}
            />
          </div>
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="payment-amount">
            <CircleDollarSign size={14} />
            Amount
          </label>
          <div className="input-wrap">
            <CircleDollarSign size={14} className="input-icon" />
            <input
              id="payment-amount"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            />
          </div>
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="payment-mode">
            Payment Mode
          </label>
          <select
            id="payment-mode"
            value={form.mode}
            onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>

        <button accessKey="m" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Payment (Alt+M)'}
        </button>
      </form>
    </section>
  );
}

export default PaymentEntryPanel;
