/* ============================================================
   RESUME BUILDER - state + rendering
   Data model kept in `state`. Every input change re-renders
   the preview via renderPreview(), which dispatches to the
   render function for the currently chosen template.
   ============================================================ */

let state = {
  template: null, // 'bold' | 'executive' | 'clean' | 'soft'
  personal: { name: "", title: "", phone: "", email: "", location: "", linkedin: "", github: "", photo: "" },
  summary: "",
  techSkills: [],   // [{id, category, items: "comma, separated"}]
  softSkills: [],   // [{id, value}]
  experience: [],   // [{id, employer, dateRange, role, responsibilities:[], impact:[]}]
  education: [],    // [{id, degree, school, year}]
  awards: []        // [{id, value}]
};

const TEMPLATE_LABELS = {
  bold: "Bold Minimal",
  executive: "Executive Photo",
  clean: "Clean ATS",
  soft: "Soft Modern"
};

let uid = 0;
const nextId = () => "id" + (uid++);
let formInitialized = false;

/* ---------------- INIT ---------------- */
window.addEventListener("DOMContentLoaded", () => {
  bindPersonalAndSummary();
  bindPhotoInput();
});

function initFormOnce() {
  if (formInitialized) return;
  formInitialized = true;
  // start with one blank entry in each repeatable section so the form isn't empty
  addTechSkillCategory();
  addSoftSkill();
  addExperience();
  addEducation();
  addAward();
}

/* ---------------- TEMPLATE GALLERY ---------------- */
function selectTemplate(templateId) {
  state.template = templateId;
  document.getElementById("gallery-screen").style.display = "none";
  document.getElementById("app-screen").style.display = "grid";
  document.getElementById("current-template-label").textContent = TEMPLATE_LABELS[templateId] || templateId;
  initFormOnce();
  renderPreview();
}

function showGallery() {
  document.getElementById("app-screen").style.display = "none";
  document.getElementById("gallery-screen").style.display = "flex";
}

/* ---------------- PERSONAL INFO + PHOTO ---------------- */
function bindPersonalAndSummary() {
  const map = {
    "p-name": "name", "p-title": "title", "p-phone": "phone", "p-email": "email",
    "p-location": "location", "p-linkedin": "linkedin", "p-github": "github"
  };
  Object.entries(map).forEach(([elId, key]) => {
    document.getElementById(elId).addEventListener("input", (e) => {
      state.personal[key] = e.target.value;
      renderPreview();
    });
  });
  document.getElementById("p-summary").addEventListener("input", (e) => {
    state.summary = e.target.value;
    renderPreview();
  });
}

function bindPhotoInput() {
  document.getElementById("p-photo").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      state.personal.photo = ev.target.result;
      updatePhotoPreview();
      renderPreview();
    };
    reader.readAsDataURL(file);
  });
}
function removePhoto() {
  state.personal.photo = "";
  document.getElementById("p-photo").value = "";
  updatePhotoPreview();
  renderPreview();
}
function updatePhotoPreview() {
  const el = document.getElementById("photo-preview");
  el.innerHTML = state.personal.photo
    ? `<img src="${state.personal.photo}" alt="Uploaded photo" />`
    : "No photo";
}

/* ---------------- TECHNICAL SKILLS ---------------- */
function addTechSkillCategory() {
  const item = { id: nextId(), category: "", items: "" };
  state.techSkills.push(item);
  renderTechSkills();
  renderPreview();
}
function removeTechSkill(id) {
  state.techSkills = state.techSkills.filter(s => s.id !== id);
  renderTechSkills();
  renderPreview();
}
function renderTechSkills() {
  const container = document.getElementById("tech-skills-list");
  container.innerHTML = "";
  state.techSkills.forEach(s => {
    const block = document.createElement("div");
    block.className = "card-block";
    block.innerHTML = `
      <button type="button" class="remove-btn" onclick="removeTechSkill('${s.id}')">✕</button>
      <div class="field">
        <label>Category (e.g. Programming Languages)</label>
        <input type="text" value="${escapeAttr(s.category)}" data-id="${s.id}" data-field="category" placeholder="Programming Languages" />
      </div>
      <div class="field">
        <label>Skills (comma separated)</label>
        <input type="text" value="${escapeAttr(s.items)}" data-id="${s.id}" data-field="items" placeholder="Python, Java, C++" />
      </div>
    `;
    container.appendChild(block);
  });
  container.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const item = state.techSkills.find(s => s.id === e.target.dataset.id);
      item[e.target.dataset.field] = e.target.value;
      renderPreview();
    });
  });
}

