(function() {
"use strict";

var STORAGE_KEY = "mwgRosterData_v1";

var TYPE_LABELS = {
  addition:           "Addition",
  subtraction:        "Subtraction",
  multiplication:     "Multiplication",
  division:           "Division",
  fractions:          "Fractions",
  decimals:           "Decimals",
  rounding:           "Rounding",
  longdivision:       "Long Division",
  orderofoperations:  "Order of Operations",
  integers:           "Integers & Negatives",
  exponents:          "Exponents & Sq. Roots",
  scientificnotation: "Scientific Notation",
  mixed:              "Mixed"
};

var GRADE_TYPES = {
  1: ["addition","subtraction","multiplication","division","mixed"],
  2: ["addition","subtraction","multiplication","division","mixed"],
  3: ["addition","subtraction","multiplication","division","mixed"],
  4: ["addition","subtraction","multiplication","division","fractions","decimals","rounding","longdivision","mixed"],
  5: ["addition","subtraction","multiplication","division","fractions","decimals","rounding","longdivision","orderofoperations","mixed"],
  6: ["addition","subtraction","multiplication","division","fractions","decimals","rounding","longdivision","orderofoperations","mixed"],
  7: ["addition","subtraction","multiplication","division","fractions","decimals","rounding","longdivision","orderofoperations","integers","mixed"],
  8: ["addition","subtraction","multiplication","division","fractions","decimals","rounding","longdivision","orderofoperations","integers","exponents","scientificnotation","mixed"]
};

var GRADE_REFERENCE = {
  "Grades 1-3": "Addition, subtraction, multiplication, division",
  "Grades 4-6": "+ Fractions, decimals, rounding, long division, order of operations",
  "Grade 7":    "+ Integers & negative numbers",
  "Grade 8":    "+ Exponents & square roots, scientific notation"
};

var VALID_COUNTS = [30, 40, 50, 60];
var inputMode = "standard";
var entryIdCounter = 0;

var form, studentsContainer, studentCounter, standardSection,
    advancedSection, advancedBox, modeIndicator, toggleModeBtn,
    addStudentBtn, genCodeBtn, saveBtn, clearCurrentBtn, clearSavedBtn,
    generateBtn, fillDownBtn, worksheetsPerStudent, answerKeyToggle,
    resultsDiv, statusDiv, errorsDiv, codeModal, closeModal,
    codeOutput, copyCodeBtn, useCodeBtn, referenceGrid;

function injectStyles() {
  if (document.getElementById("mwg-injected-styles")) return;
  var rules = [
    "[id=mwg-app]{font-family:Georgia,serif;max-width:1100px;margin:0 auto;color:rgb(26,26,26)}",
    "[id=mwg-app] *,[id=mwg-app] *::before,[id=mwg-app] *::after{box-sizing:border-box}",
    ".mwg-button-row{margin-top:0;margin-bottom:12px;display:flex;gap:10px;flex-wrap:nowrap;align-items:center;overflow-x:auto;padding-bottom:2px;justify-content:center}",
    ".mwg-primary-actions{margin-top:12px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center}",
    ".mwg-settings-row{display:flex;gap:14px;flex-wrap:wrap;align-items:end;justify-content:space-between;margin:10px 0 8px 0}",
    ".mwg-settings-left{display:flex;gap:14px;flex-wrap:wrap;align-items:end}",
    ".mwg-setting-group{min-width:210px;max-width:260px;flex:0 1 260px}",
    ".mwg-setting-group label,.mwg-student-grid label,.mwg-advanced-input-wrap label,.mwg-level-reference-card label{display:block;font-weight:bold;margin-bottom:4px;font-size:14px}",
    ".mwg-setting-group select,.mwg-student-grid input,.mwg-student-grid select,.mwg-advanced-input-wrap textarea{width:100%;padding:8px;font-size:14px;font-family:Georgia,serif}",
    ".mwg-student-counter{font-size:14px;font-weight:bold;color:rgb(68,68,68);margin:6px 0 10px 0}",
    ".mwg-mode-pill{display:inline-block;padding:6px 10px;border-radius:999px;background:rgb(238,243,255);border:1px solid rgb(199,214,255);font-size:13px;font-weight:bold;flex:0 0 auto;white-space:nowrap}",
    ".mwg-student-entry{border:1px solid rgb(204,204,204);padding:12px;margin-bottom:12px;border-radius:8px;background:rgb(249,249,249)}",
    ".mwg-student-entry-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}",
    ".mwg-student-entry h3{margin:0;font-size:18px}",
    ".mwg-student-entry-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}",
    ".mwg-duplicate-link,.mwg-delete-link{font-size:13px;color:rgb(6,69,173);text-decoration:underline;cursor:pointer;background:none;border:none;padding:0;line-height:1.2;font-family:Georgia,serif}",
    ".mwg-duplicate-link:hover,.mwg-delete-link:hover{color:rgb(4,47,107)}",
    ".mwg-student-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:10px;align-items:end}",
    ".mwg-mixed-types{display:none;margin-top:8px;padding:10px 12px;border:1px solid rgb(199,214,255);border-radius:6px;background:rgb(238,243,255);grid-column:1/-1}",
    ".mwg-mixed-types.visible{display:block}",
    ".mwg-mixed-types-label{font-size:13px;font-weight:bold;margin-bottom:8px;color:rgb(51,51,51)}",
    ".mwg-mixed-types-grid{display:flex;flex-wrap:wrap;gap:6px 16px}",
    ".mwg-mixed-types-grid label{font-size:13px;font-weight:normal!important;display:flex;align-items:center;gap:5px;cursor:pointer;margin-bottom:0!important}",
    ".mwg-mixed-types-grid input[type=checkbox]{width:auto;padding:0;margin:0;cursor:pointer}",
    ".mwg-answer-key-row{display:flex;align-items:center;gap:10px;margin:8px 0 4px 0;font-size:14px}",
    ".mwg-answer-key-row input[type=checkbox]{width:16px;height:16px;cursor:pointer}",
    ".mwg-advanced-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,1fr);gap:14px;align-items:start}",
    ".mwg-advanced-input-wrap,.mwg-level-reference-card{border:1px solid rgb(204,204,204);padding:12px;margin-bottom:12px;border-radius:8px;background:rgb(249,249,249)}",
    ".mwg-advanced-input-wrap textarea{min-height:180px;resize:vertical}",
    ".mwg-advanced-help{font-size:13px;color:rgb(68,68,68);margin-top:8px;line-height:1.4}",
    ".mwg-reference-title{font-size:15px;font-weight:bold;margin-bottom:10px}",
    ".mwg-reference-grid{font-size:13px;line-height:1.6}",
    ".mwg-reference-grade{margin-bottom:6px}",
    ".mwg-reference-grade strong{display:inline-block;min-width:70px}",
    ".mwg-fill-down-row{display:flex;justify-content:flex-end;margin-bottom:6px}",
    ".mwg-btn-small{padding:7px 12px;font-size:14px;cursor:pointer;flex:0 0 auto;white-space:nowrap;font-family:Georgia,serif}",
    ".mwg-btn-large{padding:12px 20px;font-size:17px;font-weight:bold;cursor:pointer;font-family:Georgia,serif}",
    ".mwg-error-box{border:1px solid rgb(221,51,51);background:rgb(255,243,243);color:rgb(153,0,0);padding:10px 12px;border-radius:8px;margin-top:12px;white-space:pre-line}",
    ".mwg-notice-box{border:1px solid rgb(214,170,0);background:rgb(255,248,219);color:rgb(107,86,0);padding:10px 12px;border-radius:8px;margin-top:12px;white-space:pre-line}",
    ".mwg-success-box{border:1px solid rgb(60,154,73);background:rgb(238,251,240);color:rgb(35,101,45);padding:10px 12px;border-radius:8px;margin-top:12px;white-space:pre-line}",
    ".mwg-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:none;align-items:center;justify-content:center;z-index:9999;padding:20px}",
    ".mwg-modal-overlay.active{display:flex}",
    ".mwg-modal-box{width:min(760px,100%);max-height:85vh;background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.25);overflow:hidden;display:flex;flex-direction:column}",
    ".mwg-modal-header{padding:14px 16px;border-bottom:1px solid rgb(221,221,221);display:flex;justify-content:space-between;align-items:center;gap:12px}",
    ".mwg-modal-title{font-size:18px;font-weight:bold}",
    ".mwg-modal-close{border:1px solid rgb(187,187,187);background:rgb(245,245,245);border-radius:6px;padding:6px 10px;cursor:pointer;font-size:14px;font-family:Georgia,serif}",
    ".mwg-modal-body{padding:16px;overflow-y:auto}",
    ".mwg-modal-body textarea{width:100%;min-height:260px;resize:vertical;font-family:Georgia,serif;font-size:14px;padding:10px}",
    ".mwg-modal-help{margin-top:10px;font-size:13px;color:rgb(68,68,68);line-height:1.4}",
    ".mwg-modal-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}",
    ".mwg-results{margin-top:30px}"
  ];
  var style = document.createElement("style");
  style.id = "mwg-injected-styles";
  style.textContent = rules.join(" ");
  document.head.appendChild(style);
}

function assignDomRefs() {
  form                 = document.getElementById("mwgForm");
  studentsContainer    = document.getElementById("mwgStudentsContainer");
  studentCounter       = document.getElementById("mwgStudentCounter");
  standardSection      = document.getElementById("mwgStandardSection");
  advancedSection      = document.getElementById("mwgAdvancedSection");
  advancedBox          = document.getElementById("mwgAdvancedBox");
  modeIndicator        = document.getElementById("mwgModeIndicator");
  toggleModeBtn        = document.getElementById("mwgToggleModeBtn");
  addStudentBtn        = document.getElementById("mwgAddStudentBtn");
  genCodeBtn           = document.getElementById("mwgGenCodeBtn");
  saveBtn              = document.getElementById("mwgSaveBtn");
  clearCurrentBtn      = document.getElementById("mwgClearCurrentBtn");
  clearSavedBtn        = document.getElementById("mwgClearSavedBtn");
  generateBtn          = document.getElementById("mwgGenerateBtn");
  fillDownBtn          = document.getElementById("mwgFillDownBtn");
  worksheetsPerStudent = document.getElementById("mwgWorksheetsPerStudent");
  answerKeyToggle      = document.getElementById("mwgAnswerKeyToggle");
  resultsDiv           = document.getElementById("mwgResults");
  statusDiv            = document.getElementById("mwgStatus");
  errorsDiv            = document.getElementById("mwgErrors");
  codeModal            = document.getElementById("mwgCodeModal");
  closeModal           = document.getElementById("mwgCloseModal");
  codeOutput           = document.getElementById("mwgCodeOutput");
  copyCodeBtn          = document.getElementById("mwgCopyCodeBtn");
  useCodeBtn           = document.getElementById("mwgUseCodeBtn");
  referenceGrid        = document.getElementById("mwgReferenceGrid");
}

function esc(text) {
  return String(text)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
    .replace(/'/g,"\u0027");
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clearStatus() { statusDiv.innerHTML = ""; }
function clearErrors()  { errorsDiv.innerHTML = ""; }

function showSuccess(m) {
  statusDiv.innerHTML = '<div class="mwg-success-box">' + esc(m) + '</div>';
}
function showNotice(m) {
  statusDiv.innerHTML = '<div class="mwg-notice-box">' + esc(m) + '</div>';
}
function showErrors(list) {
  if (!list.length) { errorsDiv.innerHTML = ""; return; }
  errorsDiv.innerHTML = '<div class="mwg-error-box">Some entries were skipped:\n\n' + list.map(esc).join("\n") + '</div>';
}

function renderReference() {
  var html = "";
  var keys = Object.keys(GRADE_REFERENCE);
  for (var i = 0; i < keys.length; i++) {
    html += '<div class="mwg-reference-grade"><strong>' + esc(keys[i]) + ':</strong> ' + esc(GRADE_REFERENCE[keys[i]]) + '</div>';
  }
  referenceGrid.innerHTML = html;
}

function getTypeOptions(grade, selected) {
  var types = GRADE_TYPES[grade] || GRADE_TYPES[1];
  var html = '<option value="">Select Type</option>';
  for (var i = 0; i < types.length; i++) {
    var t = types[i];
    var sel = t === selected ? "selected" : "";
    html += '<option value="' + t + '" ' + sel + '>' + esc(TYPE_LABELS[t]) + '</option>';
  }
  return html;
}

function getGradeOptions(selected) {
  var html = '<option value="">Grade</option>';
  for (var g = 1; g <= 8; g++) {
    var sel = String(g) === String(selected) ? "selected" : "";
    html += '<option value="' + g + '" ' + sel + '>Grade ' + g + '</option>';
  }
  return html;
}

function getCountOptions(selected) {
  var html = '<option value="">Count</option>';
  for (var i = 0; i < VALID_COUNTS.length; i++) {
    var c = VALID_COUNTS[i];
    var sel = String(c) === String(selected) ? "selected" : "";
    html += '<option value="' + c + '" ' + sel + '>' + c + ' problems</option>';
  }
  return html;
}

function getMixedTypesForGrade(grade) {
  var types = GRADE_TYPES[grade] || GRADE_TYPES[1];
  var result = [];
  for (var i = 0; i < types.length; i++) {
    if (types[i] !== "mixed") result.push(types[i]);
  }
  return result;
}

function renderMixedCheckboxes(containerEl, grade, checkedTypes) {
  var box = containerEl.querySelector(".mwg-mixed-types");
  if (!box) return;
  var types = getMixedTypesForGrade(grade);
  var checked = checkedTypes || types;
  var html = '<div class="mwg-mixed-types-label">Include in Mixed:</div><div class="mwg-mixed-types-grid">';
  for (var i = 0; i < types.length; i++) {
    var t = types[i];
    var isChecked = checked.indexOf(t) !== -1 ? "checked" : "";
    html += '<label><input type="checkbox" class="mwg-mixed-cb" value="' + t + '" ' + isChecked + '> ' + esc(TYPE_LABELS[t]) + '</label>';
  }
  html += '</div>';
  box.innerHTML = html;
}

function updateMixedVisibility(entryDiv) {
  var typeSelect = entryDiv.querySelector('[name="problemType"]');
  var gradeSelect = entryDiv.querySelector('[name="grade"]');
  var mixedBox = entryDiv.querySelector(".mwg-mixed-types");
  if (!typeSelect || !mixedBox) return;
  var isMixed = typeSelect.value === "mixed";
  var grade = parseInt(gradeSelect.value) || 1;
  if (isMixed) {
    mixedBox.className = "mwg-mixed-types visible";
    renderMixedCheckboxes(entryDiv, grade);
  } else {
    mixedBox.className = "mwg-mixed-types";
  }
}

function updateTypeOptionsForGrade(entryDiv, keepType) {
  var gradeSelect = entryDiv.querySelector('[name="grade"]');
  var typeSelect  = entryDiv.querySelector('[name="problemType"]');
  if (!gradeSelect || !typeSelect) return;
  var grade = parseInt(gradeSelect.value) || 1;
  var currentType = keepType !== undefined ? keepType : typeSelect.value;
  var types = GRADE_TYPES[grade] || GRADE_TYPES[1];
  var validType = types.indexOf(currentType) !== -1 ? currentType : "";
  typeSelect.innerHTML = getTypeOptions(grade, validType);
  updateMixedVisibility(entryDiv);
}

function readEntry(div) {
  var mixedCbs = div.querySelectorAll(".mwg-mixed-cb:checked");
  var mixedTypes = null;
  if (mixedCbs.length) {
    mixedTypes = [];
    for (var i = 0; i < mixedCbs.length; i++) mixedTypes.push(mixedCbs[i].value);
  }
  return {
    name:       div.querySelector('[name="studentName"]').value.trim(),
    number:     div.querySelector('[name="studentNumber"]').value.trim(),
    grade:      div.querySelector('[name="grade"]').value,
    type:       div.querySelector('[name="problemType"]').value,
    count:      div.querySelector('[name="count"]').value,
    mixedTypes: mixedTypes
  };
}

function createStudentEntry(index, data) {
  data = data || {};
  var name   = data.name   || "";
  var number = data.number || "";
  var grade  = data.grade  || "";
  var type   = data.type   || "";
  var count  = data.count  || "";
  var mixedTypes = data.mixedTypes || null;

  var div = document.createElement("div");
  div.className = "mwg-student-entry";
  div.setAttribute("data-entry-id", ++entryIdCounter);

  div.innerHTML =
    '<div class="mwg-student-entry-header">' +
      '<h3>Student ' + index + '</h3>' +
      '<div class="mwg-student-entry-actions">' +
        '<button type="button" class="mwg-duplicate-link">Duplicate student</button>' +
        '<button type="button" class="mwg-delete-link">Delete student</button>' +
      '</div>' +
    '</div>' +
    '<div class="mwg-student-grid">' +
      '<div><label>Student Name</label><input type="text" name="studentName" value="' + esc(name) + '" /></div>' +
      '<div><label>Student Number</label><input type="text" name="studentNumber" value="' + esc(number) + '" /></div>' +
      '<div><label>Grade Level</label><select name="grade">' + getGradeOptions(grade) + '</select></div>' +
      '<div><label>Problem Type</label><select name="problemType">' + getTypeOptions(parseInt(grade)||1, type) + '</select></div>' +
      '<div><label>Problem Count</label><select name="count">' + getCountOptions(count) + '</select></div>' +
      '<div class="mwg-mixed-types"></div>' +
    '</div>';

  var gradeSelect = div.querySelector('[name="grade"]');
  var typeSelect  = div.querySelector('[name="problemType"]');

  gradeSelect.addEventListener("change", function() { updateTypeOptionsForGrade(div); });
  typeSelect.addEventListener("change",  function() { updateMixedVisibility(div); });

  if (type === "mixed" && mixedTypes) {
    updateMixedVisibility(div);
    setTimeout(function() { renderMixedCheckboxes(div, parseInt(grade)||1, mixedTypes); }, 0);
  } else {
    updateMixedVisibility(div);
  }

  div.querySelector(".mwg-delete-link").addEventListener("click", function() {
    div.parentNode.removeChild(div);
    if (!studentsContainer.querySelector(".mwg-student-entry")) buildDefaultStudents();
    else refreshNumbers();
    clearStatus();
  });

  div.querySelector(".mwg-duplicate-link").addEventListener("click", function() {
    var dupData = readEntry(div);
    var newNum = dupData.number;
    if (!isNaN(newNum) && newNum !== "") newNum = String(parseInt(newNum) + 1);
    dupData.number = newNum;
    var newEntry = createStudentEntry(studentsContainer.querySelectorAll(".mwg-student-entry").length + 1, dupData);
    div.parentNode.insertBefore(newEntry, div.nextSibling);
    refreshNumbers();
    clearStatus();
  });

  return div;
}

function refreshNumbers() {
  var entries = studentsContainer.querySelectorAll(".mwg-student-entry");
  for (var i = 0; i < entries.length; i++) {
    entries[i].querySelector("h3").textContent = "Student " + (i + 1);
  }
  updateCounter();
}

function updateCounter() {
  var n = studentsContainer.querySelectorAll(".mwg-student-entry").length;
  studentCounter.textContent = "Students: " + n;
}

function addStudent(data) {
  var n = studentsContainer.querySelectorAll(".mwg-student-entry").length + 1;
  studentsContainer.appendChild(createStudentEntry(n, data));
  updateCounter();
}

function buildDefaultStudents() {
  studentsContainer.innerHTML = "";
  for (var i = 1; i <= 3; i++) studentsContainer.appendChild(createStudentEntry(i));
  updateCounter();
}

function setInputMode(mode) {
  inputMode = mode === "advanced" ? "advanced" : "standard";
  if (inputMode === "advanced") {
    standardSection.style.display = "none";
    advancedSection.style.display = "block";
    modeIndicator.textContent = "Advanced Input";
    toggleModeBtn.textContent = "Back to Standard Input";
    addStudentBtn.style.display = "none";
    genCodeBtn.style.display = "none";
    fillDownBtn.style.display = "none";
  } else {
    standardSection.style.display = "block";
    advancedSection.style.display = "none";
    modeIndicator.textContent = "Standard Input";
    toggleModeBtn.textContent = "Advanced Input";
    addStudentBtn.style.display = "inline-block";
    genCodeBtn.style.display = "inline-block";
    fillDownBtn.style.display = "inline-block";
  }
}

function collectRoster() {
  var entries = studentsContainer.querySelectorAll(".mwg-student-entry");
  var result = [];
  for (var i = 0; i < entries.length; i++) result.push(readEntry(entries[i]));
  return result;
}

function saveRoster() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      inputMode: inputMode,
      worksheetsPerStudent: worksheetsPerStudent.value,
      answerKey: answerKeyToggle.checked,
      advancedInput: advancedBox.value,
      students: collectRoster()
    }));
    clearErrors();
    showSuccess("Roster saved.");
  } catch(e) { showNotice("Unable to save roster in this browser."); }
}

