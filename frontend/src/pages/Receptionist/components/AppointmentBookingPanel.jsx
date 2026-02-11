import React from 'react';

function AppointmentBookingPanel({ form, setForm, onSubmit, loading }) {
  return (
    <section>
      <h3>Appointment Booking</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          accessKey="a"
          placeholder="Patient ID (Alt+A)"
          value={form.patientId}
          onChange={(e) => setForm((prev) => ({ ...prev, patientId: e.target.value }))}
        />
        <input
          placeholder="Doctor ID"
          value={form.doctorId}
          onChange={(e) => setForm((prev) => ({ ...prev, doctorId: e.target.value }))}
        />
        <input
          type="date"
          value={form.appointmentDate}
          onChange={(e) => setForm((prev) => ({ ...prev, appointmentDate: e.target.value }))}
        />
        <input
          placeholder="Start HH:MM"
          value={form.startTime}
          onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
        />
        <input
          placeholder="End HH:MM"
          value={form.endTime}
          onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
        />
        <button accessKey="b" type="submit" disabled={loading}>
          {loading ? 'Booking...' : 'Book (Alt+B)'}
        </button>
      </form>
    </section>
  );
}

export default AppointmentBookingPanel;