/* ---------------- SOFT SKILLS ---------------- */
function addSoftSkill() {
  state.softSkills.push({ id: nextId(), value: "" });
  renderSoftSkills();
  renderPreview();
}
function removeSoftSkill(id) {
  state.softSkills = state.softSkills.filter(s => s.id !== id);
  renderSoftSkills();
  renderPreview();
}
function renderSoftSkills() {
  const container = document.getElementById("soft-skills-list");
  container.innerHTML = "";
  state.softSkills.forEach(s => {
    const row = document.createElement("div");
    row.className = "bullet-row";
    row.innerHTML = `
      <input type="text" value="${escapeAttr(s.value)}" data-id="${s.id}" placeholder="Communication & Teamwork" />
      <button type="button" onclick="removeSoftSkill('${s.id}')">✕</button>
    `;
    container.appendChild(row);
  });
  container.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const item = state.softSkills.find(s => s.id === e.target.dataset.id);
      item.value = e.target.value;
      renderPreview();
    });
  });
}

/* ---------------- EXPERIENCE ---------------- */
function addExperience() {
  state.experience.push({
    id: nextId(), employer: "", dateRange: "", role: "",
    responsibilities: [""], impact: [""]
  });
  renderExperience();
  renderPreview();
}
function removeExperience(id) {
  state.experience = state.experience.filter(e => e.id !== id);
  renderExperience();
  renderPreview();
}
function addBullet(expId, field) {
  const exp = state.experience.find(e => e.id === expId);
  exp[field].push("");
  renderExperience();
  renderPreview();
}
function removeBullet(expId, field, index) {
  const exp = state.experience.find(e => e.id === expId);
  exp[field].splice(index, 1);
  if (exp[field].length === 0) exp[field].push("");
  renderExperience();
  renderPreview();
}
function renderExperience() {
  const container = document.getElementById("experience-list");
  container.innerHTML = "";
  state.experience.forEach(exp => {
    const block = document.createElement("div");
    block.className = "card-block";
    block.innerHTML = `
      <button type="button" class="remove-btn" onclick="removeExperience('${exp.id}')">✕</button>
      <div class="grid-2">
        <div class="field"><label>Employer / Company / College</label>
          <input type="text" value="${escapeAttr(exp.employer)}" data-id="${exp.id}" data-field="employer" placeholder="ABC Company" /></div>
        <div class="field"><label>Date Range</label>
          <input type="text" value="${escapeAttr(exp.dateRange)}" data-id="${exp.id}" data-field="dateRange" placeholder="Jun 2024 - Aug 2024" /></div>
      </div>
      <div class="field"><label>Role</label>
        <input type="text" value="${escapeAttr(exp.role)}" data-id="${exp.id}" data-field="role" placeholder="Intern / Project Lead" /></div>

      <label style="font-size:12px;color:#6b7280;">Responsibilities</label>
      <div class="bullets-list" data-bullets="responsibilities" data-exp="${exp.id}">
        ${exp.responsibilities.map((r, i) => `
          <div class="bullet-row">
            <input type="text" value="${escapeAttr(r)}" data-exp="${exp.id}" data-field="responsibilities" data-index="${i}" placeholder="Assisted in..." />
            <button type="button" onclick="removeBullet('${exp.id}','responsibilities',${i})">✕</button>
          </div>`).join("")}
      </div>
      <button type="button" class="btn-small" onclick="addBullet('${exp.id}','responsibilities')">+ Add responsibility</button>

      <label style="font-size:12px;color:#6b7280;margin-top:8px;display:block;">Impact</label>
      <div class="bullets-list" data-bullets="impact" data-exp="${exp.id}">
        ${exp.impact.map((r, i) => `
          <div class="bullet-row">
            <input type="text" value="${escapeAttr(r)}" data-exp="${exp.id}" data-field="impact" data-index="${i}" placeholder="Improved efficiency by 20%" />
            <button type="button" onclick="removeBullet('${exp.id}','impact',${i})">✕</button>
          </div>`).join("")}
      </div>
      <button type="button" class="btn-small" onclick="addBullet('${exp.id}','impact')">+ Add impact point</button>
    `;
    container.appendChild(block);
  });

  container.querySelectorAll("input[data-field]").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const expId = e.target.dataset.exp || e.target.dataset.id;
      const exp = state.experience.find(x => x.id === expId);
      const field = e.target.dataset.field;
      if (field === "responsibilities" || field === "impact") {
        exp[field][parseInt(e.target.dataset.index)] = e.target.value;
      } else {
        exp[field] = e.target.value;
      }
      renderPreview();
    });
  });
}

