// MAC GST Calculator (India)
// Author: Arya Develop In

const fmt = new Intl.NumberFormat('en-IN', { 
  style: 'currency', 
  currency: 'INR', 
  maximumFractionDigits: 2 
});

const state = {
  supply: 'intra', // 'intra' or 'inter'
  items: []
};

// Elements
const nameEl = document.getElementById('name');
const qtyEl = document.getElementById('qty');
const priceEl = document.getElementById('price');
const rateEl = document.getElementById('rate');
const customRateWrap = document.getElementById('customRateWrap');
const customRateEl = document.getElementById('customRate');
const modeEl = document.getElementById('mode');

const intraBtn = document.getElementById('intraBtn');
const interBtn = document.getElementById('interBtn');
const supplyLabel = document.getElementById('supplyLabel');

const addItemBtn = document.getElementById('addItem');
const clearFormBtn = document.getElementById('clearForm');
const clearAllBtn = document.getElementById('clearAll');
const printBtn = document.getElementById('printBill');

const itemsBody = document.getElementById('itemsBody');
const taxableValueEl = document.getElementById('taxableValue');
const cgstTotalEl = document.getElementById('cgstTotal');
const sgstTotalEl = document.getElementById('sgstTotal');
const igstTotalEl = document.getElementById('igstTotal');
const grandTotalEl = document.getElementById('grandTotal');

const cgstPill = document.getElementById('cgstPill');
const sgstPill = document.getElementById('sgstPill');
const igstPill = document.getElementById('igstPill');

// Helpers
function getRateValue(){
  const val = rateEl.value;
  if (val === 'custom') {
    const r = parseFloat(customRateEl.value);
    return isFinite(r) ? r : 0;
  }
  return parseFloat(val);
}

function computeLine({ qty, unitPrice, rate, mode }){
  qty = Number(qty) || 0; unitPrice = Number(unitPrice) || 0; rate = Number(rate) || 0;
  const r = rate/100;
  let baseUnit, gstUnit, totalUnit;
  if (mode === 'inclusive'){
    baseUnit = unitPrice / (1 + r);
    gstUnit = unitPrice - baseUnit;
    totalUnit = unitPrice;
  } else {
    baseUnit = unitPrice;
    gstUnit = unitPrice * r;
    totalUnit = unitPrice + gstUnit;
  }
  const base = baseUnit * qty;
  const gst = gstUnit * qty;
  const total = totalUnit * qty;

  let cgst=0, sgst=0, igst=0;
  if (state.supply === 'intra'){
    cgst = gst/2; sgst = gst/2;
  } else {
    igst = gst;
  }
  return { baseUnit, gstUnit, totalUnit, base, gst, total, cgst, sgst, igst };
}

function resetForm(){
  nameEl.value = '';
  qtyEl.value = '1';
  priceEl.value = '';
  rateEl.value = '18';
  customRateEl.value = '';
  modeEl.value = 'exclusive';
  customRateWrap.style.display = 'none';
  nameEl.focus();
}

function render(){
  // Toggle CGST/SGST vs IGST pills
  if (state.supply === 'intra'){
    cgstPill.style.display = '';
    sgstPill.style.display = '';
    igstPill.style.display = 'none';
    supplyLabel.textContent = 'Supply: Intra-state (CGST + SGST)';
  } else {
    cgstPill.style.display = 'none';
    sgstPill.style.display = 'none';
    igstPill.style.display = '';
    supplyLabel.textContent = 'Supply: Inter-state (IGST)';
  }

  // Table
  itemsBody.innerHTML = '';
  if (state.items.length === 0){
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="7" class="small" style="padding:14px; text-align:center; color: var(--muted)">No items yet. Add your first item ➜</td>';
    itemsBody.appendChild(tr);
  } else {
    state.items.forEach((it, idx) => {
      const line = computeLine(it);
      const tr = document.createElement('tr');
      const safeName = it.name || `Item ${idx+1}`;
      tr.innerHTML = `
        <td>${escapeHtml(safeName)}</td>
        <td class="right">${it.qty}</td>
        <td class="right" title="Base per unit">${fmt.format(line.baseUnit)}</td>
        <td class="right">${(+it.rate).toFixed(2)}%</td>
        <td class="right">${fmt.format(line.gst)}</td>
        <td class="right">${fmt.format(line.total)}</td>
        <td class="right"><button class="btn ghost" data-del="${idx}" aria-label="Remove ${safeName}">✕</button></td>
      `;
      itemsBody.appendChild(tr);
    });
  }

  // Summary
  let taxable = 0, gst=0, cgst=0, sgst=0, igst=0, grand=0;
  state.items.forEach(it => {
    const l = computeLine(it);
    taxable += l.base;
    gst += l.gst;
    cgst += l.cgst; sgst += l.sgst; igst += l.igst;
    grand += l.total;
  });
  taxableValueEl.textContent = fmt.format(taxable);
  cgstTotalEl.textContent = fmt.format(cgst);
  sgstTotalEl.textContent = fmt.format(sgst);
  igstTotalEl.textContent = fmt.format(igst);
  grandTotalEl.textContent = fmt.format(grand);
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
}

// Event wiring
rateEl.addEventListener('change', () => {
  customRateWrap.style.display = rateEl.value === 'custom' ? '' : 'none';
});

intraBtn.addEventListener('click', () => {
  state.supply = 'intra';
  intraBtn.classList.remove('ghost'); intraBtn.setAttribute('aria-pressed','true');
  interBtn.classList.add('ghost'); interBtn.setAttribute('aria-pressed','false');
  render();
});
interBtn.addEventListener('click', () => {
  state.supply = 'inter';
  interBtn.classList.remove('ghost'); interBtn.setAttribute('aria-pressed','true');
  intraBtn.classList.add('ghost'); intraBtn.setAttribute('aria-pressed','false');
  render();
});

addItemBtn.addEventListener('click', () => {
  const name = nameEl.value.trim();
  const qty = Math.max(0, Number(qtyEl.value || 0));
  const unitPrice = Math.max(0, Number(priceEl.value || 0));
  const mode = modeEl.value;
  const rate = (rateEl.value === 'custom') ? (Number(customRateEl.value || 0)) : Number(rateEl.value || 0);

  if (!qty || !isFinite(qty)) return alert('Enter a valid quantity');
  if (!isFinite(unitPrice)) return alert('Enter a valid price');
  if (!isFinite(rate)) return alert('Enter a valid GST rate');

  state.items.push({ name, qty, unitPrice, mode, rate });
  resetForm();
  render();
});

clearFormBtn.addEventListener('click', resetForm);

clearAllBtn.addEventListener('click', () => {
  if (state.items.length===0) return;
  const ok = confirm('Clear all items?');
  if (!ok) return;
  state.items = [];
  render();
});

itemsBody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-del]');
  if (!btn) return;
  const idx = Number(btn.getAttribute('data-del'));
  state.items.splice(idx,1);
  render();
});

printBtn.addEventListener('click', () => window.print());

// Demo buttons
document.querySelectorAll('[data-demo]').forEach(b => {
  b.addEventListener('click', () => {
    const d = JSON.parse(b.getAttribute('data-demo'));
    nameEl.value = d.name; qtyEl.value = d.qty; priceEl.value = d.price; modeEl.value = d.mode;
    rateEl.value = String(d.rate);
    if (d.rate === 'custom'){ 
      rateEl.value = 'custom'; 
      customRateWrap.style.display = ''; 
      customRateEl.value = d.custom; 
    }
    nameEl.focus();
  });
});

// Initial render
render();
