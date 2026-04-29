import { DB, csmWorkload } from './data.js';
import { getScoreDetails, calcScore, getDays, getChurnRisk } from './score.js';

let activeTab = 'all', sortCol = 'score', sortAsc = false, supportPeriod = 'all';

/* Écrit l'état courant des filtres dans l'URL sans rechargement */
function syncURL() {
  const params = new URLSearchParams();
  const search = document.getElementById('si').value;
  const csm    = document.getElementById('fi-csm').value;
  const kam    = document.getElementById('fi-kam').value;
  const tier   = document.getElementById('fi-tier').value;
  const health = document.getElementById('fi-health').value;
  if (search) params.set('search', search);
  if (csm)    params.set('csm', csm);
  if (kam)    params.set('kam', kam);
  if (tier)   params.set('tier', tier);
  if (health) params.set('health', health);
  if (activeTab !== 'all') params.set('tab', activeTab);
  const qs = params.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}

/* Lit location.search au chargement et hydrate les filtres + onglet actif */
function loadFromURL() {
  const p = new URLSearchParams(location.search);
  document.getElementById('si').value       = p.get('search') || '';
  document.getElementById('fi-csm').value   = p.get('csm')    || '';
  document.getElementById('fi-kam').value   = p.get('kam')    || '';
  document.getElementById('fi-tier').value  = p.get('tier')   || '';
  document.getElementById('fi-health').value = p.get('health') || '';
  activeTab = p.get('tab') || 'all';
  ['all', 'churn', 'renew', 'exp', 'ai'].forEach(x =>
    document.getElementById('tab-' + x).classList.toggle('on', x === activeTab)
  );
}

/* Remet tous les filtres à zéro et nettoie l'URL + identité */
function resetFilters() {
  document.getElementById('si').value        = '';
  document.getElementById('fi-csm').value    = '';
  document.getElementById('fi-kam').value    = '';
  document.getElementById('fi-tier').value   = '';
  document.getElementById('fi-health').value = '';
  localStorage.removeItem('currentUser');
  document.getElementById('user-select').value = '';
  document.getElementById('admin-btn').style.display = 'none';
  activeTab = 'all';
  ['all', 'churn', 'renew', 'exp', 'ai'].forEach(x =>
    document.getElementById('tab-' + x).classList.toggle('on', x === 'all')
  );
  history.replaceState(null, '', location.pathname);
  drawTable();
  renderPriorities();
}

/* Sélection "Je suis…" : stocke l'identité et applique le filtre CSM */
function applyCurrentUser(name) {
  if (name) {
    localStorage.setItem('currentUser', name);
    document.getElementById('admin-btn').style.display = '';
  } else {
    localStorage.removeItem('currentUser');
    document.getElementById('admin-btn').style.display = 'none';
  }
  document.getElementById('fi-csm').value = name;
  drawTable();
  renderPriorities();
}

/* Bouton "Vue globale" : retire le filtre CSM sans effacer l'identité (au prochain reload, la vue personnelle revient) */
function setAdminView() {
  document.getElementById('fi-csm').value = '';
  drawTable();
  renderPriorities();
}

const sc = s => s >= 70 ? 'var(--green)' : s >= 40 ? 'var(--amber)' : 'var(--red)';
const rc = r => r >= 50 ? 'var(--red)' : r >= 30 ? 'var(--amber)' : 'var(--green)';
const bl = s => s >= 70 ? 'Sain' : s >= 40 ? 'Vigilance' : 'Risque';
const tchip = t => t === 'Premium' ? 'cp' : t === 'Standard' ? 'cs' : 'cl';
const pct = (u, c) => Math.min(Math.round(u / c * 100), 150);
const uc = p => p > 100 ? 'var(--green)' : p > 80 ? 'var(--amber)' : 'var(--blue)';
function tr2(v) { return v > 0 ? `<span class="tu">↗ +${v}</span>` : v < 0 ? `<span class="td2">↘ ${v}</span>` : `<span class="teq">→ =</span>`; }
function si2(col) { if (sortCol !== col) return `<span style="color:var(--slate);font-size:10px;margin-left:3px;opacity:.5;">↕</span>`; return sortAsc ? `<span style="color:var(--peach);font-size:10px;margin-left:3px;">↑</span>` : `<span style="color:var(--peach);font-size:10px;margin-left:3px;">↓</span>`; }
function qa(action, name, e) { e.stopPropagation(); alert(`[Demo HubSpot] "${action}" → ${name}`); }
function toggleSort(col) { sortAsc = sortCol === col ? !sortAsc : col === 'name'; sortCol = col; drawTable(); }

