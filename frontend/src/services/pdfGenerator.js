import { jsPDF } from 'jspdf';

export function generatePrescriptionPdf(visit) {
  const doc = new jsPDF();
  const margin = 20;
  const contentWidth = 170;
  let y = 25; // Start from top (clinic letterhead space already there)

  // ═══════════════════════════════════════════════════════════════
  // PATIENT DETAILS (Top section)
  // ═══════════════════════════════════════════════════════════════
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);

  const patientDate = new Date(visit.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Left side - Patient Name
  doc.text('Name:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(visit.patientName || 'N/A', margin + 20, y);

  // Right side - Date
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 150, y);
  doc.setFont('helvetica', 'normal');
  doc.text(patientDate, 165, y);
  y += 7;

  // Age
  doc.setFont('helvetica', 'bold');
  doc.text('Age:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(visit.patientAge ? `${visit.patientAge} years` : 'N/A', margin + 20, y);
  y += 10;

  // Divider line
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(margin, y, 190, y);
  y += 10;

  // ═══════════════════════════════════════════════════════════════
  // CHIEF COMPLAINTS / DIAGNOSIS
  // ═══════════════════════════════════════════════════════════════
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('C/C (Chief Complaints):', margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const diagLines = doc.splitTextToSize(visit.diagnosis || 'Not specified', contentWidth);
  doc.text(diagLines, margin, y);
  y += diagLines.length * 5 + 8;

  // ═══════════════════════════════════════════════════════════════
  // Rx - MEDICINES (Simple format)
  // ═══════════════════════════════════════════════════════════════
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Rx', margin, y);
  y += 8;

  if (visit.medicines?.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    visit.medicines.forEach((med, i) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      // Medicine number and name
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}.`, margin, y);
      doc.text(med.name || '-', margin + 5, y);
      y += 5;

      // Dosage and frequency on next line
      doc.setFont('helvetica', 'normal');
      doc.text(`   ${med.dosage || '-'}  -  ${med.frequency || '-'}`, margin + 5, y);
      y += 7;
    });

    y += 3;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('No medicines prescribed.', margin + 5, y);
    y += 8;
  }

  // ═══════════════════════════════════════════════════════════════
  // INVESTIGATIONS / TESTS
  // ═══════════════════════════════════════════════════════════════
  
  if (visit.tests?.length > 0) {
    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Investigations:', margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const testsText = visit.tests.join(', ');
    const testLines = doc.splitTextToSize(testsText, contentWidth);
    doc.text(testLines, margin, y);
    y += testLines.length * 5 + 8;
  }

  // ═══════════════════════════════════════════════════════════════
  // ADVICE / INSTRUCTIONS
  // ═══════════════════════════════════════════════════════════════
  
  if (visit.notes) {
    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Advice:', margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(visit.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 5;
  }

  // Save PDF
  const fileName = `prescription-${visit.patientName?.replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`;
  doc.save(fileName);
}
