import React from 'react';
import { Clock3, UserRound } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';

const statusVariantMap = {
  waiting: 'warning',
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'danger',
};

const getPatientId = (item) => item?.patientId || item?.patient?._id || item?.id || item?._id;
const getPatientName = (item) => item?.patientName || item?.patient?.fullName || 'Patient';
const getReason = (item) => item?.reason || item?.appointmentReason || 'General consultation';
const getStatus = (item) => (item?.status || 'waiting').toLowerCase();
const getStartTime = (item) => item?.startTime || item?.appointmentTime || '--:--';

function PatientQueue({ queue = [], selectedPatientId, onSelect }) {
  return (
    <section className="app-card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Patient Waiting Queue</h2>
        <StatusBadge label={`${queue.length} in queue`} variant="info" />
      </div>

      {queue.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-medical-border bg-slate-50 p-6 text-center">
          <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <UserRound size={18} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">No patients waiting</p>
          <p className="mt-1 text-sm text-slate-500">Incoming appointments will appear here automatically.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {queue.map((item) => {
            const patientId = getPatientId(item);
            const patientName = getPatientName(item);
            const status = getStatus(item);
            const isSelected = selectedPatientId === patientId;

            return (
              <li key={item.id || item._id || patientId}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-primary/30 ${
                    isSelected ? 'border-blue-300 bg-blue-50' : 'border-medical-border bg-slate-50 hover:border-blue-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{patientName}</p>
                      <p className="mt-1 text-sm text-slate-500">{getReason(item)}</p>
                    </div>
                    <StatusBadge label={status} variant={statusVariantMap[status]} className="capitalize" />
                  </div>

                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    <Clock3 size={13} />
                    {getStartTime(item)}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default PatientQueue;