function filterSupport(arr, c) {
  if (supportPeriod === 'all') return arr.length;
  const days = supportPeriod === 'meet' ? c.meet : parseInt(supportPeriod);
  const cutoff = Date.now() - days * 86400000;
  return arr.filter(e => new Date(e.date).getTime() >= cutoff).length;
}

function setSupportPeriod(val) {
  supportPeriod = val;
  const wrap = document.getElementById('fi-period-wrap');
  if (wrap) wrap.classList.toggle('active', val !== 'all');
  drawTable();
}

function setTab(t) {
  activeTab = t;
  ['all', 'churn', 'renew', 'exp', 'ai'].forEach(x => document.getElementById('tab-' + x).classList.toggle('on', x === t));
  drawTable();
}

function drawTable() {
  const isPortfolio = activeTab === 'all';
  document.getElementById('kstrip').style.display   = isPortfolio ? '' : 'none';
  document.getElementById('overview').style.display = isPortfolio ? '' : 'none';
  const periodWrap = document.getElementById('support-period-wrap');
  if (periodWrap) periodWrap.style.display = (activeTab === 'ai' || activeTab === 'exp') ? 'none' : '';

  const search = document.getElementById('si').value.toLowerCase();
  const csmF = document.getElementById('fi-csm').value;
  const kamF = document.getElementById('fi-kam').value;
  const tierF = document.getElementById('fi-tier').value;
  const hlF = document.getElementById('fi-health').value;
  syncURL();
  updateFilterBar();

  let data = DB.filter(c => c.name.toLowerCase().includes(search) && (!csmF || c.csm === csmF) && (!kamF || c.kam === kamF) && (!tierF || c.tier === tierF));
  if (hlF) data = data.filter(c => { const s = calcScore(c); return hlF === 'g' ? s >= 70 : hlF === 'a' ? s >= 40 && s < 70 : s < 40; });
  if (activeTab === 'churn') data = data.filter(c => getChurnRisk(c, calcScore(c)).tot >= 50);
  if (activeTab === 'renew') data = data.filter(c => getDays(c.end) <= 120);
  if (activeTab === 'exp')   data = data.filter(c => calcScore(c) >= 70 || c.seatsUsed > c.seatsContract || c.creditsUsed > c.creditsContract);
  data.sort((a, b) => {
    if (sortCol === 'name')  return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    if (sortCol === 'score') return sortAsc ? calcScore(a) - calcScore(b) : calcScore(b) - calcScore(a);
    if (sortCol === 'risk')  return sortAsc ? getChurnRisk(a, calcScore(a)).tot - getChurnRisk(b, calcScore(b)).tot : getChurnRisk(b, calcScore(b)).tot - getChurnRisk(a, calcScore(a)).tot;
    if (sortCol === 'mrr')   return sortAsc ? a.mrr - b.mrr : b.mrr - a.mrr;
    return 0;
  });
  updateCharts(data, csmF);

  const allC = DB.filter(c => getChurnRisk(c, calcScore(c)).tot >= 50).length;
  const allR = DB.filter(c => getDays(c.end) <= 120).length;
  const avg = data.length ? Math.round(data.reduce((a, c) => a + calcScore(c), 0) / data.length) : 0;
  const greens = DB.filter(c => calcScore(c) >= 70).length;
  const ambers = DB.filter(c => { const s = calcScore(c); return s >= 40 && s < 70; }).length;
  const reds   = DB.filter(c => calcScore(c) < 40).length;
  const ups    = DB.filter(c => c.seatsUsed > c.seatsContract || c.creditsUsed > c.creditsContract).length;

  document.getElementById('hk-churn').textContent = allC;
  document.getElementById('hk-renew').textContent = allR;
  document.getElementById('hk-score').innerHTML = `${avg}<sup>/100</sup>`;
  document.getElementById('pill-churn').textContent = allC;
  document.getElementById('pill-renew').textContent = allR;
  document.getElementById('kp-tot').textContent = DB.length;
  document.getElementById('kp-g').textContent = greens;
  document.getElementById('kp-gp').textContent = `${Math.round(greens / DB.length * 100)}% du portefeuille`;
  document.getElementById('kp-a').textContent = ambers;
  document.getElementById('kp-ap').textContent = `${Math.round(ambers / DB.length * 100)}% du portefeuille`;
  document.getElementById('kp-r').textContent = reds;
  document.getElementById('kp-rp').textContent = `${Math.round(reds / DB.length * 100)}% du portefeuille`;
  document.getElementById('kp-up').textContent = ups;

  const thead = document.getElementById('thead');
  if (activeTab === 'ai') {
    thead.innerHTML = `<tr><th class="s" onclick="toggleSort('name')">Client ${si2('name')}</th><th>Tier / Équipe</th><th style="text-align:center">🤖 Assistant IA</th><th style="text-align:center">🎽 Coach IA</th><th style="text-align:center">Health Score</th><th></th></tr>`;
  } else if (activeTab === 'exp') {
    thead.innerHTML = `<tr><th class="s" onclick="toggleSort('name')">Client ${si2('name')}</th><th>Tier / Équipe</th><th class="s" onclick="toggleSort('score')">Health Score ${si2('score')}</th><th class="s" onclick="toggleSort('mrr')">MRR ${si2('mrr')}</th><th>Sièges</th><th>Crédits</th><th></th></tr>`;
  } else {
    thead.innerHTML = `<tr><th class="s" onclick="toggleSort('name')">Client ${si2('name')}</th><th>Tier / Équipe</th><th class="s" onclick="toggleSort('score')">Health Score ${si2('score')}</th><th class="s" onclick="toggleSort('risk')">Risque Churn ${si2('risk')}</th><th>Fin de contrat</th><th>Dernier RDV</th><th>Conversations</th><th>Tickets</th><th></th></tr>`;
  }

  const tbody = document.getElementById('tbody');
  const em = document.getElementById('empty');
  tbody.innerHTML = '';
  if (!data.length) { em.style.display = 'block'; return; }
  em.style.display = 'none';

  data.forEach(c => {
    const d = getScoreDetails(c), s = d.tot, ro = getChurnRisk(c, s), r = ro.tot, dl = getDays(c.end);
    const scolor = sc(s), rcolor = rc(r);
    const namecell = `<td><div style="font-size:15px;font-weight:700;letter-spacing:-.2px;">${c.name}</div><div style="font-size:10px;color:var(--slate);margin-top:2px;">${c.nps != null ? `NPS · <b style="color:${c.nps >= 60 ? 'var(--green)' : c.nps >= 40 ? 'var(--amber)' : 'var(--red)'};">${c.nps}</b>` : 'NPS · n/a'}</div></td>`;
    const teamcell = `<td><div class="cell-team"><span class="chip ${tchip(c.tier)}">${c.tier}</span><span class="cell-csm">${c.csm}</span><span class="cell-kam">KAM: ${c.kam}</span></div></td>`;
    const stip = `<div class="tb"><div class="tt">Détail Health Score</div><div class="tr"><span style="color:var(--peach)">Account Pulse</span><span class="tv">${d.pp}/20</span></div><div class="tr"><span style="color:var(--peach)">Engagement</span><span class="tv">${d.ep}/40</span></div><div class="tr"><span style="color:var(--peach)">Relation</span><span class="tv">${d.rp}/30</span></div><div class="tr"><span style="color:var(--peach)">Proactivité</span><span class="tv">${d.pro}/10</span></div><div class="ttot"><span style="color:var(--peach)">Total</span><span style="color:#fff">${s}/100</span></div></div>`;
    const scorecell = `<td><div class="tw" style="gap:7px;"><span class="cell-score" style="color:${scolor};">${s}</span><span style="font-size:10px;color:var(--slate);">/100</span>${tr2(c.trend)}<div class="sbar"><div class="sbarf" style="width:${s}%;background:${scolor};"></div></div>${stip}</div></td>`;
    const rtip = `<div class="tb"><div class="tt">Pondération du risque</div><div class="tr"><span style="color:var(--peach)">Santé dégradée</span><span class="tv">${ro.hr}/60</span></div><div class="tr"><span style="color:var(--peach)">Urgence (${ro.dy}j restants)</span><span class="tv">${ro.tr}/40</span></div><div class="ttot"><span style="color:var(--peach)">Risque total</span><span style="color:#fff">${r}/100</span></div></div>`;
    const riskcell = `<td><div class="tw" style="gap:7px;"><span class="cell-score" style="color:${rcolor};">${r}</span><span style="font-size:10px;color:var(--slate);">/100</span><div class="sbar"><div class="sbarf" style="width:${r}%;background:${rcolor};"></div></div>${rtip}</div></td>`;
    const qa_html = `<td style="text-align:right;"><button class="ctab" onclick="openDetails('${c.id}',event)">Détails →</button></td>`;
    const row = document.createElement('tr');
    row.onclick = () => openDetails(c.id);
    if (activeTab === 'ai') {
      const aic = c.aiAct ? `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;"><span class="badge bg">Activé</span><span style="font-size:12px;font-weight:600;">${c.aiMsg} msg/u</span></div>` : `<span class="badge" style="background:var(--bg);color:var(--slate);">Inactif</span>`;
      const coc = c.coachAct ? `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;"><span class="badge bp">Activé</span><span style="font-size:12px;font-weight:600;">${c.coachMsg} msg/u</span></div>` : `<span class="badge" style="background:var(--bg);color:var(--slate);">Inactif</span>`;
      const sbadge = s >= 70 ? 'bg' : s >= 40 ? 'ba' : 'br';
      row.innerHTML = namecell + teamcell + `<td style="text-align:center">${aic}</td><td style="text-align:center">${coc}</td><td style="text-align:center"><span class="badge ${sbadge}">${s}/100</span></td>` + qa_html;
    } else if (activeTab === 'exp') {
      const mrrcell = `<td><span class="mono" style="font-size:13px;font-weight:600;">${c.mrr.toLocaleString('fr-FR')} €</span></td>`;
      const sp2 = pct(c.seatsUsed, c.seatsContract), cp2 = pct(c.creditsUsed, c.creditsContract);
      const seatcell = `<td><div style="font-size:12px;margin-bottom:4px;"><b style="color:${uc(sp2)}">${c.seatsUsed.toLocaleString('fr-FR')}</b> / ${c.seatsContract.toLocaleString('fr-FR')}${sp2 > 100 ? '<span class="upsell">Upsell</span>' : ''}</div><div style="display:flex;align-items:center;gap:5px;"><div class="ubar"><div class="ubarf" style="width:${Math.min(sp2, 100)}%;background:${uc(sp2)};"></div></div><span style="font-size:10px;color:var(--slate);">${sp2}%</span></div></td>`;
      const credcell = `<td><div style="font-size:12px;margin-bottom:4px;"><b style="color:${uc(cp2)}">${c.creditsUsed.toLocaleString('fr-FR')}</b> / ${c.creditsContract.toLocaleString('fr-FR')}${cp2 > 100 ? '<span class="upsell">Upsell</span>' : ''}</div><div style="display:flex;align-items:center;gap:5px;"><div class="ubar"><div class="ubarf" style="width:${Math.min(cp2, 100)}%;background:${uc(cp2)};"></div></div><span style="font-size:10px;color:var(--slate);">${cp2}%</span></div></td>`;
      row.innerHTML = namecell + teamcell + scorecell + mrrcell + seatcell + credcell + qa_html;
    } else {
      const endAlert = dl <= 30 ? `<span class="badge br" style="margin-left:5px;font-size:9px;">${dl}j !</span>` : dl <= 120 ? `<span class="badge ba" style="margin-left:5px;font-size:9px;">${dl}j</span>` : '';
      const endcell = `<td><span style="font-size:12px;font-weight:500;color:${dl <= 30 ? 'var(--red)' : dl <= 120 ? 'var(--amber)' : 'var(--slate)'};">${c.end}</span>${endAlert}</td>`;
      const meetcell = `<td><span style="font-size:12px;font-weight:600;color:${c.meet <= d.mx ? 'var(--ink)' : 'var(--red)'};">${c.meet}j</span><span style="font-size:10px;color:var(--slate);"> · seuil ${d.mx}j</span></td>`;
      const convCount = filterSupport(c.supportConversations, c);
      const tickCount = filterSupport(c.supportTickets, c);
      const convcell = `<td><span style="font-size:15px;font-weight:700;color:${convCount > 0 ? 'var(--ink)' : 'var(--slate)'};">${convCount}</span></td>`;
      const tickcell = `<td><span style="font-size:15px;font-weight:700;color:${tickCount > 0 ? 'var(--ink)' : 'var(--slate)'};">${tickCount}</span></td>`;
      row.innerHTML = namecell + teamcell + scorecell + riskcell + endcell + meetcell + convcell + tickcell + qa_html;
    }
    tbody.appendChild(row);
  });
}

