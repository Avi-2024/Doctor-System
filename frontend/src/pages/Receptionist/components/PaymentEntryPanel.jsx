import React from 'react';

function PaymentEntryPanel({ form, setForm, onSubmit, loading }) {
  return (
    <section>
      <h3>Payment Entry</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          placeholder="Billing ID"
          value={form.billingId}
          onChange={(e) => setForm((prev) => ({ ...prev, billingId: e.target.value }))}
        />
        <input
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
        />
        <select
          value={form.mode}
          onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))}
        >
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
        <button accessKey="m" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Payment (Alt+M)'}
        </button>
      </form>
    </section>
  );
}

export default PaymentEntryPanel;
