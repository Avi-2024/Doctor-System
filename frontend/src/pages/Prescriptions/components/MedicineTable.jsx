import React from 'react';
import { Trash2 } from 'lucide-react';

/**
 * MedicineTable Component
 * 
 * Dynamic medicine table for prescriptions.
 * - Direct editing (no edit icons)
 * - Add/remove rows
 * - Professional medical layout
 * - Minimal borders
 * 
 * Columns:
 * - # (number)
 * - Medicine Name
 * - Dosage
 * - Frequency
 * - Duration
 * - Remarks
 */
function MedicineTable({ medicines, onUpdate, onRemove }) {
  return (
    <div className="medicine-table-wrapper">
      <table className="medicine-table">
        <thead>
          <tr>
            <th className="col-number">#</th>
            <th className="col-medicine">Medicine Name</th>
            <th className="col-dosage">Dosage</th>
            <th className="col-frequency">Frequency</th>
            <th className="col-duration">Duration</th>
            <th className="col-remarks">Remarks</th>
            <th className="col-action no-print">Action</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((medicine, index) => (
            <tr key={medicine.id}>
              <td className="medicine-number">{index + 1}</td>
              <td>
                <input
                  type="text"
                  className="medicine-input"
                  placeholder="Medicine name"
                  value={medicine.name}
                  onChange={(e) => onUpdate(medicine.id, 'name', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="medicine-input"
                  placeholder="500mg"
                  value={medicine.dosage}
                  onChange={(e) => onUpdate(medicine.id, 'dosage', e.target.value)}
                />
              </td>
              <td>
                <select
                  className="medicine-select"
                  value={medicine.frequency}
                  onChange={(e) => onUpdate(medicine.id, 'frequency', e.target.value)}
                >
                  <option value="">Select frequency</option>
                  <option value="1-0-1">1-0-1 (Morning & Evening)</option>
                  <option value="1-1-1">1-1-1 (Morning, Afternoon & Evening)</option>
                  <option value="0-0-1">0-0-1 (Evening Only)</option>
                  <option value="1-0-0">1-0-0 (Morning Only)</option>
                  <option value="0-1-0">0-1-0 (Afternoon Only)</option>
                  <option value="1-1-0">1-1-0 (Morning & Afternoon)</option>
                  <option value="0-1-1">0-1-1 (Afternoon & Evening)</option>
                  <option value="2-0-0">2-0-0 (Twice Morning)</option>
                  <option value="0-0-2">0-0-2 (Twice Evening)</option>
                  <option value="1-0-1-0-1">1-0-1-0-1 (Every 12 hours)</option>
                  <option value="OD">OD (Once Daily)</option>
                  <option value="BD">BD (Twice Daily)</option>
                  <option value="TDS">TDS (Thrice Daily)</option>
                  <option value="QID">QID (Four Times Daily)</option>
                  <option value="SOS">SOS (As Needed)</option>
                </select>
              </td>
              <td>
                <input
                  type="text"
                  className="medicine-input"
                  placeholder="7 days"
                  value={medicine.duration}
                  onChange={(e) => onUpdate(medicine.id, 'duration', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="medicine-input"
                  placeholder="After food"
                  value={medicine.remarks}
                  onChange={(e) => onUpdate(medicine.id, 'remarks', e.target.value)}
                />
              </td>
              <td className="no-print action-cell">
                {medicines.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-medicine"
                    onClick={() => onRemove(medicine.id)}
                    title="Remove medicine"
                    aria-label="Delete this medicine"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MedicineTable;
