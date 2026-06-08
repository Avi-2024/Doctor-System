import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { receptionistApi } from '../../services/receptionistApi';
import QuickPatientRegistration from './components/QuickPatientRegistration';
import AppointmentBookingPanel from './components/AppointmentBookingPanel';
import VitalsEntryPanel from './components/VitalsEntryPanel';
import QueueStatusPanel from './components/QueueStatusPanel';
import PaymentEntryPanel from './components/PaymentEntryPanel';

function ReceptionistDashboardPage() {
  const { accessToken, activeClinicId } = useAuth();

  const [registerLoading, setRegisterLoading] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [flash, setFlash] = useState('');

  const [registrationForm, setRegistrationForm] = useState({ fullName: '', phone: '', gender: 'male' });
  const [bookingForm, setBookingForm] = useState({ patientId: '', doctorId: '', appointmentDate: '', startTime: '', endTime: '' });
  const [vitalsForm, setVitalsForm] = useState({ appointmentId: '', temperatureC: '', pulseBpm: '', systolicBp: '', diastolicBp: '' });
  const [statusAppointmentId, setStatusAppointmentId] = useState('');
  const [paymentForm, setPaymentForm] = useState({ billingId: '', amount: '', mode: 'cash' });

  const withFlash = async (cb) => {
    try {
      setFlash('');
      await cb();
      setFlash('Saved successfully');
    } catch (error) {
      setFlash(error.message || 'Action failed');
    }
  };

  const quickRegister = () =>
    withFlash(async () => {
      setRegisterLoading(true);
      await receptionistApi.quickRegisterPatient({ clinicId: activeClinicId, token: accessToken, payload: registrationForm });
      setRegistrationForm({ fullName: '', phone: '', gender: 'male' });
      setRegisterLoading(false);
    });

  const quickBook = () =>
    withFlash(async () => {
      setBookLoading(true);
      await receptionistApi.quickBookAppointment({ clinicId: activeClinicId, token: accessToken, payload: bookingForm });
      setBookLoading(false);
    });

  const saveVitals = () =>
    withFlash(async () => {
      setVitalsLoading(true);
      await receptionistApi.saveVitals({
        clinicId: activeClinicId,
        token: accessToken,
        payload: {
          appointmentId: vitalsForm.appointmentId,
          vitals: {
            temperatureC: Number(vitalsForm.temperatureC),
            pulseBpm: Number(vitalsForm.pulseBpm),
            systolicBp: Number(vitalsForm.systolicBp),
            diastolicBp: Number(vitalsForm.diastolicBp),
          },
        },
      });
      setVitalsLoading(false);
    });

  const markStatus = (status) =>
    withFlash(async () => {
      setQueueLoading(true);
      await receptionistApi.updateAppointmentStatus({
        clinicId: activeClinicId,
        token: accessToken,
        appointmentId: statusAppointmentId,
        status,
      });
      setQueueLoading(false);
    });

  const savePayment = () =>
    withFlash(async () => {
      setPaymentLoading(true);
      await receptionistApi.enterPayment({
        clinicId: activeClinicId,
        token: accessToken,
        billingId: paymentForm.billingId,
        payload: {
          amount: Number(paymentForm.amount),
          mode: paymentForm.mode,
        },
      });
      setPaymentLoading(false);
    });

  return (
    <div onKeyDown={(e) => {
      if (e.altKey && e.key.toLowerCase() === 'r') quickRegister();
      if (e.altKey && e.key.toLowerCase() === 'b') quickBook();
      if (e.altKey && e.key.toLowerCase() === 'v') saveVitals();
      if (e.altKey && e.key.toLowerCase() === 'w') markStatus('waiting');
      if (e.altKey && e.key.toLowerCase() === 'c') markStatus('completed');
      if (e.altKey && e.key.toLowerCase() === 'm') savePayment();
    }}>
      <h2>Receptionist Fast Desk</h2>
      <p>Minimal clicks. Keyboard shortcuts: Alt+R/B/V/W/C/M</p>
      {flash && <p>{flash}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <QuickPatientRegistration form={registrationForm} setForm={setRegistrationForm} onSubmit={quickRegister} loading={registerLoading} />
        <AppointmentBookingPanel form={bookingForm} setForm={setBookingForm} onSubmit={quickBook} loading={bookLoading} />
        <VitalsEntryPanel form={vitalsForm} setForm={setVitalsForm} onSubmit={saveVitals} loading={vitalsLoading} />
        <QueueStatusPanel
          appointmentId={statusAppointmentId}
          setAppointmentId={setStatusAppointmentId}
          onMarkWaiting={() => markStatus('waiting')}
          onMarkConsulted={() => markStatus('completed')}
          loading={queueLoading}
        />
        <PaymentEntryPanel form={paymentForm} setForm={setPaymentForm} onSubmit={savePayment} loading={paymentLoading} />
      </div>
    </div>
  );
}

export default ReceptionistDashboardPage;