function openDetails(id, e) {
  if (e) e.stopPropagation();
  const c = DB.find(x => x.id === id), d = getScoreDetails(c), s = d.tot, ro = getChurnRisk(c, s);
  const sbadge = s >= 70 ? 'bg' : s >= 40 ? 'ba' : 'br';
  document.getElementById('sp-chips').innerHTML = `<span class="chip ${tchip(c.tier)}">${c.tier}</span><span class="badge ${sbadge}">${bl(s)}</span>`;
  document.getElementById('sp-name').textContent = c.name;
  document.getElementById('sp-dates').innerHTML = `<span>📅 Début: <b>${c.start}</b></span><span>🏁 Fin: <b style="color:${getDays(c.end) <= 120 ? 'var(--red)' : 'inherit'}">${c.end}</b></span>`;
  document.getElementById('sp-csm').textContent = c.csm;
  document.getElementById('sp-kam').textContent = c.kam;

  const ptc = pts => pts === 0 ? 'var(--red)' : 'var(--green)';
  const rws = [
    {lbl: 'Account Pulse',        sub: `Note: ${c.pulse}/5`,                              pts: d.pp,  mx: 20},
    {lbl: 'Engagement',           sub: `Moy. connexion: ${d.avg.toFixed(0)}j`,            pts: d.ep,  mx: 40},
    {lbl: `Relation (${c.tier})`, sub: `Dernier RDV: ${c.meet}j — seuil: ${d.mx}j`,      pts: d.rp,  mx: 30},
    {lbl: 'Proactivité',         sub: `RDV planifié: ${c.next ? 'Oui' : 'Non'}`,         pts: d.pro, mx: 10},
  ];
  document.getElementById('sp-breakdown').innerHTML = rws.map(rw => `<div class="spsr"><div><div class="spsl">${rw.lbl}</div><div class="spsb">${rw.sub}</div></div><div class="spbw"><div class="spbt" style="width:80px;"><div class="spbf" style="width:${rw.mx ? rw.pts / rw.mx * 100 : 0}%;background:${ptc(rw.pts)};"></div></div><span style="font-family:'DM Mono',monospace;font-size:11px;color:${ptc(rw.pts)};width:38px;text-align:right;">${rw.pts}/${rw.mx}</span></div></div>`).join('');
  document.getElementById('sp-total').textContent = `${s}/100`;

  const srcs = [
    {name: 'HubSpot',    icon: '🟠', status: c.meet < 999 ? `Dernier RDV: ${c.meet}j` : 'Non connecté', ok: c.meet < 90},
    {name: 'Modjo',      icon: '🎧', status: c.pulse > 0 ? `Pulse: ${c.pulse}/5 · Appels trackés` : 'Pas de data', ok: c.pulse >= 3},
    {name: 'Hyperline',  icon: '💜', status: c.mrr ? `MRR: ${c.mrr.toLocaleString('fr-FR')} €` : 'Non connecté', ok: !!c.mrr},
    {name: 'Didask App', icon: '🧭', status: `Engagement: ${d.avg.toFixed(0)}j moy. connexion`, ok: d.avg <= 30},
  ];
  document.getElementById('sp-sources').innerHTML = srcs.map(src => `<div class="sprr" style="background:var(--bg);margin-bottom:6px;"><span style="font-size:11px;font-weight:600;">${src.icon} ${src.name}</span><span style="font-size:10px;font-weight:600;color:${src.ok ? 'var(--green)' : 'var(--amber)'};">${src.status}</span></div>`).join('');

  document.getElementById('sp-ai').innerHTML    = c.aiAct    ? `<span style="color:var(--green);font-weight:700;">${c.aiMsg} msg/user</span>`    : `<span style="color:var(--slate);">Non déployé</span>`;
  document.getElementById('sp-coach').innerHTML = c.coachAct ? `<span style="color:var(--purple);font-weight:700;">${c.coachMsg} msg/user</span>` : `<span style="color:var(--slate);">Non déployé</span>`;

  const ticketCutoff = Date.now() - 90 * 86400000;
  const recentTickets = (c.supportTickets || [])
    .filter(t => new Date(t.date).getTime() >= ticketCutoff)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const shownTickets = recentTickets.slice(0, 5);
  const tStatusCfg = { 'en cours': {bg:'#dbeafe',color:'#3b82f6'}, 'résolu': {bg:'#d1fae5',color:'#059669'}, 'abandonné': {bg:'#f3f4f6',color:'#6b7280'} };
  document.getElementById('sp-tickets').innerHTML = shownTickets.length === 0
    ? `<p style="font-size:12px;color:var(--slate);padding:6px 0 0;">Aucun ticket support sur les 90 derniers jours.</p>`
    : shownTickets.map(t => {
        const days = Math.round((Date.now() - new Date(t.date).getTime()) / 86400000);
        const ago = days === 0 ? "aujourd'hui" : days === 1 ? 'il y a 1 jour' : `il y a ${days} jours`;
        const sc = tStatusCfg[t.status] || tStatusCfg['abandonné'];
        return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line);">
          <span style="font-size:10px;color:var(--slate);white-space:nowrap;flex-shrink:0;">${ago}</span>
          <span style="font-size:11px;font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${t.topic}">${t.topic}</span>
          <span style="background:${sc.bg};color:${sc.color};font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;white-space:nowrap;flex-shrink:0;">${t.status}</span>
          <a href="${t.url}" target="_blank" rel="noopener noreferrer" style="font-size:14px;color:var(--slate);text-decoration:none;flex-shrink:0;line-height:1;" title="Ouvrir dans Intercom">↗</a>
        </div>`;
      }).join('') + (recentTickets.length > 5
        ? `<div style="padding:8px 0 0;"><a href="#" onclick="return false;" style="font-size:11px;color:var(--blue);font-weight:600;text-decoration:none;">Voir tous (${recentTickets.length})</a></div>`
        : '');

  document.getElementById('sp-usage').innerHTML = [{lbl:'Sièges',u:c.seatsUsed,ct:c.seatsContract},{lbl:'Crédits',u:c.creditsUsed,ct:c.creditsContract}].map(u => {
    const p = pct(u.u, u.ct), col = uc(p);
    return `<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="font-weight:600;">${u.lbl}</span><span><b style="color:${col};">${u.u.toLocaleString('fr-FR')}</b> / ${u.ct.toLocaleString('fr-FR')} — <span style="color:${col};font-weight:700;">${p}%</span>${p > 100 ? '<span class="upsell">Upsell</span>' : ''}</span></div><div class="ubar" style="height:6px;width:100%;"><div class="ubarf" style="width:${Math.min(p,100)}%;background:${col};"></div></div></div>`;
  }).join('');

  document.getElementById('sp-relation').innerHTML = [
    {icon:'🤝', lbl:'Dernier meeting', val:`Il y a ${c.meet} jours${c.meet > d.mx ? ' <b style="color:var(--red);">(En retard)</b>' : ''}`, bg:'var(--bg)'},
    {icon:'📅', lbl:'Prochain RDV',    val:c.next || '<b style="color:var(--red);">Non planifié ⚠</b>', bg:'#fdf6f3'},
    {icon:'📊', lbl:'NPS',             val:c.nps != null ? `<b style="color:${c.nps >= 60 ? 'var(--green)' : c.nps >= 40 ? 'var(--amber)' : 'var(--red)'};">${c.nps}</b>` : 'Non disponible', bg:'var(--bg)'},
  ].map(rel => `<div class="sprr" style="background:${rel.bg};"><span style="font-size:12px;font-weight:600;">${rel.icon} ${rel.lbl}</span><span style="font-size:12px;">${rel.val}</span></div>`).join('');

  document.getElementById('sp-actions').innerHTML = ['✉️ Email','📞 Appel','📝 Note HubSpot','📋 Créer tâche','🔗 Ouvrir deal'].map(a => `<button onclick="qa('${a}','${c.name.replace(/'/g,"\\'")}',event)" style="padding:7px 12px;border-radius:8px;border:1px solid var(--line);background:var(--bg);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .12s;" onmouseover="this.style.cssText=this.style.cssText+'background:var(--peach);color:white;border-color:var(--peach);'" onmouseout="this.style.background='var(--bg)';this.style.color='var(--ink)';this.style.borderColor='var(--line)'">${a}</button>`).join('');

  document.getElementById('sp').classList.add('open');
  document.getElementById('overlay').style.display = 'block';
}

