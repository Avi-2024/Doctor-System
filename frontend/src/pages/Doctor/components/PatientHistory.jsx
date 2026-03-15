import React from 'react';
import { ClipboardCheck } from 'lucide-react';

const formatVisitDate = (value) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function PatientHistory({ history = [] }) {
  return (
    <section className="app-card p-6">
      <h2 className="text-lg font-semibold text-slate-900">Recent Patient History</h2>

      {history.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-medical-border bg-slate-50 p-4 text-sm text-slate-500">
          No previous visits found for this patient.
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {history.map((visit) => (
            <li key={visit.id || visit._id} className="rounded-2xl border border-medical-border bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <ClipboardCheck size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{formatVisitDate(visit.date || visit.createdAt)}</p>
                  <p className="mt-1 text-sm text-slate-500">{visit.diagnosis || 'No diagnosis added.'}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default PatientHistory;
