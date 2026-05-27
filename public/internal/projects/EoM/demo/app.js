const DATA = window.DEMO_RUN.data;
const TOPO = window.DEMO_RUN.topo;
const PROV = { aws: { c: "#f59e0b", l: "AWS" }, gcp: { c: "#2563eb", l: "GCP" }, azure: { c: "#06b6d4", l: "Azure" } };
const ROLE_ORDER = ["planner", "reader", "implementer", "builder", "evaluator", "finalizer"];
const ROLE_COLOR = {
  planner: "#6366f1", reader: "#2563eb", implementer: "#0ca678",
  builder: "#f08c00", evaluator: "#7c3aed", finalizer: "#e8384f",
};
const ROLE_INITIALS = {
  planner: "PLAN", reader: "READ", implementer: "IMPL",
  builder: "BUILD", evaluator: "EVAL", finalizer: "FINAL",
};

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const fmtPct = (frac) => `${frac >= 0 ? "+" : ""}${(Number(frac) * 100).toFixed(1)}%`;
const fmtMoney = (v) => (v == null || Number.isNaN(+v) ? "—" : `$${(+v).toFixed(2)}`);
const roleColor = (r) => ROLE_COLOR[r] || "#8a8a8e";
const roleLabel = (r) => (r ? r[0].toUpperCase() + r.slice(1) : "Agent");

const state = { ep: 0, step: 0, phase: 0, playing: false, timer: null, selectedId: null, intro: true };
const isIntro = () => state.intro;
const LAST_PHASE = 3;                    // beats are 0..3 within a real step
const BEAT_MS = [0, 1200, 2600, 4000];   // cumulative beat offsets (auto-play)
const STEP_MS = 5500;                    // play() interval — must stay > BEAT_MS[3]
const nodes = new Map();
let phaseTimers = [];
let lastPaidKey = null;
const clearPhaseTimers = () => { phaseTimers.forEach(clearTimeout); phaseTimers = []; };

const task = () => DATA.tasks[state.ep];
const isSettle = () => state.step >= task().steps.length;
const curStep = () => (isSettle() ? null : task().steps[state.step]);
const bidVal = (step, id) => (step.bids.find((b) => b.id === id) || {}).bid;

/* ---------- agent cast ---------- */
function castAgents() {
  const t = task();
  const step = curStep();
  if (isIntro()) return DATA.tasks[0].agents; // starting population
  if (!step) return t.agents;
  const map = new Map((t.participantAgents || t.agents).map((a) => [a.id, a]));
  for (const a of t.agents) map.set(a.id, a);
  return Array.from(map.values());
}

/* ---------- layout ---------- */
function spreadRow(list, y, W, pos) {
  const n = list.length;
  const padX = Math.min(W * 0.12, 120);
  list.forEach((a, i) => {
    const x = n === 1 ? W * 0.5 : padX + (i / (n - 1)) * (W - 2 * padX);
    pos.set(a.id, { x, y });
  });
}

function rosterPos(agents, W, H) {
  const pos = new Map();
  const cols = ROLE_ORDER.filter((r) => agents.some((a) => a.role === r));
  cols.forEach((role, ci) => {
    const group = agents.filter((a) => a.role === role);
    const x = W * ((ci + 0.5) / cols.length);
    const gap = 86;
    const offset = ((group.length - 1) * gap) / 2;
    group.forEach((a, gi) => {
      const y = Math.max(74, Math.min(H - 84, H * 0.46 - offset + gi * gap));
      pos.set(a.id, { x, y });
    });
  });
  return pos;
}

// Three tiers, aligned with the left labels at every phase:
//   phase 0 -> everyone in the IDLE tier; phase 1 -> bidders rise to the BIDDERS tier;
//   phase 2 (win) -> winner lifts to the WINNER tier; phase 3 (pay) -> winner stays lifted
//   while the bid flows to the previous actor. Non-bidders stay in IDLE throughout.
const Y_WIN = 0.17, Y_BID = 0.5, Y_IDLE = 0.82;
function computeLayout(agents) {
  const stage = $("stage");
  const W = Math.max(stage.clientWidth, 360);
  const H = Math.max(stage.clientHeight, 380);
  const step = curStep();
  if (isIntro() || !step) { // intro / settle / checkout -> all agents in a single row
    const ordered = agents.slice().sort((a, b) =>
      ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || (a.generation || 0) - (b.generation || 0));
    const pos = new Map();
    spreadRow(ordered, H * 0.5, W, pos);
    return pos;
  }

  const pos = new Map();
  if (state.phase === 0) {
    spreadRow(agents, H * Y_IDLE, W, pos);
    return pos;
  }
  const bidIds = new Set(step.bids.map((b) => b.id));
  const winId = step.winner ? step.winner.id : null;
  const bidders = agents
    .filter((a) => bidIds.has(a.id))
    .sort((a, b) => (bidVal(step, b.id) || 0) - (bidVal(step, a.id) || 0));
  const idle = agents.filter((a) => !bidIds.has(a.id));
  spreadRow(idle, H * Y_IDLE, W, pos);
  spreadRow(bidders, H * Y_BID, W, pos);
  if (state.phase >= 2 && winId != null) pos.set(winId, { x: W * 0.5, y: H * Y_WIN });
  return pos;
}