function closeDetails() {
  document.getElementById('sp').classList.remove('open');
  document.getElementById('overlay').style.display = 'none';
}

/* ─── FILTER BAR STATE ─── */
function updateFilterBar() {
  const search = document.getElementById('si').value;
  const filterIds = ['fi-csm', 'fi-kam', 'fi-tier', 'fi-health'];
  let count = search ? 1 : 0;
  filterIds.forEach(id => {
    const el = document.getElementById(id);
    const active = !!el.value;
    if (active) count++;
    el.closest('.fsel-wrap').classList.toggle('active', active);
  });
  document.getElementById('si').classList.toggle('active', !!search);
  const btn = document.getElementById('reset-btn');
  const counter = document.getElementById('filter-count');
  counter.textContent = `(${count} filtre${count > 1 ? 's' : ''} actif${count > 1 ? 's' : ''})`;
  counter.style.display = count > 0 ? '' : 'none';
  btn.style.opacity = count > 0 ? '1' : '0.4';
  btn.style.cursor = count > 0 ? 'pointer' : 'not-allowed';
  btn.style.pointerEvents = count > 0 ? '' : 'none';
}

/* ─── CHARTS ─── */
let chartHealth = null, chartChurn = null, chartCsmStack = null, chartWorkload = null;

function healthOpts(data) {
  const g = data.filter(c => calcScore(c) >= 70).length;
  const a = data.filter(c => { const s = calcScore(c); return s >= 40 && s < 70; }).length;
  const r = data.filter(c => calcScore(c) < 40).length;
  return {
    chart:       { type: 'donut', height: 200, fontFamily: "'DM Sans',sans-serif", toolbar: { show: false } },
    series:      [g, a, r],
    labels:      ['Sain', 'Vigilance', 'Risque'],
    colors:      ['#10b981', '#f9b494', '#ef4444'],
    legend:      { position: 'right', fontSize: '11px', markers: { width: 8, height: 8, offsetY: 1 } },
    plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '11px', color: '#8892a4', fontWeight: 600 } } } } },
    dataLabels:  { enabled: false },
    stroke:      { width: 0 },
  };
}

