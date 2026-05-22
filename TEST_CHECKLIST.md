# 🧪 Quick Test Checklist - Doctor System Offline Mode

## ✅ Pre-Test Setup
```bash
cd frontend
npm run dev
```
Open: `http://localhost:5173`

---

## 🎯 Test Flow (5 Minutes)

### Step 1: Login ✅
- [ ] Open browser
- [ ] Select role: **DOCTOR**
- [ ] Click "Sign In (Demo)"
- [ ] Dashboard dikhna chahiye

### Step 2: Check Dashboard ✅
- [ ] "Total Patients" stat dikhna chahiye (3 demo patients)
- [ ] "Waiting Queue" stat dikhna chahiye (0 initially)
- [ ] "Quick Actions" section dikhna chahiye
- [ ] Sidebar mein menu items dikhne chahiye

### Step 3: Add New Patient ✅
- [ ] Sidebar → "Patients" click
- [ ] "Add Patient" button click
- [ ] Form bharo:
  ```
  Name: Rajesh Kumar
  Age: 45
  Contact: 9876543210
  Address: Delhi (optional)
  ```
- [ ] "Save & Queue Mein Add Karein" click
- [ ] ✅ Success message: "Rajesh Kumar ko waiting queue mein add kar diya gaya"
- [ ] Patient table mein dikhna chahiye

### Step 4: Add Existing Patient to Queue ✅
- [ ] Demo patient "Aarav Sharma" dhundo
- [ ] "Add to Queue" button click
- [ ] ✅ Success message dikhna chahiye

### Step 5: Check Queue ✅
- [ ] Sidebar → "Consultation" click
- [ ] Left side "Patient Waiting Queue" mein 2 patients dikhne chahiye:
  - Rajesh Kumar
  - Aarav Sharma

### Step 6: Write Prescription ✅
- [ ] "Rajesh Kumar" select karo (click on card)
- [ ] Right side form bharo:
  ```
  Diagnosis: Seasonal flu with high fever
  
  Medicine 1:
    Name: Paracetamol
    Dosage: 500mg
    Frequency: 3 times daily
  
  Medicine 2: (click "Add Medicine")
    Name: Cetirizine
    Dosage: 10mg
    Frequency: Once at night
  
  Tests: CBC, X-Ray Chest (click to select)
  
  Notes: Rest for 3 days. Drink warm water. Follow up after 3 days.
  ```
- [ ] "Submit Prescription" button click
- [ ] ✅ Form submit hona chahiye (no error)

### Step 7: Generate PDF ✅
- [ ] "Generate PDF" button click
- [ ] ✅ PDF download hona chahiye: `prescription-[id].pdf`
- [ ] PDF open karo aur check karo:
  - [ ] Patient name: Rajesh Kumar
  - [ ] Diagnosis dikhna chahiye
  - [ ] 2 medicines with dosage dikhni chahiye
  - [ ] Tests: CBC, X-Ray Chest dikhna chahiye
  - [ ] Notes dikhne chahiye

### Step 8: Check Appointments ✅
- [ ] Sidebar → "Appointments" click
- [ ] Rajesh Kumar ka appointment dikhna chahiye
- [ ] Status: "completed" hona chahiye
- [ ] Calendar mein today's date pe "1 appt" dikhna chahiye

### Step 9: Check Dashboard Again ✅
- [ ] Sidebar → "Dashboard" click
- [ ] "Waiting Queue" count update hona chahiye (1 remaining - Aarav Sharma)
- [ ] Queue list mein Aarav Sharma dikhna chahiye

### Step 10: Second Prescription ✅
- [ ] Sidebar → "Consultation" click
- [ ] "Aarav Sharma" select karo
- [ ] Quick prescription likho:
  ```
  Diagnosis: Routine checkup - All normal
  Medicine: Vitamin D3, 60000 IU, Once weekly
  Notes: Continue healthy diet
  ```
- [ ] Submit → Generate PDF
- [ ] ✅ Second PDF download hona chahiye

---

## 🎉 Success Criteria

Agar yeh sab kaam kar gaya to **FULL OFFLINE MODE WORKING** hai:

✅ Patient add ho raha hai  
✅ Queue mein automatically add ho raha hai  
✅ Consultation form kaam kar raha hai  
✅ Prescription submit ho raha hai  
✅ PDF generate ho raha hai  
✅ Dashboard stats update ho rahe hain  
✅ Appointments list update ho rahi hai  
✅ Search/filter kaam kar raha hai  

---

## 🐛 Troubleshooting

### PDF download nahi ho raha?
- Browser console check karo (F12)
- Download folder permissions check karo
- Pop-up blocker disable karo

### Patient queue mein nahi dikh raha?
- Browser refresh karo
- localStorage check karo: F12 → Application → Local Storage → `ds_appointments`

### Data gayab ho gaya?
- Browser localStorage clear ho gaya hoga
- Demo data phir se seed hoga on refresh

---

## 📊 Expected Results

### localStorage Data:
```javascript
// Check in browser console:
localStorage.getItem('ds_patients')    // Should have 4+ patients
localStorage.getItem('ds_appointments') // Should have appointments
localStorage.getItem('ds_visits')       // Should have 2 visits
```

### File Downloads:
```
Downloads/
  ├── prescription-local-[timestamp1]-[id].pdf
  └── prescription-local-[timestamp2]-[id].pdf
```

---

## 🚀 Next Steps

Agar sab kaam kar gaya to:
1. ✅ Multiple patients add karke test karo
2. ✅ Different medicines try karo
3. ✅ Search functionality test karo
4. ✅ Different roles (CLINIC_OWNER) try karo
5. ✅ Browser refresh karke data persistence check karo

---

**Test Time: ~5 minutes**  
**Expected Result: 100% Offline Functionality Working** ✅
