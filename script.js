import { createClient } from 
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


const supabaseUrl = "https://bdewspxifwcwuhzjrqfi.supabase.co";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkZXdzcHhpZndjd3VoempycWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNTIyNzcsImV4cCI6MjA5OTgyODI3N30._JloBr2aY0OBh0MbjHjdOTE46Hu4uCefNA4v8qnntSA";


const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

(function(){
  const root = document.getElementById('twaRoot');
  const body = document.getElementById('twaBody');
  const STORE_KEY = 'buku-perjalanan-data-v1';
  let state = { customers: [], transportasi: [], penginapan: [], wisata: [], settings: { persen: 10 } };
  let activeTab = 'input';
  let activeCustomerId = null; // for input tab
  let expandedCustomers = {}; // for view tab
  let selectedItems = {}; // key: `${type}:${id}` -> true
  let saving = false;

  function uid(){ return 'x' + Math.random().toString(36).slice(2,10) + Date.now().toString(36); }
  function fmt(n){ n = Number(n)||0; return 'Rp ' + Math.round(n).toLocaleString('id-ID'); }
  function toast(msg){
    const t = document.createElement('div');
    t.className = 'twa-toast'; t.textContent = msg;
    root.appendChild(t);
    setTimeout(()=>t.remove(), 1800);
  }

  async function load(){

  try{

    const { data: customers } = await supabase
    .from("customers")
    .select("*");


    const { data: transportasi } = await supabase
    .from("transportasi")
    .select("*");


    const { data: penginapan } = await supabase
    .from("penginapan")
    .select("*");


    const { data: wisata } = await supabase
    .from("wisata")
    .select("*");


    state.customers = customers || [];
    state.transportasi = transportasi || [];
    state.penginapan = penginapan || [];
    state.wisata = wisata || [];


  }catch(e){

    console.error(e);
    toast("Gagal mengambil data");

  }


  render();

}
  
 async function save(){
  
  console.log("Data tersimpan ke Supabase");

}

  function nightsFor(customer){
    if(!customer || !customer.tglMulai || !customer.tglSelesai) return 0;
    const a = new Date(customer.tglMulai), b = new Date(customer.tglSelesai);
    const diff = Math.round((b-a)/86400000);
    return diff > 0 ? diff : 0;
  }
  function daysFor(customer){
    const n = nightsFor(customer);
    return n > 0 ? n+1 : 1;
  }

  function getCustomer(id){ return state.customers.find(c=>c.id===id); }

  // ---------- render dispatch ----------
  function render(){
    document.querySelectorAll('.twa-tbtn').forEach(b=>{
      b.classList.toggle('active', b.dataset.tab === activeTab);
    });
    if(activeTab === 'input') renderInput();
    else renderView();
    enableDatePickers();
  }

  document.querySelectorAll('.twa-tbtn').forEach(b=>{
    b.addEventListener('click', ()=>{ activeTab = b.dataset.tab; render(); });
  });

  function enableDatePickers(){
    body.querySelectorAll('input[type=date]').forEach(inp=>{
      if(inp.dataset.pickerBound) return;
      inp.dataset.pickerBound = '1';
      const open = ()=>{ if(inp.showPicker){ try{ inp.showPicker(); }catch(e){} } };
      inp.addEventListener('click', open);
      inp.addEventListener('focus', open);
      inp.addEventListener('keydown', (e)=>{ e.preventDefault(); open(); });
    });
  }

  // ================= INPUT TAB =================
  function renderInput(){
    const customerOptions = state.customers.map(c=>`<option value="${c.id}" ${c.id===activeCustomerId?'selected':''}>${esc(c.nama)} — ${esc(c.wisataKe||'')}</option>`).join('');

    body.innerHTML = `
      <div class="twa-section">
        <div class="twa-eyebrow">Data Customer</div>
        <h2>Customer &amp; Jadwal</h2>
        <p class="twa-sub">Buat data customer dulu, baru isi segmen transportasi / penginapan / wisata untuknya.</p>
        <div class="twa-field"><label>Nama Customer</label><input id="f-cust-nama" placeholder="cth. Bu Sinta"/></div>
        <div class="twa-field"><label>Wisata Ke</label><input id="f-cust-wisata" placeholder="cth. Malang - Batu"/></div>
        <div class="twa-row2">
          <div class="twa-field"><label>Tanggal Mulai</label><input type="date" id="f-cust-mulai"/></div>
          <div class="twa-field"><label>Tanggal Selesai</label><input type="date" id="f-cust-selesai"/></div>
        </div>
        <div class="twa-field"><label>Jumlah Pax</label><input type="number" id="f-cust-pax" placeholder="0"/></div>
        <button class="twa-btn twa-btn-primary" id="btn-add-customer">Simpan Customer</button>
      </div>

      <div class="twa-select-line">
        <select id="sel-active-customer">
          <option value="">— Pilih customer aktif untuk input segmen —</option>
          ${customerOptions}
        </select>
      </div>

      ${activeCustomerId ? renderSegmentForms() : `<div class="twa-empty"><span class="twa-empty-mark">👆</span>Pilih atau buat customer dulu untuk mulai isi transportasi, penginapan, dan wisata.</div>`}
    `;

    document.getElementById('btn-add-customer').onclick = async ()=>{
      const nama = document.getElementById('f-cust-nama').value.trim();
      const wisata = document.getElementById('f-cust-wisata').value.trim();
      const mulai = document.getElementById('f-cust-mulai').value;
      const selesai = document.getElementById('f-cust-selesai').value;
      const pax = document.getElementById('f-cust-pax').value;
      if(!nama){ toast('Nama customer wajib diisi'); return; }
      const c = { id: uid(), nama, wisataKe: wisata, tglMulai: mulai, tglSelesai: selesai||mulai, pax: Number(pax)||0 };
     await supabase
     .from("customers")
     .insert(c);


     await load();
     activeCustomerId = c.id;
     render();
      toast('Customer tersimpan');
    };
    const sel = document.getElementById('sel-active-customer');
    sel.onchange = ()=>{ activeCustomerId = sel.value || null; render(); };
    enableDatePickers();
  }

  function renderSegmentForms(){
    const cust = getCustomer(activeCustomerId);
    const nights = nightsFor(cust);
    const trans = state.transportasi.filter(x=>x.customerId===activeCustomerId);
    const inaps = state.penginapan.filter(x=>x.customerId===activeCustomerId);
    const wisatas = state.wisata.filter(x=>x.customerId===activeCustomerId);

    return `
      <div class="twa-section" style="background:var(--sand); border-color:var(--teal);">
        <div class="twa-customer-name">${esc(cust.nama)}</div>
        <div class="twa-customer-meta">${esc(cust.wisataKe||'-')} &middot; ${daysFor(cust)} hari ${nights} malam &middot; ${cust.pax||0} pax</div>
      </div>

      <div class="twa-section">
        <div class="twa-eyebrow">Segmen</div>
        <h2>Transportasi</h2>
        <div class="twa-field"><label>Nama / Keterangan</label><input id="tr-nama" placeholder="cth. Bus Pariwisata 34 seat"/></div>
        <div class="twa-row2">
          <div class="twa-field"><label>Jumlah Unit</label><input type="number" id="tr-unit" placeholder="0"/></div>
          <div class="twa-field"><label>Harga</label><input type="number" id="tr-harga" placeholder="0"/></div>
        </div>
        <div class="twa-computed"><span class="lbl">Total (unit &times; harga)</span><span id="tr-total-preview">${fmt(0)}</span></div>
        <button class="twa-btn twa-btn-outline" id="btn-add-tr">+ Tambah Transportasi</button>
        ${renderSimpleList(trans, 'transportasi')}
        ${segmentTotalLine('Total Transportasi', trans.reduce((s,x)=>s+x.total,0))}
      </div>

      <div class="twa-section">
        <div class="twa-eyebrow">Segmen</div>
        <h2>Penginapan</h2>
        <div class="twa-field"><label>Nama Hotel / Kamar</label><input id="in-nama" placeholder="cth. Hotel Kartika Deluxe"/></div>
        <div class="twa-row3">
          <div class="twa-field"><label>Unit</label><input type="number" id="in-unit" placeholder="0"/></div>
          <div class="twa-field"><label>Harga</label><input type="number" id="in-harga" placeholder="0"/></div>
          <div class="twa-field"><label>Keuntungan</label><input type="number" id="in-untung" placeholder="0"/></div>
        </div>
        <div class="twa-computed"><span class="lbl">Harga Jadi (unit &times; (harga + untung))</span><span id="in-jadi-preview">${fmt(0)}</span></div>
        <div class="twa-checkline">
          <input type="checkbox" id="in-extrabed"/>
          <label for="in-extrabed">Pakai Extra Bed?</label>
        </div>
        <div id="in-extrabed-fields" style="display:none;">
          <div class="twa-row2">
            <div class="twa-field"><label>Unit</label><input type="number" id="in-eb-unit" placeholder="0"/></div>
            <div class="twa-field"><label>Harga</label><input type="number" id="in-eb-harga" placeholder="0"/></div>
          </div>
        </div>
        <button class="twa-btn twa-btn-outline" id="btn-add-in">+ Tambah Penginapan</button>
        ${renderInapList(inaps, nights)}
        ${segmentTotalLine('Total Penginapan', inaps.reduce((s,x)=>{
          const jadi = x.unit*(x.harga+x.keuntungan);
          const total = jadi*nights;
          const eb = x.extraBed ? x.ebUnit*x.ebHarga : 0;
          return s+total+eb;
        },0))}
      </div>

      <div class="twa-section">
        <div class="twa-eyebrow">Segmen</div>
        <h2>Wisata</h2>
        <div class="twa-field"><label>Nama / Keterangan</label><input id="ws-nama" placeholder="cth. Tiket Jatim Park 3"/></div>
        <div class="twa-field"><label>Harga</label><input type="number" id="ws-harga" placeholder="0"/></div>
        <div class="twa-computed"><span class="lbl">Pax (dari data customer)</span><span>${cust.pax||0}</span></div>
        <div class="twa-computed"><span class="lbl">Total (harga &times; pax)</span><span id="ws-total-preview">${fmt(0)}</span></div>
        <button class="twa-btn twa-btn-outline" id="btn-add-ws">+ Tambah Wisata</button>
        ${renderWisataList(wisatas)}
        ${segmentTotalLine('Total Wisata', wisatas.reduce((s,x)=>s+x.total,0))}
      </div>

      ${renderRingkasan(cust)}
    `;
  }

  function renderRingkasan(cust){
    const trans = state.transportasi.filter(x=>x.customerId===cust.id);
    const inaps = state.penginapan.filter(x=>x.customerId===cust.id);
    const wisatas = state.wisata.filter(x=>x.customerId===cust.id);
    const nights = nightsFor(cust);

    const totTrans = trans.reduce((s,x)=>s+x.jumlahUnit*x.harga,0);
    const totWisata = wisatas.reduce((s,x)=>s+x.harga*(cust.pax||0),0);
    const totInap = inaps.reduce((s,x)=>{
      const hargaJadi = x.unit*(x.harga+x.keuntungan);
      const hargaTotal = hargaJadi*nights;
      const eb = x.extraBed ? x.ebUnit*x.ebHarga : 0;
      return s + hargaTotal + eb;
    },0);
    const grandTotal = totTrans + totWisata + totInap;

    const profitPenginapan = inaps.reduce((s,x)=> s + (Number(x.keuntungan)||0)*(x.unit||0)*nights, 0);
    const persen = Number(state.settings.persen)||0;
    const profitPersen = grandTotal*persen/100;
    const totalKeuntungan = profitPersen + profitPenginapan;
    const finalTotal = grandTotal + profitPersen;
    const pax = cust.pax||0;
    const hargaPerPax = pax>0 ? finalTotal/pax : 0;

    return `
      <div class="twa-section">
        <div class="twa-eyebrow">Ringkasan</div>
        <h2>Ringkasan Biaya — ${esc(cust.nama)}</h2>
        <div class="twa-field"><label>Persen Keuntungan dari Grand Total (%)</label><input type="number" id="sum-persen" value="${persen}"/></div>
        <div class="twa-summary-row"><span class="lbl">Grand Total (semua segmen)</span><span class="val">${fmt(grandTotal)}</span></div>
        <div class="twa-summary-row"><span class="lbl">Keuntungan dari Persentase (${persen}%)</span><span class="val">${fmt(profitPersen)}</span></div>
        <div class="twa-summary-row"><span class="lbl">Keuntungan dari Penginapan</span><span class="val">${fmt(profitPenginapan)}</span></div>
        <div class="twa-summary-row"><span class="lbl">Total Keuntungan (persentase + penginapan)</span><span class="val">${fmt(totalKeuntungan)}</span></div>
        <div class="twa-summary-row"><span class="lbl">Harga per Pax</span><span class="val">${fmt(hargaPerPax)}</span></div>
        <div class="twa-summary-final">
          <div>
            <div class="lbl">Total Akhir (Grand Total + Keuntungan Persentase)</div>
            <div class="val">${fmt(finalTotal)}</div>
          </div>
        </div>
        <p class="twa-sub" style="margin-top:10px;">Total Keuntungan di atas hanya info — yang masuk ke Total Akhir cuma keuntungan dari persentase grand total.</p>
      </div>
    `;
  }

  function segmentTotalLine(label, value){
    return `<div class="twa-computed" style="background:var(--teal); color:#fff;"><span class="lbl" style="color:#fff;">${label}</span><span>${fmt(value)}</span></div>`;
  }

  function renderSimpleList(items, type){
    if(!items.length) return `<div class="twa-empty" style="padding:14px;">Belum ada data ${type}.</div>`;
    return items.map(it=>`
      <div class="twa-list-item">
        <div class="twa-li-top">
          <div>
            <div class="twa-li-title">${esc(it.nama)}</div>
            <div class="twa-li-meta">${it.jumlahUnit} unit &times; ${fmt(it.harga)}</div>
          </div>
          <div style="text-align:right;">
            <div class="twa-li-total">${fmt(it.total)}</div>
            <button class="twa-del" data-del="${type}:${it.id}">Hapus</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderWisataList(items){
    if(!items.length) return `<div class="twa-empty" style="padding:14px;">Belum ada data wisata.</div>`;
    return items.map(it=>`
      <div class="twa-list-item">
        <div class="twa-li-top">
          <div>
            <div class="twa-li-title">${esc(it.nama)}</div>
            <div class="twa-li-meta">${fmt(it.harga)} / pax</div>
          </div>
          <div style="text-align:right;">
            <div class="twa-li-total">${fmt(it.total)}</div>
            <button class="twa-del" data-del="wisata:${it.id}">Hapus</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderInapList(items, nights){
    if(!items.length) return `<div class="twa-empty" style="padding:14px;">Belum ada data penginapan.</div>`;
    return items.map(it=>{
      const hargaJadi = it.unit*(it.harga+it.keuntungan);
      const hargaTotal = hargaJadi*nights;
      const eb = it.extraBed ? it.ebUnit*it.ebHarga : 0;
      return `
      <div class="twa-list-item">
        <div class="twa-li-top">
          <div>
            <div class="twa-li-title">${esc(it.nama)}</div>
            <div class="twa-li-meta">${it.unit} unit &times; (${fmt(it.harga)} + ${fmt(it.keuntungan)}) &times; ${nights} malam ${it.extraBed? '&middot; +Extra Bed '+it.ebUnit+'&times;'+fmt(it.ebHarga):''}</div>
          </div>
          <div style="text-align:right;">
            <div class="twa-li-total">${fmt(hargaTotal+eb)}</div>
            <button class="twa-del" data-del="penginapan:${it.id}">Hapus</button>
          </div>
        </div>
      </div>
    `;}).join('');
  }

  // live preview calculations while typing
  body.addEventListener('input', (e)=>{
    if(['tr-unit','tr-harga'].includes(e.target.id)){
      const u = Number(document.getElementById('tr-unit').value)||0;
      const h = Number(document.getElementById('tr-harga').value)||0;
      document.getElementById('tr-total-preview').textContent = fmt(u*h);
    }
    if(['in-unit','in-harga','in-untung'].includes(e.target.id)){
      updateInapPreview();
    }
    if(e.target.id === 'ws-harga'){
      const cust = getCustomer(activeCustomerId);
      const h = Number(document.getElementById('ws-harga').value)||0;
      document.getElementById('ws-total-preview').textContent = fmt(h*(cust.pax||0));
    }
  });
  function updateInapPreview(){
    const u = Number(document.getElementById('in-unit').value)||0;
    const h = Number(document.getElementById('in-harga').value)||0;
    const k = Number(document.getElementById('in-untung').value)||0;
    const jadi = u*(h+k);
    document.getElementById('in-jadi-preview').textContent = fmt(jadi);
  }

  // event delegation for delete buttons + dynamic bits inside input tab
  body.addEventListener('click', async (e)=>{
    const delBtn = e.target.closest('[data-del]');
    if(delBtn){
      const [type, id] = delBtn.dataset.del.split(':');
      state[type] = state[type].filter(x=>x.id!==id);
      await save(); render(); return;
    }
    if(e.target.id === 'btn-add-tr'){ addTrans(); return; }
    if(e.target.id === 'btn-add-ws'){ addWisata(); return; }
    if(e.target.id === 'btn-add-in'){ addPenginapan(); return; }
  });
  body.addEventListener('change', async (e)=>{
    if(e.target.id === 'in-extrabed'){
      const f = document.getElementById('in-extrabed-fields');
      if(f) f.style.display = e.target.checked ? 'block' : 'none';
    }
    if(e.target.id === 'sum-persen'){
      state.settings.persen = Number(e.target.value)||0;
      await save(); render();
    }
  });

  async function addTrans(){
    const nama = document.getElementById('tr-nama').value.trim();
    const unit = Number(document.getElementById('tr-unit').value)||0;
    const harga = Number(document.getElementById('tr-harga').value)||0;
    if(!nama){ toast('Nama wajib diisi'); return; }
    const total = unit*harga;
    const item = { id: uid(), customerId: activeCustomerId, nama, jumlahUnit: unit, harga, total };
    state.transportasi.push(item);
    await save(); render();
  }

  async function addWisata(){
    const cust = getCustomer(activeCustomerId);
    const nama = document.getElementById('ws-nama').value.trim();
    const harga = Number(document.getElementById('ws-harga').value)||0;
    if(!nama){ toast('Nama wajib diisi'); return; }
    const total = harga*(cust.pax||0);
    const item = { id: uid(), customerId: activeCustomerId, nama, harga, total };
    state.wisata.push(item);
    await save(); render();
  }

  async function addPenginapan(){
    const nama = document.getElementById('in-nama').value.trim();
    const unit = Number(document.getElementById('in-unit').value)||0;
    const harga = Number(document.getElementById('in-harga').value)||0;
    const untung = Number(document.getElementById('in-untung').value)||0;
    const extraBed = document.getElementById('in-extrabed').checked;
    const ebUnit = Number(document.getElementById('in-eb-unit').value)||0;
    const ebHarga = Number(document.getElementById('in-eb-harga').value)||0;
    if(!nama){ toast('Nama penginapan wajib diisi'); return; }
    const item = { id: uid(), customerId: activeCustomerId, nama, unit, harga, keuntungan: untung, extraBed, ebUnit, ebHarga };
    state.penginapan.push(item);
    await save(); render();
  }

  // ================= VIEW TAB =================
  function renderView(){
    const selectedText = buildSelectedText();
    body.innerHTML = `
      <div class="twa-selected-box">
        <div class="twa-sb-head">
          <h3>Data Terpilih</h3>
          <button class="twa-copybtn" id="btn-copy">Copy to Clipboard</button>
        </div>
        <textarea id="selected-text" readonly>${esc(selectedText)}</textarea>
      </div>
      ${state.customers.length ? state.customers.slice().reverse().map(c=>renderCustomerCard(c)).join('') : `<div class="twa-empty"><span class="twa-empty-mark">📋</span>Belum ada data customer.</div>`}
    `;
    document.getElementById('btn-copy').onclick = ()=>{
      const ta = document.getElementById('selected-text');
      ta.select();
      navigator.clipboard && navigator.clipboard.writeText(ta.value).then(()=>toast('Tersalin ke clipboard')).catch(()=>{
        document.execCommand('copy'); toast('Tersalin ke clipboard');
      });
    };
  }

  function renderCustomerCard(c){
    const nights = nightsFor(c);
    const trans = state.transportasi.filter(x=>x.customerId===c.id);
    const inaps = state.penginapan.filter(x=>x.customerId===c.id);
    const wisatas = state.wisata.filter(x=>x.customerId===c.id);
    const expanded = !!expandedCustomers[c.id];
    const custChecked = !!selectedItems['customer:'+c.id];
    return `
      <div class="twa-customer-card">
        <div class="twa-customer-head">
          <input type="checkbox" data-cust-check="${c.id}" ${custChecked?'checked':''}/>
          <div style="flex:1;" data-toggle-cust="${c.id}">
            <div class="twa-customer-name">${esc(c.nama)}</div>
            <div class="twa-customer-meta">${esc(c.wisataKe||'-')} &middot; ${daysFor(c)} hari ${nights} malam &middot; ${c.pax||0} pax</div>
          </div>
          <div class="twa-customer-toggle" data-toggle-cust="${c.id}">${expanded?'Tutup ▲':'Detail ▼'}</div>
        </div>
        ${expanded ? `
        <div class="twa-customer-body">
          <div class="twa-seg-title">Transportasi</div>
          ${trans.length? trans.map(it=>segRow('transportasi', it.id, it.nama, `${it.jumlahUnit}&times;${fmt(it.harga)}`, it.total)).join('') : `<div class="twa-li-meta">— tidak ada —</div>`}
          <div class="twa-seg-title">Penginapan</div>
          ${inaps.length? inaps.map(it=>{
            const hargaJadi = it.unit*(it.harga+it.keuntungan);
            const hargaTotal = hargaJadi*nights;
            const eb = it.extraBed ? it.ebUnit*it.ebHarga : 0;
            return segRow('penginapan', it.id, it.nama, `${it.unit} unit &middot; ${nights} malam${it.extraBed? ' + extra bed':''}`, hargaTotal+eb);
          }).join('') : `<div class="twa-li-meta">— tidak ada —</div>`}
          <div class="twa-seg-title">Wisata</div>
          ${wisatas.length? wisatas.map(it=>segRow('wisata', it.id, it.nama, `${fmt(it.harga)} &times; ${c.pax||0} pax`, it.total)).join('') : `<div class="twa-li-meta">— tidak ada —</div>`}
        </div>` : ''}
      </div>
    `;
  }
  function segRow(type, id, nama, meta, total){
    const key = type+':'+id;
    const checked = !!selectedItems[key];
    return `
      <div class="twa-seg-item">
        <input type="checkbox" data-seg-check="${key}" ${checked?'checked':''}/>
        <div class="twa-seg-text"><b>${esc(nama)}</b><br/><span style="color:var(--muted)">${meta}</span></div>
        <div class="twa-seg-total">${fmt(total)}</div>
      </div>
    `;
  }

  body.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-toggle-cust]');
    if(t && activeTab==='view'){
      const id = t.dataset.toggleCust;
      expandedCustomers[id] = !expandedCustomers[id];
      render();
    }
  });
  body.addEventListener('change', (e)=>{
    const cc = e.target.closest('[data-cust-check]');
    if(cc){
      const id = cc.dataset.custCheck;
      const key = 'customer:'+id;
      if(cc.checked) selectedItems[key] = true; else delete selectedItems[key];
      render();
      return;
    }
    const sc = e.target.closest('[data-seg-check]');
    if(sc){
      const key = sc.dataset.segCheck;
      if(sc.checked) selectedItems[key] = true; else delete selectedItems[key];
      render();
      return;
    }
  });

  function buildSelectedText(){
    const lines = [];
    state.customers.slice().reverse().forEach(c=>{
      const trans = state.transportasi.filter(x=>x.customerId===c.id);
      const inaps = state.penginapan.filter(x=>x.customerId===c.id);
      const wisatas = state.wisata.filter(x=>x.customerId===c.id);
      const custSelectedDirectly = !!selectedItems['customer:'+c.id];
      const picks = [];
      trans.forEach(it=>{ if(selectedItems['transportasi:'+it.id]) picks.push(it.nama); });
      inaps.forEach(it=>{ if(selectedItems['penginapan:'+it.id]) picks.push(it.nama + (it.extraBed?' (+ extra bed)':'')); });
      wisatas.forEach(it=>{ if(selectedItems['wisata:'+it.id]) picks.push(it.nama); });
      if(custSelectedDirectly || picks.length){
        lines.push(c.nama);
        lines.push(`${daysFor(c)} hari ${nightsFor(c)} malam`);
        picks.forEach(p=> lines.push('- ' + p));
        lines.push('');
      }
    });
    return lines.join('\n').trim();
  }

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  load();
})();