/* ---------- stage render ---------- */
function renderStage(animateDeltas = false) {
  const agents = castAgents();
  const t = task();
  const step = curStep();
  const pos = computeLayout(agents);
  const ids = new Set(agents.map((a) => a.id));
  const bidIds = new Set(step ? step.bids.map((b) => b.id) : []);
  const winId = step && step.winner ? step.winner.id : null;
  const bornIds = new Set((t.births || []).map((b) => b.id));
  const bidOrder = step ? [...step.bids].sort((a, b) => (b.bid || 0) - (a.bid || 0)).map((b) => b.id) : [];

  const intro = isIntro();
  $("stage").classList.toggle("stepping", !intro && !!step && state.phase >= 1);
  $("stage").classList.toggle("checkout", !intro && !step);
  $("stage").classList.toggle("intro", intro);

  // remove gone nodes
  for (const [id, el] of nodes) {
    if (!ids.has(id)) {
      el.classList.add("dead");
      setTimeout(() => { el.remove(); nodes.delete(id); }, 420);
    }
  }

  for (const a of agents) {
    let el = nodes.get(a.id);
    if (!el) {
      el = document.createElement("button");
      el.type = "button";
      el.addEventListener("click", (e) => { e.stopPropagation(); selectAgent(a.id); });
      el.addEventListener("mouseenter", (e) => showTip(el.__a, e));
      el.addEventListener("mousemove", moveTip);
      el.addEventListener("mouseleave", hideTip);
      $("stage").appendChild(el);
      nodes.set(a.id, el);
      if (!step && bornIds.has(a.id)) el.classList.add("born");
    }
    el.__a = a;
    const p = pos.get(a.id) || { x: 60, y: 60 };
    el.className = "node";
    el.style.setProperty("--c", roleColor(a.role));
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    const isWinner = step && state.phase >= 2 && a.id === winId;
    const isBidding = step && state.phase >= 1 && bidIds.has(a.id) && !isWinner;
    if (step && state.phase >= 1) {
      if (isWinner) el.classList.add("winner");
      else if (bidIds.has(a.id)) el.classList.add("bidding");
      else el.classList.add("idle");
    }
    if (a.id === state.selectedId) el.classList.add("selected");
    if ((a.generation || 0) > 0) el.classList.add("mut");

    // Stagger bidders rising at the bidding beat so the auction reads clearly.
    const order = step && state.phase === 1 && bidIds.has(a.id) ? bidOrder.indexOf(a.id) : -1;
    el.style.transitionDelay = order > 0 ? `${order * 95}ms` : "0ms";

    // Checkout beat: tag each circle with this episode's wealth change (more / less).
    let dlt = 0;
    if (!step) {
      dlt = Number((t.wealthDeltas || {})[String(a.id)] || 0);
      el.classList.add(dlt > 0.005 ? "gain" : dlt < -0.005 ? "loss" : "flatd");
    }

    const bp = isBidding ? bidVal(step, a.id) : null;
    el.innerHTML =
      `<span class="glyph">${esc(ROLE_INITIALS[a.role] || roleLabel(a.role).slice(0, 4).toUpperCase())}</span>` +
      `<span class="idbadge">#${esc(a.id)}</span>` +
      `<span class="wchip">$${(+a.wealth).toFixed(2)}</span>` +
      `<span class="name">${esc(a.name)}</span>` +
      (bp != null ? `<span class="bidpill">bid ${(+bp).toFixed(3)}</span>` : "") +
      (!step
        ? `<span class="deltachip ${dlt > 0.005 ? "up" : dlt < -0.005 ? "down" : "nil"}">` +
          `${dlt > 0.005 ? "+" : dlt < -0.005 ? "−" : "±"}$${Math.abs(dlt).toFixed(2)}</span>`
        : "");
  }

  // Bucket-brigade payment: animate the bid flowing from winner to the previous actor.
  // Only at the dedicated "pay" beat (phase 3) — win (phase 2) just lifts & acts.
  if (step && state.phase >= 3 && step.payment) {
    const key = `${state.ep}:${step.step}`;
    if (key !== lastPaidKey) { lastPaidKey = key; flyPayment(step.payment, pos); }
  } else if (step && state.phase >= 3 && !step.payment && step.step === 1 && step.winner) {
    // First action: no recipient — the winning bid is paid to the void (loss on the winner only).
    const key = `${state.ep}:${step.step}`;
    if (key !== lastPaidKey) { lastPaidKey = key; flyVoidLoss(step.winner.id, bidVal(step, step.winner.id) || 0, pos); }
  }

  // Persistent "Pays to self" tag beside the winner during a self-pay pay beat — stays visible when paused/scrubbed.
  const selfPayId = step && state.phase >= 3 && !step.payment && step.step !== 1 && step.winner ? step.winner.id : null;
  renderSelfPayTag(selfPayId, pos);

  if (animateDeltas && !step) {
    for (const a of agents) {
      const d = Number((t.wealthDeltas || {})[String(a.id)] || 0);
      if (Math.abs(d) < 0.01) continue;
      const p = pos.get(a.id);
      if (!p) continue;
      const b = document.createElement("span");
      b.className = `delta ${d > 0 ? "gain" : "loss"}`;
      b.style.left = `${p.x}px`;
      b.style.top = `${p.y - 40}px`;
      b.textContent = `${d > 0 ? "+" : "−"}$${Math.abs(d).toFixed(2)}`;
      $("stage").appendChild(b);
      setTimeout(() => b.remove(), 1400);
    }
  }
}

