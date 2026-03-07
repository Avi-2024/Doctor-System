import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doctorApi } from '../../services/doctorApi';
import PatientQueue from './components/PatientQueue';
import PatientHistory from './components/PatientHistory';
import ConsultationForm from './components/ConsultationForm';

function ConsultationPage() {
  const { accessToken, activeClinicId } = useAuth();
  const [queue, setQueue] = useState([]);
  const [selectedQueueItem, setSelectedQueueItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedVisitId, setSavedVisitId] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    diagnosis: '',
    medicines: [{ name: '', dosage: '', frequency: '' }],
    tests: [],
  });

  const selectedPatientId = useMemo(
    () => selectedQueueItem?.patientId || selectedQueueItem?.patient?._id || null,
    [selectedQueueItem]
  );

  useEffect(() => {
    if (!activeClinicId || !accessToken) return;

    doctorApi
      .getPatientQueue({ clinicId: activeClinicId, token: accessToken })
      .then((res) => setQueue(res.appointments || res.queue || []))
      .catch((err) => setError(err.message));
  }, [activeClinicId, accessToken]);

  useEffect(() => {
    if (!selectedPatientId || !activeClinicId || !accessToken) return;

    doctorApi
      .getPatientHistory({ clinicId: activeClinicId, patientId: selectedPatientId, token: accessToken })
      .then((res) => setHistory(res.history || res.visits || []))
      .catch((err) => setError(err.message));
  }, [selectedPatientId, activeClinicId, accessToken]);

  const onAddMedicine = () => {
    setForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '' }],
    }));
  };

  const onRemoveMedicine = (index) => {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const onToggleTest = (test) => {
    setForm((prev) => ({
      ...prev,
      tests: prev.tests.includes(test) ? prev.tests.filter((t) => t !== test) : [...prev.tests, test],
    }));
  };

  const onSaveVisit = async () => {
    try {
      if (!selectedQueueItem) {
        setError('Select a patient from queue first');
        return;
      }

      setSaving(true);
      setError('');

      const payload = {
        patientId: selectedPatientId,
        appointmentId: selectedQueueItem.id || selectedQueueItem._id,
        diagnosis: form.diagnosis,
        tests: form.tests,
        medicines: form.medicines.filter((m) => m.name),
      };

      const res = await doctorApi.saveVisit({ clinicId: activeClinicId, token: accessToken, payload });
      const visitId = res.visit?.id || res.visit?._id;
      setSavedVisitId(visitId || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onGeneratePdf = async () => {
    try {
      if (!savedVisitId) {
        setError('Save visit before generating prescription PDF');
        return;
      }

      const res = await doctorApi.generatePrescriptionPdf({ clinicId: activeClinicId, visitId: savedVisitId, token: accessToken });
      if (res.pdfUrl) {
        window.open(res.pdfUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div>
        <PatientQueue queue={queue} selectedPatientId={selectedPatientId} onSelect={setSelectedQueueItem} />
        <PatientHistory history={history} />
      </div>

      <ConsultationForm
        form={form}
        setForm={setForm}
        onAddMedicine={onAddMedicine}
        onRemoveMedicine={onRemoveMedicine}
        onToggleTest={onToggleTest}
        onSaveVisit={onSaveVisit}
        onGeneratePdf={onGeneratePdf}
        saving={saving}
      />

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}

export default ConsultationPage;
