import React from 'react';
import { FileText, FlaskConical, Pill, Plus, Send, Trash2 } from 'lucide-react';

const availableTests = ['CBC', 'LFT', 'KFT', 'Thyroid', 'X-Ray Chest', 'ECG'];

function ConsultationForm({
  form,
  setForm,
  onAddMedicine,
  onRemoveMedicine,
  onToggleTest,
  onSaveVisit,
  onGeneratePdf,
  saving,
  selectedQueueItem,
}) {
  const selectedPatientName = selectedQueueItem?.patientName || selectedQueueItem?.patient?.fullName || 'No patient selected';

  return (
    <section className="app-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Consultation Form</h2>
          <p className="mt-1 text-sm text-slate-500">Patient: {selectedPatientName}</p>
        </div>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Live Draft</span>
      </div>

      <div className="mt-5">
        <label className="field-label" htmlFor="consultation-diagnosis">
          <FileText size={14} />
          Diagnosis
        </label>
        <textarea
          id="consultation-diagnosis"
          value={form.diagnosis}
          onChange={(event) => setForm((prev) => ({ ...prev, diagnosis: event.target.value }))}
          rows={4}
          placeholder="Enter diagnosis summary..."
        />
      </div>

      <div className="mt-5 space-y-3">
        <p className="field-label mb-0">
          <Pill size={14} />
          Medicines
        </p>

        {form.medicines.map((medicine, idx) => (
          <div key={`consult-medicine-${idx}`} className="rounded-2xl border border-medical-border bg-slate-50 p-3">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                placeholder="Medicine"
                value={medicine.name}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    medicines: prev.medicines.map((item, i) => (i === idx ? { ...item, name: event.target.value } : item)),
                  }))
                }
              />
              <input
                placeholder="Dosage"
                value={medicine.dosage}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    medicines: prev.medicines.map((item, i) => (i === idx ? { ...item, dosage: event.target.value } : item)),
                  }))
                }
              />
              <input
                placeholder="Frequency"
                value={medicine.frequency}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    medicines: prev.medicines.map((item, i) => (i === idx ? { ...item, frequency: event.target.value } : item)),
                  }))
                }
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button type="button" className="btn-danger" onClick={() => onRemoveMedicine(idx)} disabled={form.medicines.length === 1}>
                <Trash2 size={14} />
                Remove
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="btn-secondary" onClick={onAddMedicine}>
          <Plus size={15} />
          Add Medicine
        </button>
      </div>

      <div className="mt-5">
        <label className="field-label" htmlFor="consultation-notes">
          <FileText size={14} />
          Notes
        </label>
        <textarea
          id="consultation-notes"
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          rows={3}
          placeholder="Enter treatment notes and follow-up instructions..."
        />
      </div>

      <div className="mt-5">
        <p className="field-label mb-2">
          <FlaskConical size={14} />
          Suggested Tests
        </p>
        <div className="flex flex-wrap gap-2">
          {availableTests.map((test) => {
            const selected = form.tests.includes(test);
            return (
              <button
                key={test}
                type="button"
                onClick={() => onToggleTest(test)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-primary/30 ${
                  selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {test}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={onSaveVisit} disabled={saving}>
          <Send size={15} />
          {saving ? 'Submitting...' : 'Submit Prescription'}
        </button>
        <button type="button" className="btn-secondary" onClick={onGeneratePdf}>
          Generate PDF
        </button>
      </div>
    </section>
  );
}

export default ConsultationForm;
