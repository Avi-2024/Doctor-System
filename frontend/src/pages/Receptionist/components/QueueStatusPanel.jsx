import React from 'react';

function QueueStatusPanel({ appointmentId, setAppointmentId, onMarkWaiting, onMarkConsulted, loading }) {
  return (
    <section>
      <h3>Queue Status</h3>
      <input
        placeholder="Appointment ID"
        value={appointmentId}
        onChange={(e) => setAppointmentId(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button accessKey="w" type="button" onClick={onMarkWaiting} disabled={loading || !appointmentId}>
          Mark Waiting (Alt+W)
        </button>
        <button accessKey="c" type="button" onClick={onMarkConsulted} disabled={loading || !appointmentId}>
          Mark Consulted (Alt+C)
        </button>
      </div>
    </section>
  );
}

export default QueueStatusPanel;