function loadRoster() {
  var raw;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch(e) { buildDefaultStudents(); return; }
  if (!raw) { buildDefaultStudents(); return; }
  try {
    var saved = JSON.parse(raw);
    applyRoster(saved.students || []);
    advancedBox.value = saved.advancedInput || "";
    worksheetsPerStudent.value = saved.worksheetsPerStudent || "1";
    answerKeyToggle.checked = saved.answerKey || false;
    setInputMode(saved.inputMode || "standard");
    showSuccess("Saved roster loaded.");
  } catch(e) { buildDefaultStudents(); }
}

function applyRoster(students) {
  studentsContainer.innerHTML = "";
  if (!students || !students.length) { buildDefaultStudents(); return; }
  for (var i = 0; i < students.length; i++) {
    studentsContainer.appendChild(createStudentEntry(i + 1, students[i]));
  }
  refreshNumbers();
}

function clearCurrentRoster() {
  if (!window.confirm("Clear the current roster?")) return;
  setInputMode("standard");
  studentsContainer.innerHTML = "";
  buildDefaultStudents();
  advancedBox.value = "";
  resultsDiv.innerHTML = "";
  clearErrors();
  showSuccess("Current roster cleared.");
}

function clearSavedRoster() {
  if (!window.confirm("Clear the saved roster?")) return;
  try { localStorage.removeItem(STORAGE_KEY); showSuccess("Saved roster cleared."); }
  catch(e) { showNotice("Unable to clear saved roster."); }
}

