import React from 'react';
import { Activity, Thermometer } from 'lucide-react';

function VitalsEntryPanel({ form, setForm, onSubmit, loading }) {
  return (
    <section className="panel">
      <h3 className="panel-title">Vitals Entry</h3>
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="field-stack">
          <label className="field-label" htmlFor="vitals-appointment-id">
            Appointment ID
          </label>
          <input
            id="vitals-appointment-id"
            placeholder="Appointment ID"
            value={form.appointmentId}
            onChange={(e) => setForm((prev) => ({ ...prev, appointmentId: e.target.value }))}
          />
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="vitals-temp">
            <Thermometer size={14} />
            Temperature
          </label>
          <input
            id="vitals-temp"
            placeholder="Temp (C)"
            value={form.temperatureC}
            onChange={(e) => setForm((prev) => ({ ...prev, temperatureC: e.target.value }))}
          />
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="vitals-pulse">
            <Activity size={14} />
            Pulse
          </label>
          <input
            id="vitals-pulse"
            placeholder="Pulse"
            value={form.pulseBpm}
            onChange={(e) => setForm((prev) => ({ ...prev, pulseBpm: e.target.value }))}
          />
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="vitals-systolic">
            BP Systolic
          </label>
          <input
            id="vitals-systolic"
            placeholder="BP Systolic"
            value={form.systolicBp}
            onChange={(e) => setForm((prev) => ({ ...prev, systolicBp: e.target.value }))}
          />
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="vitals-diastolic">
            BP Diastolic
          </label>
          <input
            id="vitals-diastolic"
            placeholder="BP Diastolic"
            value={form.diastolicBp}
            onChange={(e) => setForm((prev) => ({ ...prev, diastolicBp: e.target.value }))}
          />
        </div>
        <button accessKey="v" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Vitals (Alt+V)'}
        </button>
      </form>
    </section>
  );
}

export default VitalsEntryPanel;
