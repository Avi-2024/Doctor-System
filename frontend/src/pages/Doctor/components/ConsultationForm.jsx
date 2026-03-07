import React from 'react';

function ConsultationForm({ form, setForm, onAddMedicine, onRemoveMedicine, onToggleTest, onSaveVisit, onGeneratePdf, saving }) {
  const availableTests = ['CBC', 'LFT', 'KFT', 'Thyroid Profile', 'X-Ray Chest', 'ECG'];

  return (
    <section>
      <h3>Consultation</h3>

      <label>
        Diagnosis
        <textarea
          value={form.diagnosis}
          onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
          rows={4}
        />
      </label>

      <div>
        <h4>Medicines</h4>
        {form.medicines.map((medicine, idx) => (
          <div key={`${medicine.name}-${idx}`} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              placeholder="Medicine"
              value={medicine.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  medicines: prev.medicines.map((m, i) => (i === idx ? { ...m, name: e.target.value } : m)),
                }))
              }
            />
            <input
              placeholder="Dosage"
              value={medicine.dosage}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  medicines: prev.medicines.map((m, i) => (i === idx ? { ...m, dosage: e.target.value } : m)),
                }))
              }
            />
            <input
              placeholder="Frequency"
              value={medicine.frequency}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  medicines: prev.medicines.map((m, i) => (i === idx ? { ...m, frequency: e.target.value } : m)),
                }))
              }
            />
            <button type="button" onClick={() => onRemoveMedicine(idx)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={onAddMedicine}>
          Add Medicine
        </button>
      </div>

      <div>
        <h4>Select Tests</h4>
        {availableTests.map((test) => (
          <label key={test} style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={form.tests.includes(test)}
              onChange={() => onToggleTest(test)}
            />
            {test}
          </label>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button type="button" onClick={onSaveVisit} disabled={saving}>
          {saving ? 'Saving...' : 'Save Visit'}
        </button>
        <button type="button" onClick={onGeneratePdf}>
          Generate Prescription PDF
        </button>
      </div>
    </section>
  );
}

export default ConsultationForm;