/* ---------------- EDUCATION ---------------- */
function addEducation() {
  state.education.push({ id: nextId(), degree: "", school: "", year: "" });
  renderEducation();
  renderPreview();
}
function removeEducation(id) {
  state.education = state.education.filter(e => e.id !== id);
  renderEducation();
  renderPreview();
}
function renderEducation() {
  const container = document.getElementById("education-list");
  container.innerHTML = "";
  state.education.forEach(ed => {
    const block = document.createElement("div");
    block.className = "card-block";
    block.innerHTML = `
      <button type="button" class="remove-btn" onclick="removeEducation('${ed.id}')">✕</button>
      <div class="field"><label>Degree</label>
        <input type="text" value="${escapeAttr(ed.degree)}" data-id="${ed.id}" data-field="degree" placeholder="Bachelor of Engineering (CSE)" /></div>
      <div class="grid-2">
        <div class="field"><label>College / University</label>
          <input type="text" value="${escapeAttr(ed.school)}" data-id="${ed.id}" data-field="school" placeholder="ABC College" /></div>
        <div class="field"><label>Year of Graduation</label>
          <input type="text" value="${escapeAttr(ed.year)}" data-id="${ed.id}" data-field="year" placeholder="2027" /></div>
      </div>
    `;
    container.appendChild(block);
  });
  container.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const ed = state.education.find(x => x.id === e.target.dataset.id);
      ed[e.target.dataset.field] = e.target.value;
      renderPreview();
    });
  });
}

/* ---------------- AWARDS ---------------- */
function addAward() {
  state.awards.push({ id: nextId(), value: "" });
  renderAwards();
  renderPreview();
}
function removeAward(id) {
  state.awards = state.awards.filter(a => a.id !== id);
  renderAwards();
  renderPreview();
}
function renderAwards() {
  const container = document.getElementById("awards-list");
  container.innerHTML = "";
  state.awards.forEach(a => {
    const row = document.createElement("div");
    row.className = "bullet-row";
    row.innerHTML = `
      <input type="text" value="${escapeAttr(a.value)}" data-id="${a.id}" placeholder="Scholarship for academic excellence" />
      <button type="button" onclick="removeAward('${a.id}')">✕</button>
    `;
    container.appendChild(row);
  });
  container.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const item = state.awards.find(x => x.id === e.target.dataset.id);
      item.value = e.target.value;
      renderPreview();
    });
  });
}

/* ============================================================
   LIVE PREVIEW — dispatches to the render function that
   matches the currently selected template.
   ============================================================ */
function renderPreview() {
  const el = document.getElementById("resume-preview");
  const tpl = state.template || "bold";
  el.className = "resume-page tpl-" + tpl;

  if (tpl === "executive") el.innerHTML = renderExecutiveTemplate();
  else if (tpl === "clean") el.innerHTML = renderCleanTemplate();
  else if (tpl === "soft") el.innerHTML = renderSoftTemplate();
  else el.innerHTML = renderBoldTemplate();
}

/* ---------- shared data getters ---------- */
function getFilledTech() { return state.techSkills.filter(s => s.category || s.items); }
function getFilledSoft() { return state.softSkills.filter(s => s.value); }
function getFilledExperience() { return state.experience.filter(e => e.employer || e.role); }
function getFilledEducation() { return state.education.filter(e => e.degree || e.school); }
function getFilledAwards() { return state.awards.filter(a => a.value); }

function experienceEntryHtml(exp) {
  let html = `<div class="rb-entry">`;
  html += `<div class="rb-entry-header"><span>${escapeHtml(exp.employer)}</span><span>${escapeHtml(exp.dateRange)}</span></div>`;
  if (exp.role) html += `<div class="rb-entry-role">${escapeHtml(exp.role)}</div>`;
  const resp = exp.responsibilities.filter(Boolean);
  const imp = exp.impact.filter(Boolean);
  const bullets = [...resp, ...imp];
  if (bullets.length) {
    html += `<ul class="rb-list">${bullets.map(r => `<li>${escapeHtml(r)}</li>`).join("")}</ul>`;
  }
  html += `</div>`;
  return html;
}