function churnOpts(data) {
  const top5 = [...data]
    .sort((a, b) => getChurnRisk(b, calcScore(b)).tot - getChurnRisk(a, calcScore(a)).tot)
    .slice(0, 5);
  return {
    chart:       { type: 'bar', height: 200, fontFamily: "'DM Sans',sans-serif", toolbar: { show: false } },
    series:      [{ name: 'Risque churn', data: top5.map(c => getChurnRisk(c, calcScore(c)).tot) }],
    xaxis:       { categories: top5.map(c => c.name) },
    yaxis:       { max: 100 },
    colors:      ['#ef4444'],
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    dataLabels:  { enabled: false },
    tooltip:     { y: { formatter: v => v + '/100' } },
    grid:        { borderColor: '#e5e9f0' },
  };
}

function csmStackOpts(data) {
  const csms = [...new Set(data.map(c => c.csm))].sort();
  return {
    chart:       { type: 'bar', height: 200, stacked: true, fontFamily: "'DM Sans',sans-serif", toolbar: { show: false } },
    series: [
      { name: 'Sain',      data: csms.map(csm => data.filter(c => c.csm === csm && calcScore(c) >= 70).length) },
      { name: 'Vigilance', data: csms.map(csm => data.filter(c => c.csm === csm && calcScore(c) >= 40 && calcScore(c) < 70).length) },
      { name: 'Risque',    data: csms.map(csm => data.filter(c => c.csm === csm && calcScore(c) < 40).length) },
    ],
    xaxis:       { categories: csms },
    colors:      ['#10b981', '#f9b494', '#ef4444'],
    plotOptions: { bar: { borderRadius: 3 } },
    dataLabels:  { enabled: false },
    legend:      { show: false },
    grid:        { borderColor: '#e5e9f0' },
    yaxis:       { tickAmount: 3, labels: { formatter: v => Math.round(v) } },
  };
}

