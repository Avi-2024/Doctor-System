import React from 'react';

function VitalsEntryPanel({ form, setForm, onSubmit, loading }) {
  return (
    <section>
      <h3>Vitals Entry</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          placeholder="Appointment ID"
          value={form.appointmentId}
          onChange={(e) => setForm((prev) => ({ ...prev, appointmentId: e.target.value }))}
        />
        <input
          placeholder="Temp (°C)"
          value={form.temperatureC}
          onChange={(e) => setForm((prev) => ({ ...prev, temperatureC: e.target.value }))}
        />
        <input
          placeholder="Pulse"
          value={form.pulseBpm}
          onChange={(e) => setForm((prev) => ({ ...prev, pulseBpm: e.target.value }))}
        />
        <input
          placeholder="BP Systolic"
          value={form.systolicBp}
          onChange={(e) => setForm((prev) => ({ ...prev, systolicBp: e.target.value }))}
        />
        <input
          placeholder="BP Diastolic"
          value={form.diastolicBp}
          onChange={(e) => setForm((prev) => ({ ...prev, diastolicBp: e.target.value }))}
        />
        <button accessKey="v" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Vitals (Alt+V)'}
        </button>
      </form>
    </section>
  );
}

export default VitalsEntryPanel;