/* ============================================================
   TEMPLATE: BOLD MINIMAL
   ============================================================ */
function renderBoldTemplate() {
  const p = state.personal;
  const contactBits = [p.phone, p.email, p.location].filter(Boolean).join(" | ");
  const linkBits = [p.linkedin, p.github].filter(Boolean).join(" | ");

  let html = `<div class="rb-header">`;
  html += `<div class="rb-name">${escapeHtml(p.name) || "Your Name"}</div>`;
  if (p.title) html += `<div class="rb-title">${escapeHtml(p.title)}</div>`;
  const line = [contactBits, linkBits].filter(Boolean).join(" | ");
  html += `<div class="rb-contact-line">${escapeHtml(line) || "Phone | Email | Location"}</div>`;
  html += `</div>`;

  html += `<div class="rb-body">`;

  // sidebar
  html += `<div class="rb-sidebar">`;
  const edu = getFilledEducation();
  if (edu.length) {
    html += `<div class="rb-h">Education</div>`;
    edu.forEach(ed => {
      html += `<div class="rb-edu-item"><div class="rb-bold">${escapeHtml(ed.school)}</div><div class="rb-sub">${escapeHtml(ed.year)}</div><div class="rb-sub">${escapeHtml(ed.degree)}</div></div>`;
    });
  }
  const tech = getFilledTech();
  const soft = getFilledSoft();
  if (tech.length || soft.length) {
    html += `<div class="rb-h">Skills</div><ul class="rb-list">`;
    tech.forEach(s => { html += `<li>${escapeHtml(s.category ? s.category + ": " : "")}${escapeHtml(s.items)}</li>`; });
    soft.forEach(s => { html += `<li>${escapeHtml(s.value)}</li>`; });
    html += `</ul>`;
  }
  html += `</div>`;

  // main
  html += `<div class="rb-main">`;
  html += `<div class="rb-h">Summary</div>`;
  html += state.summary ? `<p class="rb-text">${escapeHtml(state.summary)}</p>` : `<p class="rb-text r-empty-hint">Your summary will appear here.</p>`;

  const exp = getFilledExperience();
  if (exp.length) {
    html += `<div class="rb-h">Experience</div>`;
    exp.forEach(e => { html += experienceEntryHtml(e); });
  }

  const awards = getFilledAwards();
  if (awards.length) {
    html += `<div class="rb-h">Awards &amp; Accomplishments</div><ul class="rb-list">`;
    awards.forEach(a => { html += `<li>${escapeHtml(a.value)}</li>`; });
    html += `</ul>`;
  }
  html += `</div>`; // rb-main

  html += `</div>`; // rb-body
  return html;
}

/* ============================================================
   TEMPLATE: EXECUTIVE PHOTO
   ============================================================ */