function workloadOpts(csmF) {
  const entries = Object.entries(csmWorkload)
    .filter(([name]) => !csmF || name.startsWith(csmF))
    .sort((a, b) => b[1] - a[1]);
  const maxVal = entries.length ? Math.max(...entries.map(([, v]) => v)) * 1.25 : 150;
  return {
    chart:       { type: 'bar', height: 200, fontFamily: "'DM Sans',sans-serif", toolbar: { show: false } },
    series:      [{ name: 'Workload', data: entries.map(([, v]) => v) }],
    xaxis:       { categories: entries.map(([name]) => name) },
    colors:      ['#f9b494'],
    plotOptions: { bar: { borderRadius: 4, dataLabels: { position: 'top' } } },
    dataLabels:  { enabled: true, offsetY: -18, formatter: v => v, style: { fontWeight: '700', colors: ['#1a1a1a'], fontSize: '11px' } },
    legend:      { show: false },
    grid:        { borderColor: '#e5e9f0' },
    yaxis:       { show: false, max: maxVal },
  };
}

function updateCharts(data, csmF) {
  if (!chartHealth) {
    chartHealth   = new ApexCharts(document.getElementById('chart-health'),   healthOpts(data));
    chartChurn    = new ApexCharts(document.getElementById('chart-churn'),    churnOpts(data));
    chartCsmStack = new ApexCharts(document.getElementById('chart-csm'),      csmStackOpts(data));
    chartWorkload = new ApexCharts(document.getElementById('chart-workload'), workloadOpts(csmF));
    chartHealth.render();
    chartChurn.render();
    chartCsmStack.render();
    chartWorkload.render();
    return;
  }
  chartHealth.updateSeries(healthOpts(data).series);
  chartChurn.updateOptions(churnOpts(data), false, false);
  chartCsmStack.updateOptions(csmStackOpts(data), false, false);
  chartWorkload.updateOptions(workloadOpts(csmF), false, false);
}

