import React from 'react';

function PatientHistory({ history = [] }) {
  return (
    <section>
      <h3>Patient History</h3>
      {history.length === 0 ? (
        <p>No previous visits found.</p>
      ) : (
        <ul>
          {history.map((visit) => (
            <li key={visit.id || visit._id}>
              <strong>{visit.date || visit.createdAt?.slice(0, 10)}</strong> - {visit.diagnosis || 'No diagnosis'}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default PatientHistory;
