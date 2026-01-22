import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CourseCalculator = () => {
  const [totalFee, setTotalFee] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [tenure, setTenure] = useState(6);
  const [admissionDate, setAdmissionDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Constants
  const tenureOptions = [2, 3, 4, 5, 6, 7, 8, 9];

  // EMI Date Logic based on admission date
  const getEMIDateInfo = (admissionDateStr) => {
    if (!admissionDateStr) return { emiDay: 7, firstEMIMonth: null };

    // Parse date string manually to avoid timezone issues
    const [year, month, day] = admissionDateStr.split('-').map(Number);
    const admission = new Date(year, month - 1, day); // month - 1 because JS months are 0-indexed
    const admissionDay = admission.getDate();

    // Determine EMI debit day based on admission date range
    let emiDay;
    if (admissionDay >= 1 && admissionDay <= 20) {
      emiDay = 7;
    } else if (admissionDay >= 21 && admissionDay <= 30) {
      emiDay = 15;
    } else {
      emiDay = 7; // default for 31st
    }

    // First EMI starts in next calendar month
    const firstEMI = new Date(year, month - 1, day); // start from admission date
    firstEMI.setMonth(firstEMI.getMonth() + 1);
    firstEMI.setDate(emiDay);

    return { emiDay, firstEMIMonth: firstEMI };
  };

  const emiDateInfo = getEMIDateInfo(admissionDate);

  // Shared date utilities to avoid timezone issues
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Calendar component
  const Calendar = ({ selectedDate, onSelect, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(() => {
      if (selectedDate) {
        const [y, m] = selectedDate.split('-').map(Number);
        return new Date(y, m - 1, 1);
      }
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const getDaysInMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handleDateSelect = (day) => {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const formattedDate = `${year}-${month}-${formattedDay}`;
      onSelect(formattedDate);
    };

    const handlePrevMonth = (e) => {
      e.stopPropagation();
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = (e) => {
      e.stopPropagation();
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    return (
      <div className="absolute bottom-full left-0 mb-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-4 min-w-[320px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
            </svg>
          </button>
          <h3 className="text-white font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs text-slate-500 font-semibold py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const isToday = day &&
              new Date().getDate() === day &&
              new Date().getMonth() === currentMonth.getMonth() &&
              new Date().getFullYear() === currentMonth.getFullYear();

            const isSelected = day && selectedDate === `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            return (
              <div key={i} className="aspect-square">
                {day && (
                  <button
                    onClick={() => handleDateSelect(day)}
                    className={`w-full h-full flex items-center justify-center text-sm rounded-lg transition-all ${isSelected
                        ? 'bg-orange-500 text-white font-bold'
                        : isToday
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'text-white hover:bg-slate-800'
                      }`}
                  >
                    {day}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Derived Values & Real-time Calculation
  const feeValue = Number(totalFee) || 0;
  const downPaymentValue = Number(downPayment) || 0;

  // Validation: Down Payment < Total Fee (only if both are non-zero/present)
  useEffect(() => {
    if (totalFee && downPayment) {
      if (downPaymentValue >= feeValue) {
        setError('Down payment must be less than the total course fee.');
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  }, [totalFee, downPayment, feeValue, downPaymentValue]);

  const isInvalid = downPaymentValue >= feeValue && totalFee !== '' && downPayment !== '';

  const loanAmount = isInvalid ? 0 : Math.max(0, feeValue - downPaymentValue);
  const emi = tenure > 0 ? loanAmount / tenure : 0;
  const totalAmount = emi * tenure;

  // Handle number input
  const handleNumberInput = (e, setter) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setter(value);
    }
  };

  const handleKeyDown = (e) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleReset = () => {
    setTotalFee('');
    setDownPayment('');
    setTenure(6);
    setAdmissionDate('');
    setShowCalendar(false);
    setError('');
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Set Theme Colors
    const primaryColor = [59, 130, 246]; // blue-500
    const accentColor = [249, 115, 22]; // orange-500

    // Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Course EMI Calculator', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Detailed Payment Roadmap & Loan Summary', pageWidth / 2, 28, { align: 'center' });

    // Loan Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Loan Summary', 14, 45);

    const loanSummaryData = [
      ['Total Course Fee', `INR ${feeValue.toLocaleString('en-IN')}`],
      ['Down Payment', `INR ${downPaymentValue.toLocaleString('en-IN')}`],
      ['Loan Amount', `INR ${loanAmount.toLocaleString('en-IN')}`],
      ['Loan Tenure', `${tenure} Months`],
      ['Monthly EMI', `INR ${Math.round(emi).toLocaleString('en-IN')}`],
      ['Total Payable', `INR ${totalAmount.toLocaleString('en-IN')}`]
    ];

    // Add admission date and EMI schedule info if available
    if (admissionDate) {
      loanSummaryData.push(
        ['Admission Date', formatDateLong(admissionDate)],
        ['EMI Debit Day', `${emiDateInfo.emiDay}th of every month`],
        ['First EMI Date', emiDateInfo.firstEMIMonth?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) || 'N/A']
      );
    }

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: loanSummaryData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    // Payment Schedule Section
    const scheduleStartY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Monthly Payment Schedule', 14, scheduleStartY);

    const scheduleData = Array.from({ length: tenure }).map((_, i) => {
      const date = new Date();
      if (emiDateInfo.firstEMIMonth) {
        date.setTime(emiDateInfo.firstEMIMonth.getTime());
        date.setMonth(date.getMonth() + i);
      } else {
        date.setMonth(date.getMonth() + i);
      }
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const emiDay = emiDateInfo.firstEMIMonth ? emiDateInfo.emiDay : date.getDate();
      const formattedDate = `${date.getDate()} ${monthName}`;
      return [i + 1, formattedDate, `INR ${Math.round(emi).toLocaleString('en-IN')}`, 'Scheduled'];
    });

    autoTable(doc, {
      startY: scheduleStartY + 5,
      head: [['#', 'Month', 'Installment Amount', 'Status']],
      body: scheduleData,
      theme: 'striped',
      headStyles: { fillColor: accentColor },
      styles: { fontSize: 9 }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Generated via Course Calculator - Zero Cost EMI Plan Applied.', 14, finalY);

    // Save PDF
    doc.save(`Course_EMI_Plan_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center p-4 lg:p-8 pt-16 md:pt-24 font-sans text-slate-100">
      {/* Background decoration: Deep Banking Gradients with Orange Hint */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-900/20 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative w-full max-w-7xl z-10 flex flex-col gap-8">
        {/* HEADER SECTION */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-500 tracking-tight drop-shadow-sm">
            Course EMI Calculator
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Calculate your monthly installments for course fees
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN: Input Form */}
          <div className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-2xl p-6 lg:p-8 h-fit">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Loan Details
              </h2>
              <p className="text-slate-400 text-sm mt-1.5 font-medium">Configure your education loan preferences.</p>
            </div>

            <div className="space-y-7">
              {/* Inline Row: Total Course Fee and Down Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Course Fee */}
                <div className="space-y-1.5">
                  <label htmlFor="totalFee" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Course Fee
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium group-focus-within:text-orange-400 transition-colors text-sm">₹</span>
                    <input
                      id="totalFee"
                      type="number"
                      value={totalFee}
                      onChange={(e) => handleNumberInput(e, setTotalFee)}
                      onKeyDown={handleKeyDown}
                      placeholder="60,000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 pl-8 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium no-spinner text-sm"
                    />
                  </div>
                </div>

                {/* Down Payment */}
                <div className="space-y-1.5">
                  <label htmlFor="downPayment" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Down Payment
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium group-focus-within:text-orange-400 transition-colors text-sm">₹</span>
                    <input
                      id="downPayment"
                      type="number"
                      value={downPayment}
                      onChange={(e) => handleNumberInput(e, setDownPayment)}
                      onKeyDown={handleKeyDown}
                      placeholder="10,000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 pl-8 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium no-spinner text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Inline Row: Admission Date and Loan Tenure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Admission Date */}
                <div className="space-y-1.5">
                  <label htmlFor="admissionDate" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Admission Date
                  </label>
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium text-sm flex items-center justify-between"
                    >
                      <span className={admissionDate ? 'text-white' : 'text-slate-600'}>
                        {admissionDate ? formatDateForDisplay(admissionDate) : 'Select date'}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                      </svg>
                    </button>
                    {showCalendar && (
                      <Calendar
                        selectedDate={admissionDate}
                        onSelect={(date) => {
                          setAdmissionDate(date);
                          setShowCalendar(false);
                        }}
                        onClose={() => setShowCalendar(false)}
                      />
                    )}
                  </div>
                </div>

                {/* Loan Tenure (Dropdown) */}
                <div className="space-y-1.5">
                  <label htmlFor="tenure" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Loan Tenure
                  </label>
                  <div className="relative">
                    <select
                      id="tenure"
                      value={tenure}
                      onChange={(e) => setTenure(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer font-medium text-sm"
                    >
                      {tenureOptions.map((m) => (
                        <option key={m} value={m}>{m} Months</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* EMI Date Info */}
              {admissionDate && (
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <p className="text-xs text-slate-400">
                    EMI will be debited on <span className="text-orange-400 font-bold">{emiDateInfo.emiDay}th</span> of every month
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    First EMI: {emiDateInfo.firstEMIMonth?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}

              {/* Validation Error Message */}
              {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-red-400 shrink-0" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                  </svg>
                  <span className="text-red-400 text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Reset Button */}
              <div className="pt-4">
                <button
                  onClick={handleReset}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-2.5 rounded-lg border border-slate-700 transition-all active:scale-95 transform duration-100 shadow-lg text-sm"
                >
                  Reset Calculator
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Results Display */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Top Cards Row */}
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Loan Amount Card */}
              <div className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl group hover:border-orange-500/50 transition-all">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-orange-400" viewBox="0 0 16 16">
                        <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
                        <path d="M0 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V6a2 2 0 0 1-2-2z" />
                      </svg>
                    </div>
                    <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Loan Amount</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ₹{loanAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Monthly EMI Card */}
              <div className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl group hover:border-emerald-500/50 transition-all">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-emerald-400" viewBox="0 0 16 16">
                        <path d="M4 11a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0v-1zm6-4a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0V7zM7 9a1 1 0 0 1 2 0v3a1 1 0 1 1-2 0V9z" />
                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                      </svg>
                    </div>
                    <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Monthly EMI</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ₹{Math.round(emi).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Schedule Section */}
            <div className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 flex flex-col shadow-2xl">
              <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-orange-500" viewBox="0 0 16 16">
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                </svg>
                Payment Schedule
              </h3>

              {/* Equation Box */}
              <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800 flex items-center justify-between gap-4 text-center mb-6">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Monthly Pay</span>
                  <span className="text-lg font-bold text-white">₹{Math.round(emi).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-slate-600 font-bold text-lg">×</div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Duration</span>
                  <span className="text-lg font-bold text-blue-400">{tenure} Month</span>
                </div>
                <div className="text-slate-600 font-bold text-lg">=</div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Amount</span>
                  <span className="text-lg font-bold text-orange-400">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* View Details Buttons */}
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full sm:w-auto group relative flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 font-bold py-3.5 px-6 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all active:scale-95 text-[11px] uppercase tracking-widest shadow-xl"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="group-hover:scale-110 transition-transform" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                  </svg>
                  View Details
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="w-full sm:w-auto group relative flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 font-bold py-3.5 px-6 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all active:scale-95 text-[11px] uppercase tracking-widest shadow-xl"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="group-hover:scale-110 transition-transform" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                  </svg>
                  Download PDF
                </button>
              </div>

              <div className="pt-4 mt-auto text-center sm:text-left flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="text-orange-500 mt-0.5 shrink-0" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
                </svg>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Specific <span className="font-semibold text-slate-400">Zero Cost EMI</span> plan applied. No processing fees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Payment Details</h3>
                <p className="text-slate-400 text-sm mt-1">Detailed month-wise installment breakdown</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* EMI Schedule Summary */}
              {admissionDate && (
                <div className="mb-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-orange-500" viewBox="0 0 16 16">
                      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                    </svg>
                    EMI Schedule Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs">Admission Date:</span>
                      <p className="text-white font-medium">{formatDateLong(admissionDate)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">EMI Debit Day:</span>
                      <p className="text-orange-400 font-medium">{emiDateInfo.emiDay}th of every month</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">First EMI:</span>
                      <p className="text-blue-400 font-medium">{emiDateInfo.firstEMIMonth?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: tenure }).map((_, i) => {
                  const date = new Date();
                  if (emiDateInfo.firstEMIMonth) {
                    date.setTime(emiDateInfo.firstEMIMonth.getTime());
                    date.setMonth(date.getMonth() + i);
                  } else {
                    date.setMonth(date.getMonth() + i);
                  }
                  const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                  const emiDay = emiDateInfo.firstEMIMonth ? emiDateInfo.emiDay : date.getDate();
                  const formattedDate = `${emiDay} ${date.toLocaleString('default', { month: 'short', year: 'numeric' })}`;
                  return (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-blue-500/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-400 border border-blue-500/20">
                          {i + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white tracking-wide">{formattedDate}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-medium">Scheduled Payment</span>
                        </div>
                      </div>
                      <span className="text-base font-bold text-emerald-400">
                        ₹{Math.round(emi).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Total Tenure: <span className="text-blue-400 font-bold">{tenure} Months</span>
              </div>
              <div className="text-sm font-bold text-white">
                Sum Total: <span className="text-orange-400">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCalculator;