function buildAdvancedCode() {
  var roster = collectRoster();
  var lines = [];
  for (var i = 0; i < roster.length; i++) {
    var s = roster[i];
    if (!s.name || !s.grade || !s.type || !s.count) continue;
    var type = s.type;
    if (type === "mixed" && s.mixedTypes && s.mixedTypes.length) {
      type = "mixed[" + s.mixedTypes.join("|") + "]";
    }
    lines.push([s.name, s.number || "", type, s.count, s.grade].join(", ") + ";");
  }
  return lines.join("\n");
}

function openCodeModal() {
  var code = buildAdvancedCode();
  if (!code.trim()) { showNotice("Add at least one complete student before generating code."); return; }
  codeOutput.value = code;
  codeModal.className = "mwg-modal-overlay active";
}

function parseAdvancedInput() {
  var raw = advancedBox.value.trim();
  var students = [], errors = [];
  if (!raw) return { students: students, errors: errors };
  var normalized = raw.replace(/\n+/g, ";");
  var chunks = normalized.split(";");
  for (var i = 0; i < chunks.length; i++) {
    var entry = chunks[i].trim();
    if (!entry) continue;
    var parts = entry.split(",");
    for (var p = 0; p < parts.length; p++) parts[p] = parts[p].trim();
    if (parts.length !== 5) { errors.push("Entry " + (i+1) + " needs 5 fields: " + entry); continue; }
    var name = parts[0], number = parts[1], typeRaw = parts[2], countStr = parts[3], gradeStr = parts[4];
    if (!name) { errors.push("Entry " + (i+1) + " missing name."); continue; }
    var grade = parseInt(gradeStr);
    if (isNaN(grade) || grade < 1 || grade > 8) { errors.push("Entry " + (i+1) + " invalid grade (1-8): " + entry); continue; }
    var count = parseInt(countStr);
    if (VALID_COUNTS.indexOf(count) === -1) { errors.push("Entry " + (i+1) + " invalid count (30/40/50/60): " + entry); continue; }
    var type = typeRaw;
    var mixedTypes = null;
    var mixedMatch = typeRaw.match(/^mixed\[([^\]]+)\]$/);
    if (mixedMatch) {
      type = "mixed";
      mixedTypes = mixedMatch[1].split("|");
      for (var m = 0; m < mixedTypes.length; m++) mixedTypes[m] = mixedTypes[m].trim();
    }
    var validTypes = GRADE_TYPES[grade] || [];
    if (validTypes.indexOf(type) === -1) { errors.push("Entry " + (i+1) + " invalid type for grade " + grade + ": " + type); continue; }
    students.push({ name: name, number: number, grade: grade, type: type, count: count, mixedTypes: mixedTypes });
  }
  return { students: students, errors: errors };
}

