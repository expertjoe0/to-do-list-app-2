import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai';

// --- State & Config ---
const APP_KEY = 'zendo-tasks';
const API_KEY_STORAGE = 'gemini_api_key';
let tasks = JSON.parse(localStorage.getItem(APP_KEY)) || [];
let currentFilter = 'active';
let isOffline = !navigator.onLine;

// --- DOM Elements ---
const els = {
    taskList: document.getElementById('task-list'),
    pendingCount: document.getElementById('pending-count'),
    progressRing: document.getElementById('progress-ring'),
    progressText: document.getElementById('progress-text'),
    dateWeekday: document.getElementById('date-weekday'),
    dateFull: document.getElementById('date-full'),
    fab: document.getElementById('fab-add'),
    addModal: document.getElementById('add-modal'),
    closeModal: document.getElementById('close-modal'),
    modalBackdrop: document.getElementById('add-modal-backdrop'),
    taskInput: document.getElementById('task-input'),
    btnQuickAdd: document.getElementById('btn-quick-add'),
    btnBreakdown: document.getElementById('btn-breakdown'),
    modalInputState: document.getElementById('modal-input-state'),
    modalLoadingState: document.getElementById('modal-loading-state'),
    modalPreviewState: document.getElementById('modal-preview-state'),
    previewTitle: document.getElementById('preview-title'),
    previewSteps: document.getElementById('preview-steps'),
    prioritySelector: document.getElementById('priority-selector'),
    btnBack: document.getElementById('btn-back'),
    btnConfirmAi: document.getElementById('btn-confirm-ai'),
    filters: document.querySelectorAll('.filter-btn'),
    keyModal: document.getElementById('key-modal'),
    apiKeyInput: document.getElementById('api-key-input'),
    btnSaveKey: document.getElementById('btn-save-key'),
    btnCancelKey: document.getElementById('btn-cancel-key'),
    settingsBtn: document.getElementById('settings-btn'),
    offlineBanner: document.getElementById('offline-banner')
};

// --- Initialization ---
function init() {
    updateDate();
    render();
    setupEventListeners();
    window.addEventListener('online', () => updateOnlineStatus(true));
    window.addEventListener('offline', () => updateOnlineStatus(false));
}

function updateOnlineStatus(online) {
    isOffline = !online;
    els.offlineBanner.classList.toggle('hidden', online);
}

