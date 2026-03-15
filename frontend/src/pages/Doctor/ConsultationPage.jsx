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
    notes: '',
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
      .then((res) => {
        const queueItems = res.appointments || res.queue || [];
        setQueue(queueItems);
        if (queueItems.length > 0) {
          setSelectedQueueItem((prev) => prev || queueItems[0]);
        }
      })
      .catch((err) => setError(err.message));
  }, [activeClinicId, accessToken]);

  useEffect(() => {
    if (!selectedPatientId || !activeClinicId || !accessToken) return;

    doctorApi
      .getPatientHistory({ clinicId: activeClinicId, patientId: selectedPatientId, token: accessToken })
      .then((res) => setHistory(res.history || res.visits || []))
      .catch((err) => setError(err.message));
  }, [selectedPatientId, activeClinicId, accessToken]);

  useEffect(() => {
    setSavedVisitId(null);
  }, [selectedPatientId]);

  const onAddMedicine = () => {
    setForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '' }],
    }));
  };

  const onRemoveMedicine = (index) => {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.length === 1 ? prev.medicines : prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const onToggleTest = (test) => {
    setForm((prev) => ({
      ...prev,
      tests: prev.tests.includes(test) ? prev.tests.filter((item) => item !== test) : [...prev.tests, test],
    }));
  };

  const onSaveVisit = async () => {
    try {
      if (!selectedQueueItem) {
        setError('Select a patient from queue first.');
        return;
      }

      setSaving(true);
      setError('');

      const payload = {
        patientId: selectedPatientId,
        patientName: selectedQueueItem?.patientName || selectedQueueItem?.patient?.fullName || 'Patient',
        patientAge: selectedQueueItem?.patientAge || null,
        appointmentId: selectedQueueItem.id || selectedQueueItem._id,
        diagnosis: form.diagnosis,
        notes: form.notes,
        tests: form.tests,
        medicines: form.medicines.filter((medicine) => medicine.name.trim()),
      };

      const response = await doctorApi.saveVisit({ clinicId: activeClinicId, token: accessToken, payload });
      const visitId = response.visit?.id || response.visit?._id;
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
        setError('Submit prescription before generating PDF.');
        return;
      }

      const response = await doctorApi.generatePrescriptionPdf({ clinicId: activeClinicId, visitId: savedVisitId, token: accessToken });
      if (response.pdfUrl) {
        window.open(response.pdfUrl, '_blank', 'noopener,noreferrer');
      }
      // offline mode mein PDF directly download ho jata hai
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="app-card p-6">
        <h1 className="page-title">Consultation</h1>
        <p className="page-subtitle">Review waiting patients and issue prescriptions from a single clinical workflow.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <PatientQueue queue={queue} selectedPatientId={selectedPatientId} onSelect={setSelectedQueueItem} />
          <PatientHistory history={history} />
        </div>

        <div className="space-y-6">
          <ConsultationForm
            form={form}
            setForm={setForm}
            onAddMedicine={onAddMedicine}
            onRemoveMedicine={onRemoveMedicine}
            onToggleTest={onToggleTest}
            onSaveVisit={onSaveVisit}
            onGeneratePdf={onGeneratePdf}
            saving={saving}
            selectedQueueItem={selectedQueueItem}
          />

          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        </div>
      </section>
    </div>
  );
}

export default ConsultationPage;
