/* ═══════════════════════════════════════════════
   MODELS (simulated)
═══════════════════════════════════════════════ */
function openModel(type){
  currentModelType = type;
  const names = {linear:'Linear Regression', logistic:'Logistic Regression', dtree:'Decision Tree'};
  document.getElementById('model-title').innerHTML = `<i class="fas fa-robot" style="color:var(--accent)"></i> ${names[type]}`;
  const nc = numCols(); const cc = cols();
  document.getElementById('model-form').innerHTML =
    colSelect('Target (Y)', 'm-y', cc) + colSelect('Feature 1 (X)', 'm-x1', nc) + colSelect('Feature 2 (X)', 'm-x2', nc);
  document.getElementById('model-result').innerHTML = '';
  document.getElementById('model-overlay').classList.add('open');
}
function closeModel(){ document.getElementById('model-overlay').classList.remove('open'); }

function runModel(){
  const yCol = document.getElementById('m-y').value;
  const x1Col = document.getElementById('m-x1').value;
  const resultEl = document.getElementById('model-result');
  resultEl.innerHTML = '<div style="color:var(--muted);font-size:.82rem"><i class="fas fa-spinner fa-spin"></i> Training…</div>';

  setTimeout(() => {
    // Simulated metrics
    const r2   = (Math.random()*0.35+0.60).toFixed(4);
    const mse  = (Math.random()*50+5).toFixed(4);
    const mae  = (Math.random()*10+1).toFixed(4);
    const acc  = (Math.random()*0.18+0.78).toFixed(4);
    const prec = (Math.random()*0.15+0.80).toFixed(4);
    const rec  = (Math.random()*0.15+0.75).toFixed(4);
    const f1   = ((2*parseFloat(prec)*parseFloat(rec))/(parseFloat(prec)+parseFloat(rec))).toFixed(4);

    let html = `<div style="font-size:.78rem;color:var(--muted);margin-bottom:10px">Model trained on <b style="color:var(--text)">${DATA.length}</b> samples · Target: <b style="color:var(--accent2)">${yCol}</b> · Feature: <b style="color:var(--accent2)">${x1Col}</b></div>`;

    if(currentModelType==='linear'){
      const slope = (Math.random()*2-1).toFixed(4), intercept = (Math.random()*10-5).toFixed(4);
      html += `<div style="font-family:var(--mono);font-size:.78rem;background:var(--panel2);padding:10px 14px;border-radius:8px;border:1px solid var(--border);margin-bottom:12px;color:var(--accent2)">ŷ = ${slope} × ${x1Col} + ${intercept}</div>`;
      html += `<div class="metric-grid">
        <div class="metric-card"><div class="val">${r2}</div><div class="lbl">R² Score</div></div>
        <div class="metric-card"><div class="val">${mse}</div><div class="lbl">MSE</div></div>
        <div class="metric-card"><div class="val">${mae}</div><div class="lbl">MAE</div></div>
        <div class="metric-card"><div class="val">${DATA.length}</div><div class="lbl">Samples</div></div>
      </div>`;
    } else if(currentModelType==='logistic'){
      html += `<div class="metric-grid">
        <div class="metric-card"><div class="val">${acc}</div><div class="lbl">Accuracy</div></div>
        <div class="metric-card"><div class="val">${prec}</div><div class="lbl">Precision</div></div>
        <div class="metric-card"><div class="val">${rec}</div><div class="lbl">Recall</div></div>
        <div class="metric-card"><div class="val">${f1}</div><div class="lbl">F1 Score</div></div>
      </div>
      <div style="margin-top:14px;font-size:.78rem;color:var(--muted)">Confusion Matrix (simulated)</div>
      <table class="out-table" style="margin-top:8px;width:auto">
        <thead><tr><th></th><th>Pred 0</th><th>Pred 1</th></tr></thead>
        <tbody>
          <tr><td style="color:var(--muted)">Actual 0</td><td style="color:var(--green)">${Math.floor(Math.random()*30+50)}</td><td style="color:var(--red)">${Math.floor(Math.random()*10+3)}</td></tr>
          <tr><td style="color:var(--muted)">Actual 1</td><td style="color:var(--red)">${Math.floor(Math.random()*8+2)}</td><td style="color:var(--green)">${Math.floor(Math.random()*25+40)}</td></tr>
        </tbody>
      </table>`;
    } else if(currentModelType==='dtree'){
      const depth = Math.floor(Math.random()*3+3);
      html += `<div class="metric-grid">
        <div class="metric-card"><div class="val">${acc}</div><div class="lbl">Accuracy</div></div>
        <div class="metric-card"><div class="val">${depth}</div><div class="lbl">Max Depth</div></div>
        <div class="metric-card"><div class="val">${Math.floor(Math.random()*4+2)}</div><div class="lbl">Leaves</div></div>
        <div class="metric-card"><div class="val">${f1}</div><div class="lbl">F1 Score</div></div>
      </div>
      <div style="margin-top:12px;font-size:.78rem;color:var(--muted)">Feature Importance</div>
      <div style="background:var(--panel2);border-radius:8px;padding:10px 14px;margin-top:6px;font-family:var(--mono);font-size:.75rem">
        ${x1Col}: ${'█'.repeat(Math.floor(Math.random()*12+6))} ${(Math.random()*0.4+0.4).toFixed(3)}<br>
        (other features) ${'█'.repeat(Math.floor(Math.random()*6+2))} ${(Math.random()*0.3+0.1).toFixed(3)}
      </div>`;
    }

    resultEl.innerHTML = html;
    addLog(`Trained ${currentModelType} model — Target: ${yCol}, Feature: ${x1Col}`);
  }, 900);
}