function updateDate() {
    const now = new Date();
    els.dateWeekday.textContent = now.toLocaleDateString(undefined, { weekday: 'long' });
    els.dateFull.textContent = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

// --- Rendering ---
function render() {
    // 1. Filter Tasks
    const filtered = tasks.filter(t => {
        if (currentFilter === 'active') return !t.completed;
        if (currentFilter === 'completed') return t.completed;
        return true;
    });

    // 2. Render List
    els.taskList.innerHTML = '';
    if (filtered.length === 0) {
        els.taskList.innerHTML = `
            <div class="text-center py-16 px-6 opacity-60">
                <div class="bg-white/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                </div>
                <p class="text-slate-500 font-bold">No tasks found</p>
            </div>`;
    } else {
        filtered.forEach(task => {
            const el = createTaskElement(task);
            els.taskList.appendChild(el);
        });
    }

    // 3. Update Stats & Progress
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    const pending = tasks.filter(t => !t.completed).length;

    els.pendingCount.textContent = pending;
    els.progressText.textContent = `${percent}%`;
    
    // Circle Config (Radius 30 for r=30, circumference ~188.5)
    const circumference = 188.5;
    const offset = circumference - (percent / 100) * circumference;
    els.progressRing.style.strokeDashoffset = offset;
    
    // Save
    localStorage.setItem(APP_KEY, JSON.stringify(tasks));
}

function createTaskElement(task) {
    const div = document.createElement('div');
    const priorityColors = {
        'High': 'border-l-red-500 bg-red-50 text-red-700',
        'Medium': 'border-l-orange-500 bg-orange-50 text-orange-700',
        'Low': 'border-l-emerald-500 bg-emerald-50 text-emerald-700'
    };
    const pConfig = priorityColors[task.priority] || priorityColors['Medium'];
    const pIcon = task.priority === 'High' ? '🔥' : task.priority === 'Medium' ? '⚡' : '☕';

    // Calculate subtask progress
    const subTotal = task.subtasks.length;
    const subDone = task.subtasks.filter(s => s.completed).length;
    const subProgress = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;
    
    const isExpanded = task.isExpanded && subTotal > 0;

    div.className = `group relative bg-white rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden animate-slide-up mb-3 ${task.completed ? 'opacity-50 grayscale-[0.5]' : ''}`;
    div.innerHTML = `
        <div class="absolute left-0 top-0 bottom-0 w-1.5 ${pConfig.split(' ')[0]}"></div>
        <div class="p-4 pl-5 flex items-start gap-4">
            <button class="toggle-btn mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 active:scale-90 ${task.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 bg-slate-50 hover:border-indigo-400'}">
                ${task.completed ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
            </button>
            <div class="flex-1 min-w-0 cursor-pointer content-area">
                <h3 class="text-lg font-bold text-slate-800 leading-tight ${task.completed ? 'line-through text-slate-400' : ''}">${task.text}</h3>
                <div class="mt-2 flex flex-wrap items-center gap-3">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${pConfig.split(' ').slice(1).join(' ')}">
                        <span>${pIcon}</span> ${task.priority}
                    </span>
                </div>
                ${subTotal > 0 ? `
                <div class="mt-3">
                    <div class="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>${subDone}/${subTotal} steps</span>
                        <span>${subProgress}%</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-indigo-500 transition-all duration-500" style="width: ${subProgress}%"></div>
                    </div>
                </div>` : ''}
            </div>
            <div class="flex flex-col gap-1">
                <button class="delete-btn p-2 text-slate-300 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                ${subTotal > 0 ? `
                <button class="expand-btn p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform ${isExpanded ? 'rotate-180' : ''}"><path d="m6 9 6 6 6-6"/></svg>
                </button>` : ''}
            </div>
        </div>
        ${isExpanded ? `
        <div class="bg-slate-50/50 border-t border-slate-100 px-5 py-3 space-y-3">
            ${task.subtasks.map(sub => `
                <div class="flex items-center gap-3 animate-slide-up">
                    <button class="sub-toggle-btn w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${sub.completed ? 'bg-slate-400 border-slate-400 text-white' : 'bg-white border-slate-300'}" data-id="${sub.id}">
                        ${sub.completed ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                    </button>
                    <span class="text-sm font-medium ${sub.completed ? 'line-through text-slate-400' : 'text-slate-600'}">${sub.text}</span>
                </div>
            `).join('')}
        </div>` : ''}
    `;

    // Events
    div.querySelector('.toggle-btn').onclick = (e) => {
        e.stopPropagation();
        if(!task.completed) {
            // Visual feedback delay
            e.currentTarget.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
            e.currentTarget.classList.add('bg-indigo-500', 'border-indigo-500', 'text-white');
            setTimeout(() => { toggleTask(task.id); }, 500);
        } else {
            toggleTask(task.id);
        }
    };
    div.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteTask(task.id); };
    
    const contentArea = div.querySelector('.content-area');
    const expandBtn = div.querySelector('.expand-btn');
    if (contentArea) contentArea.onclick = () => toggleExpand(task.id);
    if (expandBtn) expandBtn.onclick = (e) => { e.stopPropagation(); toggleExpand(task.id); };

    div.querySelectorAll('.sub-toggle-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            toggleSubtask(task.id, btn.dataset.id);
        };
    });

    return div;
}

// --- Logic ---
function addTask(text, priority = 'Medium', subtasks = []) {
    const newTask = {
        id: crypto.randomUUID(),
        text,
        priority,
        completed: false,
        createdAt: Date.now(),
        subtasks: subtasks.map(st => ({ id: crypto.randomUUID(), text: st, completed: false })),
        isExpanded: false
    };
    tasks.unshift(newTask);
    render();
}

function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined } : t);
    render();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    render();
}

function toggleExpand(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, isExpanded: !t.isExpanded } : t);
    render();
}

function toggleSubtask(taskId, subId) {
    tasks = tasks.map(t => {
        if (t.id !== taskId) return t;
        return {
            ...t,
            subtasks: t.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s)
        };
    });
    render();
}

// --- Gemini AI ---
async function handleBreakdown() {
    const text = els.taskInput.value.trim();
    if (!text) return;

    // Check API Key
    const apiKey = getApiKey();
    if (!apiKey) {
        showKeyModal();
        return;
    }

    if (isOffline) {
        alert("You are offline. Cannot use AI features.");
        return;
    }

    // UI Transition
    els.modalInputState.classList.add('hidden');
    els.modalLoadingState.classList.remove('hidden');
    els.modalLoadingState.classList.add('flex');

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: "You are a helpful productivity assistant. Break down the task into 3-5 small actionable steps. Return JSON only."
        });

        const prompt = `Task: "${text}". 
        Output JSON format:
        {
          "refinedTitle": "string",
          "priority": "Low" | "Medium" | "High",
          "subtasks": ["string", "string"]
        }`;

        const result = await model.generateContent({
             contents: [{ role: 'user', parts: [{ text: prompt }] }],
             generationConfig: { responseMimeType: "application/json" }
        });
        
        const responseText = result.response.text();
        const data = JSON.parse(responseText);

        showPreview(data);
    } catch (e) {
        console.error(e);
        alert("AI Error: " + e.message);
        resetModal();
    }
}