function getStudentsFromStandard() {
  var students = [];
  var entries = studentsContainer.querySelectorAll(".mwg-student-entry");
  for (var i = 0; i < entries.length; i++) {
    var d = readEntry(entries[i]);
    if (!d.name && !d.grade && !d.type && !d.count) continue;
    if (!d.name || !d.grade || !d.type || !d.count) continue;
    students.push({ name: d.name, number: d.number, grade: parseInt(d.grade), type: d.type, count: parseInt(d.count), mixedTypes: d.mixedTypes });
  }
  return { students: students, errors: [] };
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function fractionStr(n, d) {
  var g = gcd(Math.abs(n), Math.abs(d));
  return (n/g) + "/" + (d/g);
}

function fracHtml(n, d) {
  return '<span class="mwg-fraction"><span class="mwg-fraction-num">' + n + '</span><span class="mwg-fraction-den">' + d + '</span></span>';
}

function stackHtml(op, a, b) {
  return '<div class="mwg-problem-cell"><div>' +
    '<div class="mwg-problem-stack">' +
      '<span class="mwg-problem-top">' + a + '</span>' +
      '<div class="mwg-problem-bottom-line">' +
        '<span class="mwg-problem-operator">' + op + '</span>' +
        '<span class="mwg-problem-bottom">' + b + '</span>' +
      '</div>' +
    '</div>' +
    '<span class="mwg-answer-blank"></span>' +
  '</div></div>';
}

function divisionHtml(divisor, dividend) {
  return '<div class="mwg-problem-cell"><div>' +
    '<div class="mwg-division-problem">' +
      '<span class="mwg-division-divisor">' + divisor + '</span>' +
      '<div class="mwg-division-bracket">' +
        '<span class="mwg-division-dividend">' + dividend + '</span>' +
      '</div>' +
    '</div>' +
    '<span class="mwg-answer-blank"></span>' +
  '</div></div>';
}

function horizHtml(expr) { return "__HORIZ__" + expr; }

function makeAddition(grade) {
  var max = grade <= 2 ? 20 : grade <= 4 ? 100 : 1000;
  var a = rand(0, Math.floor(max * 0.6));
  var b = rand(0, max - a);
  return { html: stackHtml("+", a, b), answer: a + b };
}

function makeSubtraction(grade) {
  var max = grade <= 2 ? 20 : grade <= 4 ? 100 : 1000;
  var a = rand(1, max);
  var b = rand(0, a);
  return { html: stackHtml("\u2212", a, b), answer: a - b };
}

function makeMultiplication(grade) {
  var maxF = grade <= 2 ? 5 : grade <= 4 ? 9 : 12;
  var a = rand(0, maxF);
  var b = rand(0, maxF);
  return { html: stackHtml("\u00d7", a, b), answer: a * b };
}

function makeDivision(grade) {
  var maxD = grade <= 2 ? 5 : grade <= 4 ? 9 : 12;
  var divisor  = rand(1, maxD);
  var quotient = rand(0, 10);
  return { html: divisionHtml(divisor, divisor * quotient), answer: quotient };
}

function makeLongDivision(grade) {
  var divisor  = rand(2, grade <= 5 ? 9 : 12);
  var quotient = rand(10, grade <= 5 ? 99 : 999);
  return { html: divisionHtml(divisor, divisor * quotient), answer: quotient };
}

function makeRounding(grade) {
  var places = [10, 100];
  if (grade >= 5) places.push(1000);
  var place = randFrom(places);
  var max = grade <= 4 ? 999 : 9999;
  var n = rand(1, max);
  var label = place === 10 ? "tens" : place === 100 ? "hundreds" : "thousands";
  return { html: horizHtml("Round " + n + " to nearest " + label), answer: Math.round(n / place) * place };
}

function makeFractions(grade) {
  var d = rand(2, 9);
  var a = rand(1, d - 1);
  var b = rand(1, d - 1);
  var ops = grade <= 5 ? ["+", "\u2212"] : ["+", "\u2212", "\u00d7"];
  var op = randFrom(ops);
  if (op === "+") {
    return { html: horizHtml(fracHtml(a,d) + " + " + fracHtml(b,d) + " ="), answer: fractionStr(a+b, d) };
  } else if (op === "\u2212") {
    if (a < b) { var t = a; a = b; b = t; }
    return { html: horizHtml(fracHtml(a,d) + " \u2212 " + fracHtml(b,d) + " ="), answer: fractionStr(a-b, d) };
  } else {
    return { html: horizHtml(fracHtml(a,d) + " \u00d7 " + fracHtml(b,d) + " ="), answer: fractionStr(a*b, d*d) };
  }
}

function makeDecimals(grade) {
  var places = grade <= 5 ? 1 : 2;
  var factor = Math.pow(10, places);
  var a = (rand(1, 99 * factor)) / factor;
  var b = (rand(1, 99 * factor)) / factor;
  var op = randFrom(["+", "\u2212"]);
  if (op === "+") {
    return { html: horizHtml(a + " + " + b + " ="), answer: +(a + b).toFixed(places) };
  } else {
    var hi = Math.max(a,b), lo = Math.min(a,b);
    return { html: horizHtml(hi + " \u2212 " + lo + " ="), answer: +(hi - lo).toFixed(places) };
  }
}

function makeOrderOfOps(grade) {
  var a = rand(1,9), b = rand(1,9), c = rand(1,9);
  var patterns = [
    { expr: a + " + " + b + " \u00d7 " + c, ans: a + b * c },
    { expr: "(" + a + " + " + b + ") \u00d7 " + c, ans: (a + b) * c },
    { expr: a + " \u00d7 " + b + " + " + c, ans: a * b + c },
    { expr: a + " \u00d7 " + "(" + b + " + " + c + ")", ans: a * (b + c) }
  ];
  var p = randFrom(patterns);
  return { html: horizHtml(p.expr + " ="), answer: p.ans };
}

function makeIntegers(grade) {
  var max = grade <= 7 ? 20 : 50;
  var a = rand(-max, max);
  var b = rand(-max, max);
  var op = randFrom(["+", "\u2212"]);
  var ans = op === "+" ? a + b : a - b;
  return { html: horizHtml(a + " " + op + " (" + b + ") ="), answer: ans };
}

function makeExponents(grade) {
  if (Math.random() < 0.5) {
    var base = rand(2, 9);
    var exp  = rand(2, 3);
    return { html: horizHtml(base + "<sup>" + exp + "</sup> ="), answer: Math.pow(base, exp) };
  } else {
    var root = rand(1, 12);
    return { html: horizHtml("\u221a" + (root * root) + " ="), answer: root };
  }
}

function makeScientificNotation(grade) {
  var coeff = (rand(10, 99) / 10).toFixed(1);
  var exp   = rand(2, 6);
  var val   = parseFloat(coeff) * Math.pow(10, exp);
  if (Math.random() < 0.5) {
    return { html: horizHtml(val.toLocaleString() + " = ? \u00d7 10<sup>?</sup>"), answer: coeff + " x 10^" + exp };
  } else {
    return { html: horizHtml(coeff + " \u00d7 10<sup>" + exp + "</sup> ="), answer: val.toLocaleString() };
  }
}

function makeProblem(type, grade) {
  switch(type) {
    case "addition":          return makeAddition(grade);
    case "subtraction":       return makeSubtraction(grade);
    case "multiplication":    return makeMultiplication(grade);
    case "division":          return makeDivision(grade);
    case "longdivision":      return makeLongDivision(grade);
    case "rounding":          return makeRounding(grade);
    case "fractions":         return makeFractions(grade);
    case "decimals":          return makeDecimals(grade);
    case "orderofoperations": return makeOrderOfOps(grade);
    case "integers":          return makeIntegers(grade);
    case "exponents":         return makeExponents(grade);
    case "scientificnotation":return makeScientificNotation(grade);
    default:                  return makeAddition(grade);
  }
}

function generateProblems(type, count, grade, mixedTypes) {
  var problems = [];
  if (type === "mixed") {
    var pool = (mixedTypes && mixedTypes.length) ? mixedTypes : getMixedTypesForGrade(grade);
    for (var i = 0; i < count; i++) {
      problems.push(makeProblem(pool[i % pool.length], grade));
    }
    for (var i = problems.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = problems[i]; problems[i] = problems[j]; problems[j] = tmp;
    }
  } else {
    for (var i = 0; i < count; i++) problems.push(makeProblem(type, grade));
  }
  return problems;
}

function isHorizType(type) {
  return ["fractions","decimals","rounding","orderofoperations","integers","exponents","scientificnotation"].indexOf(type) !== -1;
}

function isMixedHoriz(problems) {
  for (var i = 0; i < problems.length; i++) {
    if (String(problems[i].html).indexOf("__HORIZ__") === 0) return true;
  }
  return false;
}

function getGridConfig(count, useHoriz) {
  if (useHoriz) return { useHoriz: true, rows: Math.ceil(count / 2) };
  if (count === 30) return { colClass: "mwg-cols-5", rowClass: "mwg-rows-6" };
  if (count === 40) return { colClass: "mwg-cols-5", rowClass: "mwg-rows-8" };
  if (count === 50) return { colClass: "mwg-cols-5", rowClass: "mwg-rows-10" };
  if (count === 60) return { colClass: "mwg-cols-6", rowClass: "mwg-rows-10" };
  return { colClass: "mwg-cols-5", rowClass: "mwg-rows-6" };
}

function descriptionFor(type, grade, count) {
  return count + " " + (TYPE_LABELS[type] || type) + " problems \u2014 Grade " + grade;
}

function buildWorksheet(student, setNum, setTotal, isLast) {
  var name = student.name, number = student.number, grade = student.grade;
  var type = student.type, count = student.count, mixedTypes = student.mixedTypes;
  var problems = generateProblems(type, count, grade, mixedTypes);
  var useHoriz = isHorizType(type) || (type === "mixed" && isMixedHoriz(problems));
  var grid = getGridConfig(count, useHoriz);
  var ws = document.createElement("div");
  ws.className = "mwg-worksheet" + (isLast ? "" : " print-break");
  var setLabel = setTotal > 1 ? "Worksheet " + setNum + " of " + setTotal : "";
  var desc = descriptionFor(type, grade, count);
  var bodyHtml = "";
  if (useHoriz) {
    bodyHtml = '<div class="mwg-horiz-grid">';
    for (var i = 0; i < problems.length; i++) {
      var expr = String(problems[i].html).replace("__HORIZ__", "");
      bodyHtml += '<div class="mwg-horiz-cell"><div class="mwg-horiz-num">' + (i+1) + '.</div><div class="mwg-horiz-problem">' + expr + '</div><div class="mwg-horiz-answer"></div></div>';
    }
    bodyHtml += '</div>';
  } else {
    bodyHtml = '<div class="mwg-problems-grid ' + grid.colClass + ' ' + grid.rowClass + '">';
    for (var i = 0; i < problems.length; i++) bodyHtml += problems[i].html;
    bodyHtml += '</div>';
  }
  ws.innerHTML =
    '<div class="mwg-ws-header">' +
      '<div class="mwg-ws-header-main">' +
        '<div class="mwg-ws-field"><span class="mwg-ws-field-label">Student Name</span><span class="mwg-ws-field-value">' + esc(name) + '</span></div>' +
        '<div class="mwg-ws-field"><span class="mwg-ws-field-label">Number</span><span class="mwg-ws-field-value">' + esc(number) + '</span></div>' +
        '<div class="mwg-ws-desc-box"><span class="mwg-ws-desc-text">' + esc(desc) + '</span>' + (setLabel ? '<span class="mwg-ws-set-label">' + esc(setLabel) + '</span>' : '') + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mwg-ws-body">' + bodyHtml + '</div>';
  return { el: ws, problems: problems };
}

function buildAnswerKeySheet(allAnswers, isLast) {
  var sheet = document.createElement("div");
  sheet.className = "mwg-answer-key-sheet" + (isLast ? "" : " print-break");
  var html = '<div class="mwg-ak-title">Answer Key</div>';
  for (var i = 0; i < allAnswers.length; i++) {
    var entry = allAnswers[i];
    html += '<div class="mwg-ak-student">' + esc(entry.name) + (entry.number ? " No." + esc(entry.number) : "") + ' \u2014 ' + esc(entry.desc) + '</div>';
    html += '<div class="mwg-ak-answers">';
    for (var j = 0; j < entry.problems.length; j++) {
      html += '<div class="mwg-ak-answer"><span class="mwg-ak-num">' + (j+1) + '.</span> ' + esc(String(entry.problems[j].answer)) + '</div>';
    }
    html += '</div>';
  }
  sheet.innerHTML = html;
  return sheet;
}

function generate() {
  resultsDiv.innerHTML = "";
  clearErrors();
  clearStatus();
  var parsed = inputMode === "advanced" ? parseAdvancedInput() : getStudentsFromStandard();
  if (parsed.errors.length) showErrors(parsed.errors);
  if (!parsed.students.length) { showNotice("No valid students found."); return; }
  var copies = parseInt(worksheetsPerStudent.value) || 1;
  var doKey  = answerKeyToggle.checked;
  var total  = parsed.students.length * copies;
  var pageCounter = 0;
  var allAnswers = [];
  for (var s = 0; s < parsed.students.length; s++) {
    var student = parsed.students[s];
    for (var c = 1; c <= copies; c++) {
      pageCounter++;
      var isLast = !doKey && pageCounter === total;
      var result = buildWorksheet(student, c, copies, isLast);
      resultsDiv.appendChild(result.el);
      if (doKey && c === 1) {
        allAnswers.push({ name: student.name, number: student.number, desc: descriptionFor(student.type, student.grade, student.count), problems: result.problems });
      }
    }
  }
  if (doKey && allAnswers.length) {
    resultsDiv.appendChild(buildAnswerKeySheet(allAnswers, true));
  }
  resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

function generateAndPrint() {
  clearStatus();
  generate();
  setTimeout(function() {
    if (!resultsDiv.querySelector(".mwg-worksheet")) return;
    var originalParent = resultsDiv.parentNode;
    var originalNext   = resultsDiv.nextSibling;
    resultsDiv.id = "mwg-results-print";
    document.body.appendChild(resultsDiv);
    window.print();
    resultsDiv.id = "mwgResults";
    if (originalNext) originalParent.insertBefore(resultsDiv, originalNext);
    else originalParent.appendChild(resultsDiv);
  }, 200);
}

function wireButtons() {
  toggleModeBtn.addEventListener("click", function() {
    clearStatus();
    setInputMode(inputMode === "standard" ? "advanced" : "standard");
  });
  addStudentBtn.addEventListener("click", function() { clearStatus(); addStudent(); refreshNumbers(); });
  genCodeBtn.addEventListener("click",    function() { clearStatus(); openCodeModal(); });
  saveBtn.addEventListener("click",       function() { clearStatus(); saveRoster(); });
  clearCurrentBtn.addEventListener("click", function() { clearStatus(); clearCurrentRoster(); });
  clearSavedBtn.addEventListener("click",   function() { clearStatus(); clearSavedRoster(); });
  generateBtn.addEventListener("click",     function() { generateAndPrint(); });
  fillDownBtn.addEventListener("click", function() {
    var entries = studentsContainer.querySelectorAll(".mwg-student-entry");
    if (entries.length < 2) return;
    var first = readEntry(entries[0]);
    for (var i = 1; i < entries.length; i++) {
      var e = entries[i];
      e.querySelector('[name="grade"]').value = first.grade;
      updateTypeOptionsForGrade(e, first.type);
      e.querySelector('[name="problemType"]').value = first.type;
      e.querySelector('[name="count"]').value = first.count;
      updateMixedVisibility(e);
    }
    showSuccess("Settings filled down from Student 1.");
  });
  closeModal.addEventListener("click", function() { codeModal.className = "mwg-modal-overlay"; });
  codeModal.addEventListener("click", function(e) {
    if (e.target === codeModal) codeModal.className = "mwg-modal-overlay";
  });
  copyCodeBtn.addEventListener("click", function() {
    try { navigator.clipboard.writeText(codeOutput.value).then(function() { showSuccess("Code copied."); }); }
    catch(e) { showNotice("Unable to copy automatically."); }
  });
  useCodeBtn.addEventListener("click", function() {
    advancedBox.value = codeOutput.value;
    setInputMode("advanced");
    codeModal.className = "mwg-modal-overlay";
    showSuccess("Code moved to Advanced Input.");
  });
}

function init() {
  renderReference();
  loadRoster();
  if (!studentsContainer.querySelector(".mwg-student-entry")) buildDefaultStudents();
  updateCounter();
}

function waitAndInit() {
  if (document.getElementById("mwgStudentsContainer")) {
    injectStyles();
    assignDomRefs();
    wireButtons();
    init();
  } else {
    setTimeout(waitAndInit, 50);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", waitAndInit);
} else {
  waitAndInit();
}

})();