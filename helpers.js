    // 1. SALVATION HISTORY PERIODS & METADATA
    // =========================================================================
    const ALL_PERIODS = [
      { id: 'early', name: 'Early World', color: '#0d9488', in90: true, in365: true },
      { id: 'patriarchs', name: 'Patriarchs', color: '#991b1b', in90: true, in365: true },
      { id: 'exodus', name: 'Egypt and Exodus', color: '#dc2626', in90: true, in365: true },
      { id: 'desert', name: 'Desert Wanderings', color: '#d97706', in90: true, in365: true },
      { id: 'conquest', name: 'Conquest and Judges', color: '#16a34a', in90: true, in365: true },
      { id: 'checkpoint1', name: 'Messianic Checkpoint (John)', color: '#ca8a04', in90: false, in365: true },
      { id: 'royal', name: 'Royal Kingdom', color: '#7e22ce', in90: true, in365: true },
      { id: 'checkpoint2', name: 'Messianic Checkpoint (Mark)', color: '#ca8a04', in90: false, in365: true },
      { id: 'divided', name: 'Divided Kingdom', color: '#1e293b', in90: true, in365: true },
      { id: 'exile', name: 'Exile', color: '#0284c7', in90: true, in365: true },
      { id: 'checkpoint3', name: 'Messianic Checkpoint (Matthew)', color: '#ca8a04', in90: false, in365: true },
      { id: 'return', name: 'Return', color: '#eab308', in90: true, in365: true },
      { id: 'maccabees', name: 'Maccabean Revolt', color: '#ea580c', in90: true, in365: true },
      { id: 'messianic', name: 'Messianic Fulfillment', color: '#b45309', in90: true, in365: true },
      { id: 'church', name: 'The Church', color: '#2563eb', in90: true, in365: true }
    ];

    const NARRATIVE_BOOKS = [
      'Genesis', 'Exodus', 'Numbers', 'Joshua', 'Judges', '1 Samuel', '2 Samuel',
      '1 Kings', '2 Kings', 'Ezra', 'Nehemiah', '1 Maccabees', 'Luke', 'Acts'
    ];

    function isNarrative(reading) {
      if (!reading) return false;
      return NARRATIVE_BOOKS.some(b => reading.startsWith(b + ' '));
    }

    // =========================================================================
    // 2. RAW DATA STORAGE & LAZY LOADING
    // =========================================================================
    let rawData = {
      '90': [],
      '365': []
    };
    let processedDays = {
      '90': [],
      '365': []
    };
    let isDataLoaded = false;

    async function loadRawData() {
      try {
        const [raw90Res, raw365Res] = await Promise.all([
          fetch('raw_90.json'),
          fetch('raw_365.json')
        ]);

        rawData['90'] = await raw90Res.json();
        rawData['365'] = await raw365Res.json();
        isDataLoaded = true;
        console.log('Raw reading data loaded successfully.');
      } catch (e) {
        console.error('Error loading raw reading data:', e);
        alert('Failed to load reading plan data. Check console for details.');
      }
    }

    // --- Processing Functions ---

    function getPeriodFor90(d) {
      if (d <= 3) return 'early';
      if (d <= 12) return 'patriarchs';
      if (d <= 22) return 'exodus';
      if (d <= 31) return 'desert';
      if (d <= 44) return 'conquest';
      if (d <= 59) return 'royal';
      if (d <= 66) return 'divided';
      if (d <= 68) return 'exile';
      if (d <= 73) return 'return';
      if (d <= 77) return 'maccabees';
      if (d <= 83) return 'messianic';
      return 'church';
    }

    function getMonthFor90(d) {
      if (d <= 30) return 1;
      if (d <= 59) return 2;
      return 3;
    }

    function process90Plan() {
      const days = rawData['90'].map((reading, idx) => {
        const dayNum = idx + 1;
        return {
          day: dayNum,
          month: getMonthFor90(dayNum),
          period: getPeriodFor90(dayNum),
          passages: [reading]
        };
      });
      processedDays['90'] = days;
    }

    function getPeriodFor365(d) {
      if (d <= 5) return 'early';
      if (d <= 26) return 'patriarchs';
      if (d <= 51) return 'exodus';
      if (d <= 80) return 'desert';
      if (d <= 98) return 'conquest';
      if (d <= 105) return 'checkpoint1';
      if (d <= 153) return 'royal';
      if (d <= 161) return 'checkpoint2';
      if (d <= 182) return 'divided';
      if (d <= 257) return 'exile';
      if (d <= 266) return 'checkpoint3';
      if (d <= 281) return 'return';
      if (d <= 312) return 'maccabees';
      if (d <= 321) return 'messianic';
      return 'church';
    }

    function process365Plan() {
      const days = rawData['365'].map((r, idx) => {
        const dayNum = idx + 1;
        const passages = r.filter(Boolean);
        return {
          day: dayNum,
          period: getPeriodFor365(dayNum),
          passages
        };
      });
      processedDays['365'] = days;
    }

    // =========================================================================
    // 3. APPLICATION STATE & STORAGE
    // =========================================================================
    const KEY_90 = 'bible_timeline_90_v1';
    const KEY_365 = 'bible_in_a_year_365_v1';
    const KEY_PREF = 'bible_tracker_active_plan';

    let state = {
      plan: '365', // '90' or '365'
      data: {
        '90': { checked: {}, notes: {} },
        '365': { checked: {}, notes: {} }
      },
      activePeriod: 'all',
      activeMonth: 'all',
      view: 'list',
      modalDay: null
    };

    function loadState() {
      try {
        const savedPlan = localStorage.getItem(KEY_PREF);
        if (savedPlan === '90' || savedPlan === '365') state.plan = savedPlan;

        const saved90 = localStorage.getItem(KEY_90);
        if (saved90) {
          const parsed90 = JSON.parse(saved90);
          state.data['90'].checked = parsed90.checked || {};
          state.data['90'].notes = parsed90.notes || {};
        }

        const saved365 = localStorage.getItem(KEY_365);
        if (saved365) {
          const parsed365 = JSON.parse(saved365);
          state.data['365'].checked = parsed365.checked || {};
          state.data['365'].notes = parsed365.notes || {};
        }
      } catch (e) { console.error(e); }
    }

    function saveState() {
      try {
        localStorage.setItem(KEY_PREF, state.plan);
        localStorage.setItem(KEY_90, JSON.stringify(state.data['90']));
        localStorage.setItem(KEY_365, JSON.stringify(state.data['365']));
      } catch (e) { console.error(e); }
    }

    function getActiveDays() {
      // Lazy processing: ensure data is processed for the active plan
      if (!processedDays[state.plan] && isDataLoaded) {
        if (state.plan === '90') {
          process90Plan();
        } else if (state.plan === '365') {
          process365Plan();
        }
      }
      return processedDays[state.plan] || [];
    }

    function getActiveStore() {
      return state.data[state.plan];
    }

    function getActivePeriods() {
      return ALL_PERIODS.filter(p => state.plan === '90' ? p.in90 : p.in365);
    }

    // =========================================================================
    // 4. ACTIONS & HELPERS
    // =========================================================================
    async function switchPlan(planId) {
      state.plan = planId;
      state.activePeriod = 'all';
      state.activeMonth = 'all';
      document.getElementById('status-filter').value = 'all';
      document.getElementById('search-input').value = '';
      
      // Ensure raw data is loaded before processing
      if (!isDataLoaded) {
        await loadRawData();
      }

      // Process the data for the new plan if not already done
      if (!processedDays[planId]) {
        if (planId === '90') {
          process90Plan();
        } else if (planId === '365') {
          process365Plan();
        }
      }

      saveState();
      render();
    }

    function isDayComplete(dayObj) {
      const store = getActiveStore();
      const val = store.checked[dayObj.day];
      if (typeof val === 'boolean') return val; // backward compatibility
      const arr = Array.isArray(val) ? val : [];
      return dayObj.passages.every((_, i) => !!arr[i]);
    }

    function isDayPartial(dayObj) {
      const store = getActiveStore();
      const val = store.checked[dayObj.day];
      if (typeof val === 'boolean') return false;
      const arr = Array.isArray(val) ? val : [];
      const count = dayObj.passages.filter((_, i) => !!arr[i]).length;
      return count > 0 && count < dayObj.passages.length;
    }

    function isPassageDone(dayObj, pIdx) {
      const store = getActiveStore();
      const val = store.checked[dayObj.day];
      if (typeof val === 'boolean') return val;
      const arr = Array.isArray(val) ? val : [];
      return !!arr[pIdx];
    }

    function togglePassage(dayNum, pIdx) {
      const days = getActiveDays();
      const store = getActiveStore();
      const d = days[dayNum - 1];
      const current = store.checked[dayNum];

      if (typeof current === 'boolean') {
        store.checked[dayNum] = d.passages.map(() => current);
      } else if (!Array.isArray(current)) {
        store.checked[dayNum] = d.passages.map(() => false);
      }

      store.checked[dayNum][pIdx] = !store.checked[dayNum][pIdx];
      saveState();
      render();
    }

    function toggleFullDay(dayNum) {
      const days = getActiveDays();
      const store = getActiveStore();
      const d = days[dayNum - 1];
      const complete = isDayComplete(d);
      store.checked[dayNum] = d.passages.map(() => !complete);
      saveState();
      render();
    }

    function setPeriodFilter(periodId) {
      state.activePeriod = periodId;
      render();
    }

    function setMonthFilter(monthVal) {
      state.activeMonth = monthVal;
      render();
    }

    function setView(v) {
      state.view = v;
      document.getElementById('view-list-btn').className = v === 'list'
        ? 'px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-900 text-white'
        : 'px-2.5 py-1 text-xs font-semibold rounded-md text-stone-600 hover:text-stone-900';
      document.getElementById('view-grid-btn').className = v === 'grid'
        ? 'px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-900 text-white'
        : 'px-2.5 py-1 text-xs font-semibold rounded-md text-stone-600 hover:text-stone-900';
      render();
    }

    // =========================================================================
    // 5. UI RENDERING
    // =========================================================================
    function updateHeaderAndPlanUI() {
      const is90 = state.plan === '90';
      document.getElementById('header-title').textContent = is90 ? 'The Bible Timeline' : 'The Bible in a Year';
      document.getElementById('header-subtitle').textContent = is90
        ? '90-Day Narrative Books Reading Plan'
        : '365-Day Complete Catholic Bible Reading Plan';

      document.getElementById('plan-btn-90').className = is90
        ? 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-amber-600 text-white shadow'
        : 'px-3 py-1.5 rounded-lg text-xs font-bold transition text-stone-400 hover:text-stone-200';
      document.getElementById('plan-btn-365').className = !is90
        ? 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-amber-600 text-white shadow'
        : 'px-3 py-1.5 rounded-lg text-xs font-bold transition text-stone-400 hover:text-stone-200';

      document.getElementById('status-all-label').textContent = is90 ? 'All Days (90)' : 'All Days (365)';
      document.getElementById('status-partial-opt').style.display = is90 ? 'none' : 'block';
      document.getElementById('view-grid-btn').textContent = is90 ? '90 Grid' : '365 Grid';
    }

    function renderMonthPills() {
      const row = document.getElementById('month-filter-row');
      if (state.plan !== '90') {
        row.classList.add('hidden');
        row.classList.remove('flex');
        return;
      }
      row.classList.remove('hidden');
      row.classList.add('flex');

      const months = [
        { id: 'all', label: 'All 3 Months' },
        { id: 1, label: 'Month 1 (Days 1–30)' },
        { id: 2, label: 'Month 2 (Days 31–59)' },
        { id: 3, label: 'Month 3 (Days 60–90)' }
      ];

      row.innerHTML = months.map(m => {
        const active = String(state.activeMonth) === String(m.id);
        return `<button onclick="setMonthFilter('${m.id}')"
          class="px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition ${
            active ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }">${m.label}</button>`;
      }).join('');
    }

    function renderEraPills() {
      const container = document.getElementById('era-pills');
      const periods = getActivePeriods();

      let html = `<button onclick="setPeriodFilter('all')" class="px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
        state.activePeriod === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
      }">All Eras</button>`;

      periods.forEach(p => {
        const active = state.activePeriod === p.id;
        html += `<button onclick="setPeriodFilter('${p.id}')" style="${active ? `background:${p.color};color:#fff` : ''}"
          class="px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
            active ? '' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }">
          <span class="w-2 h-2 rounded-full" style="background:${ active ? '#fff' : p.color }"></span>
          ${p.name}
        </button>`;
      });
      container.innerHTML = html;
    }

    function updateSpotlightAndStats() {
      const days = getActiveDays();
      const total = days.length;
      const completedCount = days.filter(isDayComplete).length;
      const pct = total > 0 ? ((completedCount / total) * 100).toFixed(1) : '0.0';

      document.getElementById('stat-days').textContent = completedCount;
      document.getElementById('stat-total').textContent = total;
      document.getElementById('stat-pct').textContent = `${pct}% Complete`;
      document.getElementById('stat-bar').style.width = `${pct}%`;

      const nextDay = days.find(d => !isDayComplete(d)) || (total > 0 ? days[total - 1] : null);
      
      if (!nextDay) {
        document.getElementById('spot-title').textContent = 'All Complete!';
        document.getElementById('spot-readings').innerHTML = '';
        document.getElementById('spot-complete-btn').disabled = true;
        document.getElementById('spot-complete-btn').textContent = '✓ All Done';
        document.getElementById('spot-jump-btn').onclick = () => {};
        return;
      }

      const pInfo = ALL_PERIODS.find(p => p.id === nextDay.period);
      const spotPeriod = document.getElementById('spot-period');
      spotPeriod.textContent = pInfo.name;
      spotPeriod.style.backgroundColor = pInfo.color;

      const spotMonth = document.getElementById('spot-month');
      if (state.plan === '90') {
        spotMonth.textContent = `Month ${nextDay.month}`;
        spotMonth.classList.remove('hidden');
      } else {
        spotMonth.classList.add('hidden');
      }

      document.getElementById('spot-title').textContent = `Day ${nextDay.day}`;
      document.getElementById('spot-readings').innerHTML = nextDay.passages.map((pas, idx) => {
        const done = isPassageDone(nextDay, idx);
        const bold = isNarrative(pas) ? 'font-bold' : 'font-medium';
        return `<button onclick="togglePassage(${nextDay.day}, ${idx})"
          class="px-2.5 py-1 rounded-lg text-xs border transition flex items-center gap-1.5 ${bold} ${
            done ? 'bg-emerald-50 border-emerald-300 text-emerald-800 line-through' : 'bg-stone-50 border-stone-200 text-stone-800 hover:border-amber-400'
          }">
          <span>${done ? '✓' : '○'}</span> ${pas}
        </button>`;
      }).join('');

      document.getElementById('spot-complete-btn').onclick = () => toggleFullDay(nextDay.day);
      document.getElementById('spot-jump-btn').onclick = () => {
        state.activePeriod = 'all';
        state.activeMonth = 'all';
        document.getElementById('status-filter').value = 'all';
        document.getElementById('search-input').value = '';
        render();
        const el = document.getElementById(`day-card-${nextDay.day}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    }

    function render() {
      updateHeaderAndPlanUI();
      renderMonthPills();
      renderEraPills();
      updateSpotlightAndStats();

      const days = getActiveDays();
      const store = getActiveStore();
      const periods = getActivePeriods();
      const query = document.getElementById('search-input').value.trim().toLowerCase();
      const statusFilter = document.getElementById('status-filter').value;
      const content = document.getElementById('content-area');

      const filtered = days.filter(d => {
        if (state.plan === '90' && state.activeMonth !== 'all' && String(d.month) !== String(state.activeMonth)) return false;
        if (state.activePeriod !== 'all' && d.period !== state.activePeriod) return false;
        const comp = isDayComplete(d);
        const part = isDayPartial(d);
        if (statusFilter === 'unread' && (comp || part)) return false;
        if (statusFilter === 'partial' && !part) return false;
        if (statusFilter === 'completed' && !comp) return false;
        if (query) {
          const matchDay = `day ${d.day}` === query || `${d.day}` === query;
          const matchPassage = d.passages.some(p => p.toLowerCase().includes(query));
          if (!matchDay && !matchPassage) return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        content.innerHTML = `<div class="bg-white rounded-xl p-8 text-center text-stone-500 border border-stone-200">No readings match your current filters.</div>`;
        return;
      }

      if (state.view === 'grid') {
        content.innerHTML = `<div class="bg-white rounded-xl p-4 border border-stone-200 grid grid-cols-5 sm:grid-cols-10 gap-2">
          ${filtered.map(d => {
            const pInfo = ALL_PERIODS.find(p => p.id === d.period);
            const comp = isDayComplete(d);
            const part = isDayPartial(d);
            return `<button onclick="toggleFullDay(${d.day})" title="Day ${d.day}:${d.passages.join(' | ')}"
              class="p-2 rounded-lg border text-center transition flex flex-col items-center justify-center ${
                comp ? 'bg-emerald-600 text-white border-emerald-700 font-bold' :
                part ? 'bg-amber-50 text-amber-900 border-amber-400 font-semibold' :
                'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
              }">
              <span class="w-2 h-2 rounded-full mb-1" style="background:${comp ? '#fff' : pInfo.color}"></span>
              <span class="text-xs">${d.day}</span>
            </button>`;
          }).join('')}
        </div>`;
        return;
      }

      // Group by Period for Timeline View
      let html = '';
      periods.forEach(p => {
        const group = filtered.filter(d => d.period === p.id);
        if (group.length === 0) return;
        const doneInPeriod = group.filter(isDayComplete).length;

        html += `
        <section class="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div class="px-4 py-3 text-white flex items-center justify-between" style="background:${p.color}">
            <h3 class="font-serif-title font-bold text-sm sm:text-base tracking-wide">${p.name}</h3>
            <span class="text-xs font-semibold bg-black/25 px-2.5 py-0.5 rounded-full">${doneInPeriod} / ${group.length} Completed</span>
          </div>
          <div class="divide-y divide-stone-100">
            ${group.map(d => {
              const comp = isDayComplete(d);
              const hasNote = !!(store.notes[d.day] && store.notes[d.day].trim());
              return `
              <div id="day-card-${d.day}" class="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${comp ? 'bg-stone-50/70' : 'hover:bg-stone-50/40'}">
                <div class="flex items-start sm:items-center gap-3">
                  <button onclick="toggleFullDay(${d.day})" title="Mark entire day complete"
                    class="mt-0.5 sm:mt-0 w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold transition shrink-0 ${
                      comp ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 text-transparent hover:border-amber-500'
                    }">✓</button>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold ${comp ? 'text-stone-400 line-through' : 'text-stone-900'}">Day ${d.day}</span>${d.month ? `<span class="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded font-medium">Month ${d.month}</span>` : ''}
                      ${hasNote ? `<span class="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">Note saved</span>` : ''}
                    </div>
                    <div class="flex flex-wrap gap-1.5 mt-1.5">
                      ${d.passages.map((pas, idx) => {
                        const pDone = isPassageDone(d, idx);
                        const narrativeClass = isNarrative(pas) ? 'font-bold' : 'font-normal';
                        return `<button onclick="togglePassage(${d.day}, ${idx})"
                          class="px-2.5 py-1 rounded text-xs border transition flex items-center gap-1 ${narrativeClass} ${
                            pDone ? 'bg-emerald-50 border-emerald-200 text-emerald-700 line-through' : 'bg-white border-stone-200 text-stone-800 hover:border-amber-500'
                          }">
                          <span class="text-[10px]">${pDone ? '✓' : '○'}</span> ${pas}
                        </button>`;
                      }).join('')}
                    </div>
                  </div>
                </div>
                <div class="flex items-center justify-end gap-2 shrink-0">
                  <button onclick="openNoteModal(${d.day})" class="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition">
                    ✎ Reflection
                  </button>
                </div>
              </div>`;
            }).join('')}
          </div>
        </section>`;
      });

      content.innerHTML = html;
    }

    // =========================================================================
    // 6. REFLECTION MODAL & BACKUP / RESTORE
    // =========================================================================
    function openNoteModal(dayNum) {
      state.modalDay = dayNum;
      const days = getActiveDays();
      const store = getActiveStore();
      const d = days[dayNum - 1];
      document.getElementById('modal-plan-badge').textContent = state.plan === '90'
        ? '90-Day Plan • Scripture Reflection'
        : '365-Day Plan • Scripture Reflection';
      document.getElementById('modal-day-title').textContent = `Day ${d.day}`;
      document.getElementById('modal-readings-summary').textContent = d.passages.join('  •  ');
      document.getElementById('modal-note-input').value = store.notes[dayNum] || '';
      const modal = document.getElementById('note-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeNoteModal() {
      const modal = document.getElementById('note-modal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      state.modalDay = null;
    }

    function saveNoteFromModal() {
      if (!state.modalDay) return;
      const store = getActiveStore();
      store.notes[state.modalDay] = document.getElementById('modal-note-input').value;
      saveState();
      closeNoteModal();
      render();
    }

    function exportData() {
      const payload = {
        version: 2,
        plan90: state.data['90'],
        plan365: state.data['365']
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', 'bible_timeline_combined_backup.json');
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    function importData(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed.plan90 || parsed.plan365) {
            if (parsed.plan90) state.data['90'] = parsed.plan90;
            if (parsed.plan365) state.data['365'] = parsed.plan365;
          } else if (parsed.checked || parsed.notes) {
            // Single-plan backup imported into currently active plan
            const store = getActiveStore();
            if (parsed.checked) store.checked = parsed.checked;
            if (parsed.notes) store.notes = parsed.notes;
          }
          saveState();
          render();
          alert('Progress restored successfully!');
        } catch (err) {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    }

    // =========================================================================
    // 7. CONSOLE HELPER: CLEAR APP DATA (FOR DEV USE ONLY)
    // =========================================================================
    function clearAppData() {
      localStorage.removeItem(KEY_90);
      localStorage.removeItem(KEY_365);
      localStorage.removeItem(KEY_PREF);
      state.data = {
        '90': { checked: {}, notes: {} },
        '365': { checked: {}, notes: {} }
      };
      state.plan = '365';
      processedDays = { '90': [], '365': [] };
      isDataLoaded = false;
      render();
      console.log('Application data cleared from localStorage.');
    }

    // Initialization sequence: Load state, then load raw data, then render
    loadState();
    loadRawData().then(() => {
      render();
    });
