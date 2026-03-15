import React from 'react';
import { FileCheck2, Printer, ShieldCheck } from 'lucide-react';

function PrescriptionsPage() {
  return (
    <div className="space-y-6">
      <section className="app-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-medical-primary">Prescriptions</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Prescription Workspace</h1>
        <p className="mt-2 text-sm text-slate-500">Generate clear medication plans with safe dosage instructions and printable output.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="app-card p-5">
          <FileCheck2 className="text-medical-primary" size={18} />
          <h2 className="mt-3 text-base font-semibold text-slate-900">Template Library</h2>
          <p className="mt-2 text-sm text-slate-500">Use saved medicine templates for frequent diagnoses.</p>
        </article>
        <article className="app-card p-5">
          <ShieldCheck className="text-medical-primary" size={18} />
          <h2 className="mt-3 text-base font-semibold text-slate-900">Safety Checks</h2>
          <p className="mt-2 text-sm text-slate-500">Review interaction and dosage caution flags before submitting.</p>
        </article>
        <article className="app-card p-5">
          <Printer className="text-medical-primary" size={18} />
          <h2 className="mt-3 text-base font-semibold text-slate-900">Print & Share</h2>
          <p className="mt-2 text-sm text-slate-500">Export patient-ready prescriptions with clinic branding.</p>
        </article>
      </section>
    </div>
  );
}

export default PrescriptionsPage;