function flyPayment(payment, pos) {
  const from = pos.get(payment.fromId);
  const to = pos.get(payment.toId);
  if (!from || !to) return;
  const stage = $("stage");
  const coin = document.createElement("span");
  coin.className = "coin";
  coin.textContent = `$${(+payment.amount).toFixed(3)}`;
  coin.style.left = `${from.x}px`;
  coin.style.top = `${from.y}px`;
  stage.appendChild(coin);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    coin.style.left = `${to.x}px`;
    coin.style.top = `${to.y}px`;
  }));
  setTimeout(() => { coin.style.opacity = "0"; }, 780);
  setTimeout(() => coin.remove(), 1120);
  // payer loses immediately, receiver gains as the coin lands
  const lose = document.createElement("span");
  lose.className = "delta loss";
  lose.style.left = `${from.x}px`;
  lose.style.top = `${from.y - 42}px`;
  lose.textContent = `−$${(+payment.amount).toFixed(3)}`;
  stage.appendChild(lose);
  setTimeout(() => lose.remove(), 1100);
  setTimeout(() => {
    const pop = document.createElement("span");
    pop.className = "delta gain";
    pop.style.left = `${to.x}px`;
    pop.style.top = `${to.y - 42}px`;
    pop.textContent = `+$${(+payment.amount).toFixed(3)}`;
    stage.appendChild(pop);
    setTimeout(() => pop.remove(), 1300);
  }, 760);
}

// First action: show the winning bid as a red loss floating up from the winner — no coin, no recipient.
function flyVoidLoss(winnerId, amount, pos) {
  const p = pos.get(winnerId);
  if (!p || amount <= 0) return;
  const lose = document.createElement("span");
  lose.className = "delta loss";
  lose.style.left = `${p.x}px`;
  lose.style.top = `${p.y - 42}px`;
  lose.textContent = `−$${(+amount).toFixed(3)}`;
  $("stage").appendChild(lose);
  setTimeout(() => lose.remove(), 1400);
}

// Same agent won again — keep a "Pays to self" tag beside the winner for the whole pay beat.
function renderSelfPayTag(winnerId, pos) {
  const tag = $("selfpayTag");
  if (!tag) return;
  const p = winnerId == null ? null : pos.get(winnerId);
  if (!p) { tag.classList.remove("show"); return; } // fade out in place
  const el = nodes.get(winnerId);
  const r = el ? el.offsetWidth / 2 : 55;
  tag.style.left = `${p.x + r + 14}px`;
  tag.style.top = `${p.y}px`;
  tag.classList.add("show");
}

function sparkSvg(series) {
  if (!series || series.length < 2) return "";
  const ws = series.map((p) => p.w);
  const W = 300, H = 42, pad = 3;
  const min = Math.min(...ws), max = Math.max(...ws), rng = (max - min) || 1;
  const n = series.length;
  const xy = series.map((p, i) => [pad + (i / (n - 1)) * (W - 2 * pad), H - pad - ((p.w - min) / rng) * (H - 2 * pad)]);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">` +
    `<path class="area" d="${line} L${W - pad} ${H - pad} L${pad} ${H - pad} Z"/>` +
    `<path class="ln" d="${line}"/></svg>`;
}

/* ---------- detail panel ---------- */
function selectAgent(id) {
  state.selectedId = state.selectedId === id ? null : id;
  renderStage();
  renderDetail();
}

function agentById(id) {
  for (const a of castAgents()) if (a.id === id) return a;
  return null;
}

