
let BRAIN = null;
let SELECTED = new Set();

function $(id){ return document.getElementById(id); }

async function loadBrain(){
  const res = await fetch('/data/nova_brain.json'); // correct public path
  if(!res.ok){ 
    document.body.innerHTML = '<div style="padding:24px;font-family:system-ui">Error loading Nova data. Check /public/data/nova_brain.json</div>';
    return;
  }
  BRAIN = await res.json();
  const wrap = $('traits');
  wrap.innerHTML = '';
  (BRAIN.traits || []).forEach(t => {
    const div = document.createElement('div');
    div.className = 'trait';
    div.dataset.id = t.trait_id;
    div.textContent = t.trait_name;
    div.addEventListener('click', () => toggleTrait(div, t.trait_id));
    wrap.appendChild(div);
  });
}

function toggleTrait(el, id){
  if(SELECTED.has(id)){ SELECTED.delete(id); el.classList.remove('selected'); }
  else { SELECTED.add(id); el.classList.add('selected'); }
  $('traitCount').textContent = SELECTED.size + ' selected';
  $('seeResultsBtn').disabled = SELECTED.size < 3;
}

function scorePositions(){
  const selected = Array.from(SELECTED);
  const weights = BRAIN.weights || {};
  const positions = BRAIN.positions || [];
  const scored = positions.map(p => {
    const w = weights[p.position_id] || {};
    let sum = 0;
    selected.forEach(tid => { sum += (w[tid] || 0); });
    const score = selected.length ? (sum / selected.length) : 0;
    return { ...p, score: +(score.toFixed(3)) };
  }).filter(r => r.score >= 0.18) // threshold
    .sort((a,b) => b.score - a.score)
    .slice(0, 24);
  return scored;
}

function renderResults(list){
  const box = $('results');
  box.innerHTML = '';
  if(!list.length){
    box.innerHTML = '<p>No strong matches yet. Try selecting a few different traits.</p>';
    return;
  }
  list.forEach(r => {
    const div = document.createElement('div');
    div.className = 'result';
    const cat = r.category || '—';
    const sum = (r.summary || '').slice(0, 220);
    div.innerHTML = `
      <h4>${r.position_name} <span class="badge">${cat}</span></h4>
      <div>Score: <span class="score">${(r.score*100).toFixed(1)}%</span></div>
      <div style="margin-top:6px; font-size: 13px; color: #475569;">${sum}...</div>
      <div style="margin-top:8px; font-size:12px; color:#64748b;">SOC: ${r.ooh_code}</div>
    `;
    box.appendChild(div);
  });
}

function showStep(id){
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadBrain();
  $('startBtn').addEventListener('click', () => showStep('step-traits'));
  $('clearBtn').addEventListener('click', () => {
    SELECTED = new Set();
    document.querySelectorAll('.trait').forEach(el => el.classList.remove('selected'));
    $('traitCount').textContent = '0 selected';
    $('seeResultsBtn').disabled = true;
  });
  $('seeResultsBtn').addEventListener('click', () => {
    const list = scorePositions();
    renderResults(list);
    showStep('step-results');
  });
  $('backToTraitsBtn').addEventListener('click', () => showStep('step-traits'));
  $('goNaviBtn').addEventListener('click', () => showStep('step-navi'));
  $('backToResultsBtn').addEventListener('click', () => showStep('step-results'));
});