/* ─── PRIORITIES ─── */
const DISMISS_TTL = 24 * 60 * 60 * 1000;

function isDismissed(id) {
  const ts = localStorage.getItem('p_' + id);
  return ts && (Date.now() - parseInt(ts)) < DISMISS_TTL;
}

function dismissPriority(id) {
  localStorage.setItem('p_' + id, Date.now());
  renderPriorities();
}

function getPriorities() {
  const user = localStorage.getItem('currentUser');
  const pool = user ? DB.filter(c => c.csm === user) : DB;
  const results = [];
  for (const c of pool) {
    if (isDismissed(c.id) || results.length >= 5) continue;
    const s = calcScore(c), ro = getChurnRisk(c, s), dl = getDays(c.end);
    if (ro.tot >= 70 && !c.next)
      results.push({ c, reason: `Risque churn ${ro.tot}/100 et aucun prochain RDV planifié.` });
    else if (dl < 60 && s < 70)
      results.push({ c, reason: `Renouvellement dans ${dl}j avec un health score de ${s}/100.` });
    else if (c.tier === 'Premium' && c.meet > 30)
      results.push({ c, reason: `Compte Premium sans RDV depuis ${c.meet}j (seuil 30j).` });
    else if (c.seatsUsed > c.seatsContract || c.creditsUsed > c.creditsContract) {
      const what = c.seatsUsed > c.seatsContract ? 'sièges' : 'crédits';
      const ratio = what === 'sièges' ? `${c.seatsUsed}/${c.seatsContract}` : `${c.creditsUsed}/${c.creditsContract}`;
      results.push({ c, reason: `Opportunité upsell : ${what} dépassés (${ratio}).` });
    }
  }
  return results;
}