function renderExecutiveTemplate() {
  const p = state.personal;
  const initials = (p.name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");

  let html = `<div class="rb-banner">`;
  html += `<div class="rb-photo">${p.photo ? `<img src="${p.photo}" alt="Profile photo" />` : (initials || "")}</div>`;
  html += `<div><div class="rb-name">${escapeHtml(p.name) || "Your Name"}</div>`;
  if (p.title) html += `<div class="rb-title">${escapeHtml(p.title.toUpperCase())}</div>`;
  html += `</div></div>`;

  html += `<div class="rb-body">`;

  // sidebar
  html += `<div class="rb-sidebar">`;
  html += `<div class="rb-h">Contact</div><ul class="rb-list">`;
  if (p.phone) html += `<li>${escapeHtml(p.phone)}</li>`;
  if (p.email) html += `<li>${escapeHtml(p.email)}</li>`;
  if (p.location) html += `<li>${escapeHtml(p.location)}</li>`;
  if (p.linkedin) html += `<li>${escapeHtml(p.linkedin)}</li>`;
  if (p.github) html += `<li>${escapeHtml(p.github)}</li>`;
  html += `</ul>`;

  const tech = getFilledTech();
  const soft = getFilledSoft();
  if (tech.length || soft.length) {
    html += `<div class="rb-h">Skills</div><ul class="rb-list">`;
    tech.forEach(s => { html += `<li>${escapeHtml(s.category ? s.category + ": " : "")}${escapeHtml(s.items)}</li>`; });
    soft.forEach(s => { html += `<li>${escapeHtml(s.value)}</li>`; });
    html += `</ul>`;
  }

  const awards = getFilledAwards();
  if (awards.length) {
    html += `<div class="rb-h">Awards</div><ul class="rb-list">`;
    awards.forEach(a => { html += `<li>${escapeHtml(a.value)}</li>`; });
    html += `</ul>`;
  }
  html += `</div>`; // sidebar

  // main
  html += `<div class="rb-main">`;
  html += `<div class="rb-h">Profile</div>`;
  html += state.summary ? `<p class="rb-text">${escapeHtml(state.summary)}</p>` : `<p class="rb-text r-empty-hint">Your summary will appear here.</p>`;

  const exp = getFilledExperience();
  if (exp.length) {
    html += `<div class="rb-h">Work Experience</div><div class="rb-timeline">`;
    exp.forEach(e => { html += experienceEntryHtml(e); });
    html += `</div>`;
  }

  const edu = getFilledEducation();
  if (edu.length) {
    html += `<div class="rb-h">Education</div>`;
    edu.forEach(ed => {
      html += `<div class="rb-entry-header"><span>${escapeHtml(ed.degree)}</span><span>${escapeHtml(ed.year)}</span></div>`;
      html += `<div class="rb-entry-role">${escapeHtml(ed.school)}</div>`;
    });
  }
  html += `</div>`; // main

  html += `</div>`; // body
  return html;
}

/* ============================================================
   TEMPLATE: CLEAN ATS
   ============================================================ */
function renderCleanTemplate() {
  const p = state.personal;
  const contactBits = [p.phone, p.email, p.location, p.linkedin, p.github].filter(Boolean).join(" | ");

  let html = "";
  html += `<div class="rb-name">${escapeHtml(p.name) || "Your Name"}</div>`;
  if (p.title) html += `<div class="rb-title">${escapeHtml(p.title)}</div>`;
  html += `<div class="rb-contact-line">${escapeHtml(contactBits) || "Phone | Email | Location"}</div>`;

  html += `<div class="rb-h">Profile</div>`;
  html += state.summary ? `<p class="rb-text">${escapeHtml(state.summary)}</p>` : `<p class="rb-text r-empty-hint">Your summary will appear here.</p>`;

  const exp = getFilledExperience();
  if (exp.length) {
    html += `<div class="rb-h">Professional Experience</div>`;
    exp.forEach(e => { html += experienceEntryHtml(e); });
  }

  const edu = getFilledEducation();
  if (edu.length) {
    html += `<div class="rb-h">Education</div>`;
    edu.forEach(ed => {
      html += `<div class="rb-entry-header"><span>${escapeHtml(ed.degree)}</span><span>${escapeHtml(ed.year)}</span></div>`;
      html += `<div class="rb-entry-role">${escapeHtml(ed.school)}</div>`;
    });
  }

  const tech = getFilledTech();
  const soft = getFilledSoft();
  if (tech.length || soft.length) {
    html += `<div class="rb-h">Professional Skills</div><ul class="rb-list">`;
    tech.forEach(s => { html += `<li>${escapeHtml(s.category ? s.category + ": " : "")}${escapeHtml(s.items)}</li>`; });
    soft.forEach(s => { html += `<li>${escapeHtml(s.value)}</li>`; });
    html += `</ul>`;
  }

  const awards = getFilledAwards();
  if (awards.length) {
    html += `<div class="rb-h">Additional Information</div><ul class="rb-list">`;
    awards.forEach(a => { html += `<li>${escapeHtml(a.value)}</li>`; });
    html += `</ul>`;
  }

  return html;
}

/* ============================================================
   TEMPLATE: SOFT MODERN
   ============================================================ */
function renderSoftTemplate() {
  const p = state.personal;

  let html = `<div class="rb-banner">`;
  html += `<div><div class="rb-name">${escapeHtml(p.name) || "Your Name"}</div>`;
  if (p.title) html += `<div class="rb-title">${escapeHtml(p.title)}</div>`;
  html += `</div>`;
  html += `<div class="rb-contact-block">`;
  if (p.phone) html += `${escapeHtml(p.phone)}<br/>`;
  if (p.email) html += `${escapeHtml(p.email)}<br/>`;
  if (p.location) html += `${escapeHtml(p.location)}<br/>`;
  if (p.linkedin) html += `${escapeHtml(p.linkedin)}<br/>`;
  if (p.github) html += `${escapeHtml(p.github)}`;
  html += `</div></div>`;

  html += `<div class="rb-main">`;

  html += `<div class="rb-h">Summary</div>`;
  html += state.summary ? `<p class="rb-text">${escapeHtml(state.summary)}</p>` : `<p class="rb-text r-empty-hint">Your summary will appear here.</p>`;

  const exp = getFilledExperience();
  if (exp.length) {
    html += `<div class="rb-h">Work Experience</div>`;
    exp.forEach(e => { html += experienceEntryHtml(e); });
  }

  const edu = getFilledEducation();
  if (edu.length) {
    html += `<div class="rb-h">Education</div>`;
    edu.forEach(ed => {
      html += `<div class="rb-entry-header"><span>${escapeHtml(ed.degree)}</span><span>${escapeHtml(ed.year)}</span></div>`;
      html += `<div class="rb-entry-role">${escapeHtml(ed.school)}</div>`;
    });
  }

  const tech = getFilledTech();
  const soft = getFilledSoft();
  if (tech.length || soft.length) {
    html += `<div class="rb-h">Key Skills</div><ul class="rb-skills-grid">`;
    tech.forEach(s => { html += `<li>${escapeHtml(s.category ? s.category + ": " : "")}${escapeHtml(s.items)}</li>`; });
    soft.forEach(s => { html += `<li>${escapeHtml(s.value)}</li>`; });
    html += `</ul>`;
  }

  const awards = getFilledAwards();
  if (awards.length) {
    html += `<div class="rb-h">Awards &amp; Accomplishments</div><ul class="rb-list">`;
    awards.forEach(a => { html += `<li>${escapeHtml(a.value)}</li>`; });
    html += `</ul>`;
  }

  html += `</div>`; // main
  return html;
}

/* ---------------- PDF EXPORT (browser print) ---------------- */
function downloadPDF() {
  document.title = (state.personal.name ? state.personal.name.replace(/\s+/g, "_") : "Resume") + "_Resume";
  window.print();
}

/* ---------------- DRAFT SAVE / LOAD (localStorage) ---------------- */
function saveDraft() {
  localStorage.setItem("resumeBuilderDraft", JSON.stringify(state));
  alert("Draft saved to this browser.");
}
function loadDraft() {
  const raw = localStorage.getItem("resumeBuilderDraft");
  if (!raw) { alert("No saved draft found."); return; }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid format");
    state = parsed;
  } catch (e) {
    alert("Could not load draft: data is corrupted.");
    return;
  }
  
  // Ensure default sub-structures exist
  if (!state.personal) state.personal = {};
  if (!state.techSkills) state.techSkills = [];
  if (!state.softSkills) state.softSkills = [];
  if (!state.experience) state.experience = [];
  if (!state.education) state.education = [];
  if (!state.awards) state.awards = [];
  if (!state.template) state.template = "bold";

  // move to builder screen if we're still on the gallery
  document.getElementById("gallery-screen").style.display = "none";
  document.getElementById("app-screen").style.display = "grid";
  document.getElementById("current-template-label").textContent = TEMPLATE_LABELS[state.template] || state.template;
  formInitialized = true;

  // repopulate personal + summary fields
  document.getElementById("p-name").value = state.personal.name || "";
  document.getElementById("p-title").value = state.personal.title || "";
  document.getElementById("p-phone").value = state.personal.phone || "";
  document.getElementById("p-email").value = state.personal.email || "";
  document.getElementById("p-location").value = state.personal.location || "";
  document.getElementById("p-linkedin").value = state.personal.linkedin || "";
  document.getElementById("p-github").value = state.personal.github || "";
  document.getElementById("p-summary").value = state.summary || "";
  updatePhotoPreview();
  renderTechSkills();
  renderSoftSkills();
  renderExperience();
  renderEducation();
  renderAwards();
  renderPreview();
}

/* ---------------- helpers ---------------- */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  const s = typeof str === "string" ? str : String(str);
  return s.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}
function escapeAttr(str) { return escapeHtml(str); }
