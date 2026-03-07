import React from 'react';

function PatientQueue({ queue = [], selectedPatientId, onSelect }) {
  return (
    <section>
      <h3>Patient Queue</h3>
      {queue.length === 0 ? (
        <p>No patients in queue.</p>
      ) : (
        <ul>
          {queue.map((item) => (
            <li key={item.id || item._id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                style={{ fontWeight: selectedPatientId === (item.patientId || item.patient?._id) ? 'bold' : 'normal' }}
              >
                {item.patientName || item.patient?.fullName || 'Patient'} - {item.startTime || '--:--'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default PatientQueue;
