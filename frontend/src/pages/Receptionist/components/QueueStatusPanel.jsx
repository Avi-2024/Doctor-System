import React from 'react';

function QueueStatusPanel({ appointmentId, setAppointmentId, onMarkWaiting, onMarkConsulted, loading }) {
  return (
    <section className="panel">
      <h3 className="panel-title">Queue Status</h3>
      <div className="field-stack">
        <label className="field-label" htmlFor="queue-appointment-id">
          Appointment ID
        </label>
        <input
          id="queue-appointment-id"
          placeholder="Appointment ID"
          value={appointmentId}
          onChange={(e) => setAppointmentId(e.target.value)}
        />
      </div>
      <div className="action-row">
        <button accessKey="w" type="button" onClick={onMarkWaiting} disabled={loading || !appointmentId}>
          Mark Waiting (Alt+W)
        </button>
        <button accessKey="c" type="button" className="btn-outline" onClick={onMarkConsulted} disabled={loading || !appointmentId}>
          Mark Consulted (Alt+C)
        </button>
      </div>
    </section>
  );
}

export default QueueStatusPanel;