function renderDetail() {
  const d = $("detail");
  const t = task();
  const step = curStep();

  if (state.selectedId != null) {
    const a = agentById(state.selectedId);
    if (a) {
      const gen = a.generation || 0;
      const genTag = gen > 0
        ? `<span class="gentag" style="--c:${roleColor(a.role)}">gen ${gen} · mutated</span>`
        : `<span class="gentag founder">founder</span>`;
      d.innerHTML =
        `<button class="backbtn" id="backBtn">← step view</button>` +
        `<div><p class="d-eyebrow" style="color:${roleColor(a.role)}">${esc(a.roleLabel || roleLabel(a.role))} · id ${esc(a.id)}</p>` +
        `<h3>${esc(a.name)} ${genTag}</h3></div>` +
        (a.newBehavior
          ? `<div class="mutbox"><p class="section-label">Learned this mutation</p>` +
            `<p class="mut-behavior">${esc(a.newBehavior)}</p>` +
            (a.trigger ? `<p class="mut-trigger"><b>Trigger:</b> ${esc(a.trigger)}</p>` : "") + `</div>`
          : "") +
        `<div class="kv">` +
        `<div class="cell"><label>Wealth</label><span>${fmtMoney(a.wealth)}</span></div>` +
        `<div class="cell"><label>Capability</label><span>${(+a.capability).toFixed(3)}</span></div>` +
        `<div class="cell"><label>Bid</label><span>${a.bid == null ? "—" : (+a.bid).toFixed(3)}</span></div>` +
        `<div class="cell"><label>Status</label><span style="font-size:12.5px">${esc(a.status || "—")}</span></div>` +
        `</div>` +
        (a.parentAgentName
          ? `<p class="section-label">Lineage</p><div class="chip"><span class="cdot" style="background:${roleColor(a.role)}"></span>mutated from ${esc(a.parentAgentName)}</div>`
          : "") +
        (sparkSvg((DATA.wealthSeries || {})[String(a.id)])
          ? `<p class="section-label">Wealth over episodes</p>${sparkSvg((DATA.wealthSeries || {})[String(a.id)])}`
          : "") +
        `<p class="section-label">System prompt</p>` +
        `<div class="prompt">${esc(a.prompt || a.promptPreview || "—")}</div>`;
      $("backBtn").addEventListener("click", () => { state.selectedId = null; renderStage(); renderDetail(); });
      return;
    }
    state.selectedId = null;
  }

  if (isIntro()) {
    d.innerHTML =
      `<div><p class="d-eyebrow">Setup</p><h3>Initial agents</h3>` +
      `<p class="d-narration">The starting population, before any auction. Press play, or use the › control to open the first auction.</p></div>` +
      ledgerHtml();
    for (const r of d.querySelectorAll(".lrow[data-id]"))
      r.addEventListener("click", () => selectAgent(+r.dataset.id));
    return;
  }

  let header;
  if (step) {
    const pay = step.payment;
    let payHtml = "";
    if (state.phase >= 3) {
      if (pay) {
        payHtml = `<div class="payflow"><span class="pf-a"><span class="cdot" style="background:${roleColor(pay.fromRole)}"></span>${esc(shortName2(pay.fromName))} <span class="payamt out">−$${(+pay.amount).toFixed(3)}</span></span>` +
          `<span class="pf-arrow">$ →</span>` +
          `<span class="pf-b"><span class="cdot" style="background:${roleColor(pay.toRole)}"></span>${esc(shortName2(pay.toName))} <span class="payamt in">+$${(+pay.amount).toFixed(3)}</span></span></div>` +
          `<p class="paynote">bucket brigade · the winner pays its bid to the previous actor</p>`;
      } else {
        const w = step.winner;
        const wn = esc(w ? shortName2(w.name) : "winner");
        const wc = roleColor(w ? w.role : "implementer");
        if (step.step === 1) {
          // First action: no previous actor — the winning bid is paid to the void (no flow).
          const bid = (w && bidVal(step, w.id)) || 0;
          payHtml = `<div class="payflow"><span class="pf-a"><span class="cdot" style="background:${wc}"></span>${wn} <span class="payamt out">−$${(+bid).toFixed(3)}</span></span>` +
            `<span class="pf-void">→ void</span></div>` +
            `<p class="paynote">first action — no previous actor, so the winning bid is paid to the void</p>`;
        } else {
          // Same agent won again — the bid loops back to itself.
          payHtml = `<div class="payflow self"><span class="pf-self"><span class="cdot" style="background:${wc}"></span>${wn}</span>` +
            `<svg class="pf-loop" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 1 2.3 5.6"/><path d="M4 20v-5h5"/></svg>` +
            `<span class="pf-self-lbl">Pays to self</span></div>` +
            `<p class="paynote">same agent won again — the bid loops back to itself, so no value changes hands</p>`;
        }
      }
    }
    const title = state.phase === 0 ? "Auction opens"
      : state.phase === 1 ? "Bidding…"
      : state.phase === 2 ? (step.winner ? esc(step.winner.name) + " wins & acts" : "Auction")
      : (step.winner ? esc(step.winner.name) + " pays the bid" : "Payment");
    header = `<div><p class="d-eyebrow">${esc(t.taskId)} · step ${step.step} / ${step.maxSteps}</p><h3>${title}</h3>` +
      `<p class="d-narration">${esc(beatNarration(step, state.phase))}</p></div>` +
      (state.phase >= 2 && step.tool ? `<span class="tool-pill">${esc(step.tool)}()</span>` : "") +
      payHtml +
      (state.phase >= 2 ? `<p class="thought clamp">${esc(step.actionText || step.actionSummary || "—")}</p>` : "");
  } else {
    const evHtml = (t.events || [])
      .map((e) => `<div class="event ${esc(e.type)}"><span class="tag">${esc(e.type)}</span><span>${esc(e.text)}</span></div>`)
      .join("");
    header = `<div><p class="d-eyebrow">${esc(t.taskId)} · settled</p>` +
      `<h3>${t.costNow != null ? fmtPct((t.pctNow || 0) / 100) + " vs seed" : "rolled back"}</h3>` +
      `<p class="d-narration">${esc(beatNarration(null))}</p></div>` +
      (evHtml ? `<div class="events">${evHtml}</div>` : "");
  }
  d.innerHTML = header + ledgerHtml();
  for (const r of d.querySelectorAll(".lrow[data-id]"))
    r.addEventListener("click", () => selectAgent(+r.dataset.id));
}

