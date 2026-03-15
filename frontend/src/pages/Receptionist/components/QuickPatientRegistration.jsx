import React, { useRef } from 'react';
import { Phone, UserRound } from 'lucide-react';

function QuickPatientRegistration({ form, setForm, onSubmit, loading }) {
  const phoneRef = useRef(null);

  return (
    <section className="panel">
      <h3 className="panel-title">Quick Patient Registration</h3>
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="field-stack">
          <label className="field-label" htmlFor="quick-full-name">
            <UserRound size={14} />
            Full Name
          </label>
          <div className="input-wrap">
            <UserRound size={14} className="input-icon" />
            <input
              id="quick-full-name"
              autoFocus
              accessKey="n"
              placeholder="Full Name (Alt+N)"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') phoneRef.current?.focus();
              }}
            />
          </div>
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="quick-phone">
            <Phone size={14} />
            Phone
          </label>
          <div className="input-wrap">
            <Phone size={14} className="input-icon" />
            <input
              id="quick-phone"
              ref={phoneRef}
              accessKey="p"
              placeholder="Phone (Alt+P)"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="quick-gender">
            Gender
          </label>
          <select
            id="quick-gender"
            accessKey="g"
            value={form.gender}
            onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button accessKey="r" type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register (Alt+R)'}
        </button>
      </form>
    </section>
  );
}

export default QuickPatientRegistration;