function renderPriorities() {
  const items = getPriorities();
  const bar = document.getElementById('pbar');
  if (!items.length) { bar.style.display = 'none'; return; }
  bar.style.display = '';
  document.getElementById('plist').innerHTML = items.map(({ c, reason }) =>
    `<div style="background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;min-width:200px;flex:1;max-width:380px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</div>
        <div style="font-size:11px;color:var(--slate);margin-top:2px;line-height:1.4;">${reason}</div>
      </div>
      <button class="detb" onclick="openDetails('${c.id}',event)" style="flex-shrink:0;">Détails →</button>
      <button class="qab" onclick="dismissPriority('${c.id}')" title="Marquer comme traité" style="flex-shrink:0;font-size:11px;padding:5px 8px;">✓</button>
    </div>`
  ).join('');
}

function initTooltips() {
  const tbody = document.getElementById('tbody');
  tbody.addEventListener('mouseover', e => {
    const tw = e.target.closest('.tw');
    if (!tw) return;
    const tb = tw.querySelector('.tb');
    if (!tb) return;
    const rect = tw.getBoundingClientRect();
    const cx = Math.max(108, Math.min(rect.left + rect.width / 2, window.innerWidth - 108));
    tb.style.left = cx + 'px';
    tb.style.transform = 'translateX(-50%)';
    if (rect.top < window.innerHeight / 2) {
      tb.style.top = (rect.bottom + 8) + 'px';
      tb.style.bottom = 'auto';
    } else {
      tb.style.top = 'auto';
      tb.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
    }
    tb.style.visibility = 'visible';
    tb.style.opacity = '1';
  });
  tbody.addEventListener('mouseout', e => {
    const tw = e.target.closest('.tw');
    if (!tw || tw.contains(e.relatedTarget)) return;
    const tb = tw.querySelector('.tb');
    if (!tb) return;
    tb.style.visibility = 'hidden';
    tb.style.opacity = '0';
  });
}

['si','fi-csm','fi-kam','fi-tier','fi-health'].forEach(id => {
  document.getElementById(id).addEventListener('input', drawTable);
  document.getElementById(id).addEventListener('change', drawTable);
});
loadFromURL();
const _savedUser = localStorage.getItem('currentUser');
if (_savedUser) {
  document.getElementById('user-select').value = _savedUser;
  document.getElementById('fi-csm').value      = _savedUser;
  document.getElementById('admin-btn').style.display = '';
}
drawTable();
renderPriorities();
initTooltips();
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--hdr-h', document.getElementById('hdr').offsetHeight + 'px');
}).observe(document.getElementById('hdr'));

window.setTab = setTab;
window.toggleSort = toggleSort;
window.qa = qa;
window.openDetails = openDetails;
window.closeDetails = closeDetails;
window.resetFilters = resetFilters;
window.applyCurrentUser = applyCurrentUser;
window.setAdminView = setAdminView;
window.dismissPriority = dismissPriority;
window.setSupportPeriod = setSupportPeriod;