// Plain-language description of what each beat means — the agent-to-agent communication.
function beatNarration(step, phase) {
  if (!step) return "Episode settled — wealth and population update; survivors carry their credit forward.";
  const win = step.winner ? shortName2(step.winner.name) : "the winner";
  switch (phase) {
    case 0: return "Auction opens — every solvent agent may bid for the right to act on this step.";
    case 1: return "Bidding — agents stake their own wealth on acting; higher confidence, higher bid.";
    case 2: return `${win} wins the auction and takes the action${step.tool ? ` via ${step.tool}()` : ""}.`;
    default: return step.payment
      ? `Bucket brigade — ${win} pays its winning bid to ${shortName2(step.payment.toName)}, the previous actor. Credit flows backward to whoever set up this move.`
      : (step.step === 1
          ? "First action of the episode — no previous actor, so the winning bid is paid to the void."
          : "Same agent won again, so it pays to self — the bid loops back and no value changes hands.");
  }
}

function shortName2(n) {
  const m = String(n).match(/^([A-Za-z]+)Agent-(\d+)$/);
  return m ? `${m[1]}-${m[2]}` : n;
}

function ledgerHtml() {
  const t = task();
  const step = curStep();
  const agents = t.agents.slice().sort((a, b) =>
    ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || (a.generation || 0) - (b.generation || 0));
  const maxW = Math.max(0.5, ...agents.map((a) => a.wealth));
  const bornIds = new Set((t.births || []).map((b) => b.id));
  const pay = step && state.phase >= 3 ? step.payment : null;
  const winId = step && state.phase >= 2 && step.winner ? step.winner.id : null;

  const rows = agents.map((a) => {
    const pctw = Math.min(100, (Math.max(0, a.wealth) / maxW) * 100);
    const badge = bornIds.has(a.id) ? `<span class="lbadge new">new</span>`
      : (a.generation > 0 ? `<span class="lbadge gen" style="--c:${roleColor(a.role)}">g${a.generation}</span>` : "");
    let cls = "lrow", extra = "";
    if (a.id === winId) cls += " acting";
    if (pay && a.id === pay.fromId) { cls += " pay-out"; extra = `<span class="ldelta out">−$${(+pay.amount).toFixed(3)}</span>`; }
    if (pay && a.id === pay.toId) { cls += " pay-in"; extra = `<span class="ldelta in">+$${(+pay.amount).toFixed(3)}</span>`; }
    return `<button class="${cls}" data-id="${a.id}" title="${esc(a.name)}">` +
      `<span class="lcdot" style="background:${roleColor(a.role)}"></span>` +
      `<span class="lname">${esc(shortName2(a.name))}</span>${badge}` +
      `<span class="lbarwrap"><span class="lbar" style="width:${pctw.toFixed(0)}%;background:${roleColor(a.role)}"></span></span>` +
      `<span class="lwealth">${fmtMoney(a.wealth)}</span>${extra}</button>`;
  }).join("");

  // Cumulative bankruptcies: keep every agent that ever went out, pinned at the bottom.
  const seenDead = new Set();
  const cumDead = [];
  for (let i = 0; i <= state.ep; i++) {
    for (const de of (DATA.tasks[i].deaths || [])) {
      if (!seenDead.has(de.name)) { seenDead.add(de.name); cumDead.push({ ...de, diedEp: i }); }
    }
  }
  const justDiedThisEp = new Set((t.deaths || []).map((d) => d.name));
  const dead = cumDead.map((de) => {
    const recent = justDiedThisEp.has(de.name) ? " recent" : "";
    return `<div class="lrow dead${recent}" title="bankrupt at episode ${de.diedEp}">` +
      `<span class="lcdot" style="background:${roleColor(de.roleKey)}"></span>` +
      `<span class="lname">${esc(shortName2(de.name))}</span>` +
      `<span class="lbadge out">out · ep${de.diedEp}</span>` +
      `<span class="lbarwrap"></span><span class="lwealth neg">${fmtMoney(de.lastWealth)}</span></div>`;
  }).join("");

  return `<p class="section-label ledger-title">Agent economy · ${agents.length} alive` +
    (cumDead.length ? ` · ${cumDead.length} bankrupt` : "") + `</p>` +
    `<div class="ledger">${rows}` +
    (dead ? `<div class="ledger-sep">bankrupt (kept on record)</div>${dead}` : "") +
    `</div>`;
}

/* ---------- header / metrics / dock ---------- */
function renderHeader() {
  $("runTitle").textContent = "CloudCast";
  $("runSubtitle").textContent = DATA.run.subtitle;
  const t = task();
  $("mBest").textContent = fmtPct(t.bestScoreEver || 0);
  let muts = 0;
  for (let i = 0; i <= state.ep; i++) muts += DATA.tasks[i].mutationCount || 0;
  if ($("mMut")) $("mMut").textContent = muts;
  $("mPop").textContent = t.populationAfter;
  $("mRoll").textContent = t.rollbacksDone ?? 0;
}