function showPreview(data) {
    els.modalLoadingState.classList.add('hidden');
    els.modalLoadingState.classList.remove('flex');
    els.modalPreviewState.classList.remove('hidden');

    // Populate Preview
    els.previewTitle.value = data.refinedTitle || els.taskInput.value;
    
    // Priority
    const priorities = ['Low', 'Medium', 'High'];
    els.prioritySelector.innerHTML = priorities.map(p => `
        <button class="preview-p-btn py-2 rounded-xl text-sm font-bold border-2 transition-all ${data.priority === p ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-400'}" data-val="${p}">${p}</button>
    `).join('');
    
    // Add click handlers to generated priority buttons
    els.prioritySelector.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
             els.prioritySelector.querySelectorAll('button').forEach(b => b.className = 'preview-p-btn py-2 rounded-xl text-sm font-bold border-2 bg-white border-slate-100 text-slate-400');
             btn.className = 'preview-p-btn py-2 rounded-xl text-sm font-bold border-2 bg-indigo-100 border-indigo-200 text-indigo-700';
             btn.dataset.selected = "true";
        };
        if(btn.textContent === data.priority) btn.click();
    });

    // Subtasks
    els.previewSteps.innerHTML = (data.subtasks || []).map(step => `
        <li class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">•</div>
            <input class="flex-1 bg-transparent border-b border-transparent focus:border-indigo-200 outline-none text-sm font-medium" value="${step}" />
        </li>
    `).join('');
    
    // Confirm Handler
    els.btnConfirmAi.onclick = () => {
        const title = els.previewTitle.value;
        const pBtn = Array.from(els.prioritySelector.querySelectorAll('button')).find(b => b.className.includes('bg-indigo-100'));
        const priority = pBtn ? pBtn.textContent : 'Medium';
        const steps = Array.from(els.previewSteps.querySelectorAll('input')).map(i => i.value).filter(v => v.trim());
        
        addTask(title, priority, steps);
        closeModal();
    };
}

function resetModal() {
    els.taskInput.value = '';
    els.modalInputState.classList.remove('hidden');
    els.modalLoadingState.classList.add('hidden');
    els.modalLoadingState.classList.remove('flex');
    els.modalPreviewState.classList.add('hidden');
}

function closeModal() {
    els.addModal.classList.add('hidden');
    resetModal();
}

function openModal() {
    els.addModal.classList.remove('hidden');
    els.taskInput.focus();
}

// --- API Key Management ---
function getApiKey() {
    // 1. Check Window (Netlify Injection)
    if (window.GEMINI_API_KEY) return window.GEMINI_API_KEY;
    // 2. Check LocalStorage
    return localStorage.getItem(API_KEY_STORAGE);
}

function showKeyModal() {
    els.keyModal.classList.remove('hidden');
    els.apiKeyInput.value = localStorage.getItem(API_KEY_STORAGE) || '';
    els.apiKeyInput.focus();
}

// --- Event Listeners ---
function setupEventListeners() {
    els.fab.onclick = openModal;
    els.closeModal.onclick = closeModal;
    els.modalBackdrop.onclick = closeModal;
    
    els.btnQuickAdd.onclick = () => {
        if (els.taskInput.value.trim()) {
            addTask(els.taskInput.value.trim());
            closeModal();
        }
    };
    
    els.taskInput.onkeydown = (e) => {
        if(e.key === 'Enter') els.btnQuickAdd.click();
    };

    els.btnBreakdown.onclick = handleBreakdown;
    els.btnBack.onclick = () => {
        els.modalPreviewState.classList.add('hidden');
        els.modalInputState.classList.remove('hidden');
    };

    // Filters
    els.filters.forEach(btn => {
        btn.onclick = () => {
            els.filters.forEach(b => {
                b.classList.remove('bg-indigo-600', 'text-white', 'shadow-indigo-500/30', 'scale-105');
                b.classList.add('bg-white', 'text-slate-500', 'border', 'border-white/50');
            });
            btn.classList.remove('bg-white', 'text-slate-500', 'border');
            btn.classList.add('bg-indigo-600', 'text-white', 'shadow-indigo-500/30', 'scale-105');
            currentFilter = btn.dataset.filter;
            render();
        };
    });

    // API Key
    els.settingsBtn.onclick = showKeyModal;
    els.btnCancelKey.onclick = () => els.keyModal.classList.add('hidden');
    els.btnSaveKey.onclick = () => {
        const key = els.apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem(API_KEY_STORAGE, key);
            els.keyModal.classList.add('hidden');
        }
    };
}

// Run
init();