/* ═══════════════════════════════════════════════
   OUTPUT PANEL
═══════════════════════════════════════════════ */
function switchTab(tab){
  document.querySelectorAll('.out-tab').forEach(t => t.classList.toggle('active', t.dataset.tab===tab));
  ['console','result','log'].forEach(t => document.getElementById('out-'+t).style.display = t===tab?'block':'none');
}

function showConsole(text){
  document.getElementById('out-console').innerHTML = `<div class="out-text">${esc(text)}</div>`;
  switchTab('console');
}

function showResultTable(rows, title){
  if(!rows.length){ showConsole('No data returned.'); return; }
  const headers = Object.keys(rows[0]);
  const html = `<div style="font-size:.75rem;color:var(--muted);margin-bottom:8px">${esc(title)}</div>
    <table class="out-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${headers.map(h=>`<td>${esc(String(r[h]??''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  document.getElementById('out-result').innerHTML = html;
  switchTab('result');
}

//extend output table
function toggleOutputSize(){

    const panel = document.querySelector(".output-panel");
    const icon = document.getElementById("expandIcon");

    panel.classList.toggle("expanded");

    if(panel.classList.contains("expanded")){
        icon.classList.remove("fa-expand");
        icon.classList.add("fa-compress");
    }else{
        icon.classList.remove("fa-compress");
        icon.classList.add("fa-expand");
    }
}
function toggleOutputPanel(){

    const panel = document.querySelector(".output-panel");
    const restore = document.getElementById("restoreOutputBtn");
    const collapse = document.querySelector(".collapse-btn");

    if(panel.style.display === "none"){

        panel.style.display = "";
        restore.style.display = "none";
        collapse.style.display = "";

    }else{

        panel.style.display = "none";
        restore.style.display = "";
        collapse.style.display = "none";

    }

}
/* ═══════════════════════════════════════════════
   LOG
═══════════════════════════════════════════════ */
function addLog(msg){
  const now = new Date().toLocaleTimeString();
  logLines.unshift(`[${now}] ${msg}`);
  if(logLines.length>100) logLines.pop();
  document.getElementById('log-text').textContent = logLines.join('\n');
}

/*═══════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════ */
function toast(msg, type='info'){
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = {success:'fa-circle-check',error:'fa-circle-xmark',info:'fa-circle-info'};
  el.innerHTML = `<i class="fas ${icons[type]||'fa-circle-info'}"></i> ${esc(msg)}`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(()=>el.remove(), 3200);
}

/* ═══════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════ */
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
renderTable(DATA, '');
addLog('no active datasets loaded for now');