let lastBestEp = -1;
function renderStageHead() {
  const t = task();
  const step = curStep();
  const intro = isIntro();
  $("epTitle").textContent = intro ? "Setup" : `Episode ${t.index}`;

  // phase stepper: idle -> bid -> win -> pay (active dot colored by the eventual winner)
  const ph = intro ? -1 : step ? state.phase : 4;
  const stepperEl = $("phase");
  stepperEl.style.setProperty("--c", roleColor(step && step.winner ? step.winner.role : "implementer"));
  const labels = ["idle", "bid", "win", "pay", "checkout"];
  stepperEl.innerHTML = labels
    .map((lb, i) => {
      const cls = i < ph ? "done" : i === ph ? "active" : "";
      return `<span class="pstep ${cls}"><i></i>${lb}</span>` + (i < labels.length - 1 ? `<span class="parrow"></span>` : "");
    })
    .join("");

  // performance hero: best-so-far, with a delta when this episode set a new best
  const num = $("perfNum");
  if (intro) {
    num.textContent = "—";
    num.classList.add("flat");
    $("perfSub").innerHTML = "ready to start";
    return;
  }
  const best = t.bestScoreEver || 0;
  const prevBest = state.ep > 0 ? (DATA.tasks[state.ep - 1].bestScoreEver || 0) : 0;
  const improved = best > prevBest + 1e-6;
  num.textContent = fmtPct(best);
  num.classList.toggle("flat", best <= 0);
  if (improved && state.ep !== lastBestEp) {
    num.classList.remove("bump"); void num.offsetWidth; num.classList.add("bump");
    lastBestEp = state.ep;
  }
  $("perfSub").innerHTML = improved
    ? `<span class="up">▲ +${((best - prevBest) * 100).toFixed(1)}% new best</span>`
    : t.terminalScore == null ? "rolled back · kept best"
    : `this episode ${fmtPct((t.pctNow || 0) / 100)}`;
}

function renderDock() {
  const t = task();
  const total = DATA.tasks.length;
  const step = curStep();
  $("progressText").textContent = isIntro() ? "Setup" : `Episode ${state.ep + 1} / ${total}`;
  $("stepText").textContent = isIntro() ? "initial agents" : step ? `step ${step.step} / ${step.maxSteps}` : "settled";
  $("playLabel").textContent = state.playing ? "Pause" : "Play";
  $("playIcon").innerHTML = state.playing ? `<path d="M7 5h3v14H7zM14 5h3v14h-3z"/>` : `<path d="M8 5l11 7-11 7z"/>`;

  const pts = DATA.charts.test.map((r) => r.accuracy);
  const W = 600, H = 44, pad = 3;
  const max = Math.max(...pts, 0.001);
  const n = pts.length;
  const xy = pts.map((v, i) => [pad + (i / (n - 1)) * (W - 2 * pad), H - pad - (v / max) * (H - 2 * pad)]);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [cx, cy] = xy[state.ep];
  $("curve").innerHTML =
    `<path class="area" d="${line} L${W - pad} ${H - pad} L${pad} ${H - pad} Z"/>` +
    `<path class="ln" d="${line}"/><circle class="mk" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3"/>`;
}

function renderTimeline() {
  const tl = $("timeline");
  const pts = DATA.charts.test.map((r) => r.accuracy);
  const max = Math.max(...pts, 0.001);
  tl.innerHTML = DATA.tasks
    .map((t, i) => {
      const h = Math.max(0.1, pts[i] / max) * 100;
      const cls = ["ep", i === state.ep ? "cur" : "", t.success ? "done" : "rollback"].join(" ");
      const mut = t.mutationCount ? `<i class="mut" title="${t.mutationCount} agent(s) born"></i>` : "";
      const title = `Episode ${t.index} · ${fmtPct(t.bestScoreEver || 0)} · pop ${t.populationAfter}` +
        (t.mutationCount ? ` · ${t.mutationCount} mutated` : "");
      return `<button class="${cls}" data-ep="${i}" title="${title}">${mut}<span class="bar" style="height:${h}%"></span></button>`;
    })
    .join("");
  for (const b of tl.querySelectorAll("button")) {
    b.addEventListener("click", () => { stop(); state.intro = false; state.ep = +b.dataset.ep; state.step = 0; state.selectedId = null; gotoPhase(0); });
  }
}

/* ---------- program diff modal ---------- */
function lineDiff(prevText, curText) {
  const a = (prevText || "").split("\n");
  const b = (curText || "").split("\n");
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { out.push(["ctx", b[j]]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push(["del", a[i]]); i++; }
    else { out.push(["add", b[j]]); j++; }
  }
  while (i < m) out.push(["del", a[i++]]);
  while (j < n) out.push(["add", b[j++]]);
  return out;
}

function regionProv(n) { return TOPO && TOPO.regions[n] ? TOPO.regions[n].provider : (n.split(":")[0] || ""); }
function regionLab(n) { return TOPO && TOPO.regions[n] ? TOPO.regions[n].label : n; }

