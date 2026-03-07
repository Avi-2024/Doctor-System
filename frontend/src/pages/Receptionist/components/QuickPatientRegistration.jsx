import React, { useRef } from 'react';

function QuickPatientRegistration({ form, setForm, onSubmit, loading }) {
  const phoneRef = useRef(null);

  return (
    <section>
      <h3>Quick Patient Registration</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          autoFocus
          accessKey="n"
          placeholder="Full Name (Alt+N)"
          value={form.fullName}
          onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') phoneRef.current?.focus();
          }}
        />
        <input
          ref={phoneRef}
          accessKey="p"
          placeholder="Phone (Alt+P)"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />
        <select
          accessKey="g"
          value={form.gender}
          onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <button accessKey="r" type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register (Alt+R)'}
        </button>
      </form>
    </section>
  );
}

export default QuickPatientRegistration;