function renderModalTopo(epIdx) {
  if (!TOPO) return;
  const ep = TOPO.episodes[epIdx];
  if (!ep) { $("modalTopo").innerHTML = ""; return; }
  const SRC = TOPO.scenario.src, DSTS = new Set(TOPO.scenario.dsts);
  const W = 716, H = 232, padX = 74, padY = 26;
  const nodes = new Set(ep.nodes); nodes.add(SRC);
  const list = [...nodes];
  const adj = new Map(list.map((n) => [n, []])), indeg = new Map(list.map((n) => [n, 0]));
  for (const e of ep.edges) if (adj.has(e.u) && adj.has(e.v)) { adj.get(e.u).push(e.v); indeg.set(e.v, indeg.get(e.v) + 1); }
  const depth = new Map(list.map((n) => [n, 0]));
  const q = list.filter((n) => indeg.get(n) === 0), ind2 = new Map(indeg);
  while (q.length) { const u = q.shift(); for (const v of adj.get(u)) { depth.set(v, Math.max(depth.get(v), depth.get(u) + 1)); ind2.set(v, ind2.get(v) - 1); if (ind2.get(v) === 0) q.push(v); } }
  let maxD = 0; for (const dd of depth.values()) maxD = Math.max(maxD, dd); if (!maxD) maxD = 1;
  const cols = new Map();
  for (const n of list) { const d = depth.get(n); if (!cols.has(d)) cols.set(d, []); cols.get(d).push(n); }
  const pos = new Map();
  for (const [d, g] of cols) {
    g.sort((a, b) => regionProv(a).localeCompare(regionProv(b)) || a.localeCompare(b));
    const x = padX + (d / maxD) * (W - 2 * padX);
    g.forEach((n, i) => pos.set(n, { x, y: g.length === 1 ? H / 2 : padY + (i / (g.length - 1)) * (H - 2 * padY) }));
  }
  const provC = (n) => (PROV[regionProv(n)] || { c: "#888" }).c;
  const ecol = (c) => (c >= 0.08 ? "#e3675f" : c <= 0.025 ? "#34b27a" : "#e0a43a");
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="mt-svg" preserveAspectRatio="xMidYMid meet"><defs><marker id="mtarrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>`;
  for (const e of ep.edges) {
    const a = pos.get(e.u), b = pos.get(e.v); if (!a || !b) continue;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, cv = Math.min(24, len * 0.12);
    svg += `<path d="M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${(mx - (dy / len) * cv).toFixed(1)} ${(my + (dx / len) * cv).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}" fill="none" stroke="${ecol(e.cost)}" stroke-width="1.6" marker-end="url(#mtarrow)" opacity="0.9"/>`;
  }
  for (const n of list) {
    const p = pos.get(n), isSrc = n === SRC, isDst = DSTS.has(n), r = isSrc ? 9 : 7;
    svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="${provC(n)}" stroke="#fff" stroke-width="2"/>`;
    if (isSrc || isDst) svg += `<text x="${p.x.toFixed(1)}" y="${(p.y - 12).toFixed(1)}" class="mt-tag">${isSrc ? "SRC" : "DST"}</text>`;
    svg += `<text x="${p.x.toFixed(1)}" y="${(p.y + (isSrc ? 21 : 19)).toFixed(1)}" class="mt-label">${esc(regionLab(n))}</text>`;
  }
  svg += `</svg>`;
  $("modalTopo").innerHTML = svg;
  $("topoMeta").textContent = `· ${ep.edges.length} links · cost ${ep.scenarioCost} · ${TOPO.scenario.title}`;
  $("modalTopoLegend").innerHTML = Object.values(PROV).map((p) => `<span><i style="background:${p.c}"></i>${p.l}</span>`).join("") + `<span class="mt-hint">link color = $/GB (green→red)</span>`;
}

function openProgram() {
  stop();
  const t = task();
  const prev = state.ep > 0 ? DATA.tasks[state.ep - 1] : null;
  const cur = t.programBlock || "";
  const diff = prev ? lineDiff(prev.programBlock || "", cur) : cur.split("\n").map((l) => ["ctx", l]);
  const adds = diff.filter((d) => d[0] === "add").length;
  const dels = diff.filter((d) => d[0] === "del").length;
  $("progEyebrow").textContent = `${t.taskId} · EVOLVE block`;
  $("progTitle").textContent = (adds || dels)
    ? `What changed vs ${prev.taskId}`
    : (t.rollbackDelta || 0) > 0
      ? `No net change — explored, then rolled back ${t.rollbackDelta}× to the best snapshot`
      : "No net change — no edit beat the persisted best this episode";
  $("progStat").innerHTML =
    `<span class="add">+${adds}</span><span class="del">−${dels}</span>` +
    `<span>${cur.split("\n").length} lines</span>`;
  $("progDiff").innerHTML = diff
    .map(([tag, txt]) => {
      const g = tag === "add" ? "+" : tag === "del" ? "−" : " ";
      return `<span class="ln ${tag}"><span class="gutter">${g}</span>${esc(txt) || " "}</span>`;
    })
    .join("");
  renderModalTopo(state.ep);
  $("progModal").hidden = false;
}
function closeProgram() { $("progModal").hidden = true; }

/* ---------- tooltip ---------- */
function showTip(a, e) {
  const tip = $("tooltip");
  tip.innerHTML = `<b>${esc(a.name)}</b><br><span class="muted">${esc(a.roleLabel || roleLabel(a.role))} · wealth ${fmtMoney(a.wealth)}</span><br><span class="muted">click for prompt & economics</span>`;
  tip.hidden = false;
  moveTip(e);
}
function moveTip(e) {
  const tip = $("tooltip");
  if (tip.hidden) return;
  const pad = 14;
  tip.style.left = `${Math.max(pad, Math.min(window.innerWidth - tip.offsetWidth - pad, e.clientX + 14))}px`;
  tip.style.top = `${Math.max(pad, Math.min(window.innerHeight - tip.offsetHeight - pad, e.clientY + 14))}px`;
}
function hideTip() { $("tooltip").hidden = true; }

/* ---------- render ---------- */
function paint(animateDeltas = false) {
  renderHeader();
  renderStageHead();
  renderStage(animateDeltas);
  renderDetail();
  renderDock();
}
function render(animateDeltas = false) {
  paint(animateDeltas);
  renderTimeline();
}

// Set phase `p` of the current step and render — does NOT touch the beat timers,
// so it is safe to call from the scheduled auto-play sequence.
function applyPhase(p, animateDeltas = false) {
  const step = curStep();
  state.phase = step ? Math.max(0, Math.min(LAST_PHASE, p)) : 0;
  render(step ? false : animateDeltas);
}
// Park on phase `p`, cancelling any pending auto-play beats — for manual stepping.
function gotoPhase(p, animateDeltas = false) {
  clearPhaseTimers();
  applyPhase(p, animateDeltas);
}
// Auto-play one step in four beats: idle -> bidding -> winner acts -> winner pays.
function animateStep() {
  clearPhaseTimers();
  state.intro = false; // playing leaves the initial-agents screen
  const step = curStep();
  if (!step) { applyPhase(0, true); return; } // settle -> wealth deltas
  applyPhase(0);
  for (let p = 1; p <= LAST_PHASE; p++)
    phaseTimers.push(setTimeout(() => applyPhase(p), BEAT_MS[p]));
}
/* ---------- navigation ---------- */
// One beat forward: within a step 0->1->2->3, then across to the next step / episode.
function nextBeat() {
  if (isIntro()) { state.intro = false; gotoPhase(0); return; } // open the first auction
  const step = curStep();
  if (step && state.phase < LAST_PHASE) { gotoPhase(state.phase + 1); return; }
  const t = task();
  if (state.step < t.steps.length) { state.step += 1; gotoPhase(0); }
  else if (state.ep < DATA.tasks.length - 1) { state.ep += 1; state.step = 0; gotoPhase(0); }
  else stop();
}
// One beat back, symmetric.
function prevBeat() {
  if (isIntro()) return; // already at the very beginning
  const step = curStep();
  if (step && state.phase > 0) { gotoPhase(state.phase - 1); return; }
  if (state.step > 0) { state.step -= 1; gotoPhase(LAST_PHASE); }
  else if (state.ep > 0) { state.ep -= 1; state.step = task().steps.length; gotoPhase(LAST_PHASE); }
  else { state.intro = true; gotoPhase(0); } // back into the initial-agents screen
}
// Whole-step advance used by auto-play.
function advanceStep() {
  const t = task();
  if (state.step < t.steps.length) { state.step += 1; animateStep(); }
  else if (state.ep < DATA.tasks.length - 1) { state.ep += 1; state.step = 0; animateStep(); }
  else stop();
}
function reset() {
  stop();
  clearPhaseTimers();
  state.ep = 0; state.step = 0; state.selectedId = null; state.intro = true;
  lastBestEp = -1; lastPaidKey = null;
  gotoPhase(0);
}
function stop() {
  if (state.timer) clearInterval(state.timer);
  clearPhaseTimers(); // freeze on the current beat instead of running out the step
  state.timer = null; state.playing = false; renderDock();
}
function play() {
  if (state.playing) return stop();
  state.playing = true; renderDock();
  animateStep();
  state.timer = setInterval(() => {
    const last = state.ep >= DATA.tasks.length - 1 && state.step >= task().steps.length;
    if (last) return stop();
    advanceStep();
  }, STEP_MS);
}

/* ---------- wire ---------- */
$("playBtn").addEventListener("click", play);
$("prevBtn").addEventListener("click", () => { stop(); prevBeat(); });
$("nextBtn").addEventListener("click", () => { stop(); nextBeat(); });
$("resetBtn").addEventListener("click", reset);
$("progBtn").addEventListener("click", openProgram);
$("progClose").addEventListener("click", closeProgram);
$("progModal").addEventListener("click", (e) => { if (e.target.id === "progModal") closeProgram(); });
$("stage").addEventListener("click", () => { if (state.selectedId != null) { state.selectedId = null; renderStage(); renderDetail(); } });
window.addEventListener("resize", () => renderStage());
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeProgram(); return; }
  if (!$("progModal").hidden) return;
  if (e.key === "ArrowRight") { stop(); nextBeat(); }
  else if (e.key === "ArrowLeft") { stop(); prevBeat(); }
  else if (e.key === " ") { e.preventDefault(); play(); }
});

gotoPhase(0);
setTimeout(play, 2400);
