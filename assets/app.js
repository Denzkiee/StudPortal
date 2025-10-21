// Interactive features: animations, dark mode, editable profile, grades sort, course modal, todo list
document.addEventListener('DOMContentLoaded', () => {
  // --- Entry animations ---
  requestAnimationFrame(()=>{
    document.querySelectorAll('.anim-card').forEach((el,i)=>{
      setTimeout(()=>{ el.style.opacity='1'; el.style.transform='translateY(0) scale(1)'; }, 120 + i*80);
    });
    document.querySelectorAll('.fade-in').forEach((el,i)=>{
      setTimeout(()=>{ el.style.opacity='1'; el.style.transform='translateY(0)'; }, 140 + i*60);
    });
  });

  // --- Dark mode (persist in localStorage) ---
  const darkKey = 'uniportal_dark';
  function applyDark(isDark){
    document.body.classList.toggle('dark', !!isDark);
    // change icon
    document.querySelectorAll('#dark-toggle, #dark-toggle-2, #dark-toggle-3, #dark-toggle-4').forEach(btn=>{
      if(btn) btn.textContent = isDark ? '☀️' : '🌙';
    });
  }
  const savedDark = localStorage.getItem(darkKey) === '1';
  applyDark(savedDark);
  document.querySelectorAll('#dark-toggle, #dark-toggle-2, #dark-toggle-3, #dark-toggle-4').forEach(btn=>{
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      const isDark = !document.body.classList.contains('dark');
      applyDark(isDark);
      localStorage.setItem(darkKey, isDark ? '1' : '0');
    });
  });

  // --- Profile edit toggle ---
  const editBtn = document.getElementById('edit-profile-btn');
  if(editBtn){
    const phone = document.getElementById('phone');
    const address = document.getElementById('address');
    const saveBtn = document.getElementById('save-profile');
    const cancelBtn = document.getElementById('cancel-profile');
    let original = {};
    editBtn.addEventListener('click', ()=>{
      original.phone = phone.value;
      original.address = address.value;
      phone.removeAttribute('readonly');
      address.removeAttribute('readonly');
      saveBtn.style.display = 'inline-block';
      cancelBtn.style.display = 'inline-block';
      editBtn.style.display = 'none';
    });
    cancelBtn.addEventListener('click', ()=>{
      phone.value = original.phone;
      address.value = original.address;
      phone.setAttribute('readonly', '');
      address.setAttribute('readonly', '');
      saveBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      editBtn.style.display = 'inline-block';
    });
    saveBtn.addEventListener('click', ()=>{
      phone.setAttribute('readonly', '');
      address.setAttribute('readonly', '');
      saveBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      editBtn.style.display = 'inline-block';
      // fake save, show a small notification
      toast('Profile saved (sample)');
    });
  }

  // --- Simple toast ---
  function toast(message, time=1400){
    const t = document.createElement('div');
    t.className = 'simple-toast';
    t.textContent = message;
    Object.assign(t.style,{position:'fixed',right:'18px',bottom:'18px',background:'#0f1724',color:'#fff',padding:'10px 12px',borderRadius:'10px',boxShadow:'0 8px 24px rgba(2,6,23,0.2)',zIndex:9999,opacity:0,transform:'translateY(6px)',transition:'all .28s'});
    document.body.appendChild(t);
    requestAnimationFrame(()=>{ t.style.opacity=1; t.style.transform='translateY(0)'; });
    setTimeout(()=>{ t.style.opacity=0; t.style.transform='translateY(6px)'; setTimeout(()=>t.remove(),320); }, time);
  }

  // --- Grades sorting ---
  const gradesTable = document.getElementById('grades-table');
  if(gradesTable){
    const tbody = gradesTable.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const headers = gradesTable.querySelectorAll('thead th');
    headers.forEach((th, idx)=>{
      th.style.userSelect='none';
      th.addEventListener('click', ()=>{
        const key = th.dataset.key || idx;
        // determine direction
        const dir = th._dir ? -th._dir : -1;
        headers.forEach(h=>h._dir = 0);
        th._dir = dir;
        // extract rows to sort
        const sorted = rows.sort((a,b)=>{
          const aVal = a.children[idx].textContent.trim();
          const bVal = b.children[idx].textContent.trim();
          // numeric if credits or GPA-like
          if(!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal))){
            return dir * (parseFloat(aVal) - parseFloat(bVal));
          }
          // grade compare: map A+ A A- B+ ...
          const gradeOrder = {'A+':12,'A':11,'A-':10,'B+':9,'B':8,'B-':7,'C+':6,'C':5,'C-':4,'D':3,'F':0};
          if(gradeOrder[aVal] !== undefined || gradeOrder[bVal] !== undefined){
            return dir * ((gradeOrder[bVal]||0) - (gradeOrder[aVal]||0));
          }
          return dir * aVal.localeCompare(bVal);
        });
        // reattach
        sorted.forEach(r=>tbody.appendChild(r));
      });
    });
  }

  // --- Course details modal ---
  const modal = document.getElementById('course-modal');
  if(modal){
    document.querySelectorAll('.course .course-details').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        const article = btn.closest('.course');
        try{
          const data = JSON.parse(article.getAttribute('data-course'));
          document.getElementById('modal-title').textContent = data.title;
          document.getElementById('modal-instructor').textContent = 'Instructor: ' + data.instructor;
          document.getElementById('modal-schedule').textContent = 'Schedule: ' + data.schedule + ' · Credits: ' + data.credits;
          document.getElementById('modal-desc').textContent = data.desc;
          modal.setAttribute('aria-hidden','false');
        }catch(e){ console.error(e); }
      });
    });
    document.getElementById('modal-close').addEventListener('click', ()=> modal.setAttribute('aria-hidden','true'));
    modal.addEventListener('click', (ev)=>{ if(ev.target === modal) modal.setAttribute('aria-hidden','true'); });
  }

  // --- To-do list (localStorage) ---
  const todoKey = 'uniportal_todos_v1';
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  function loadTodos(){
    const raw = localStorage.getItem(todoKey);
    let arr = [];
    try{ arr = raw ? JSON.parse(raw) : []; }catch(e){ arr = []; }
    todoList.innerHTML = '';
    arr.forEach((t, i)=>{
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHtml(t)}</span><div class="todo-actions"><button class="btn small" data-i="${i}">Remove</button></div>`;
      todoList.appendChild(li);
    });
    // attach removes
    todoList.querySelectorAll('button[data-i]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const i = Number(b.dataset.i);
        const current = JSON.parse(localStorage.getItem(todoKey)||'[]');
        current.splice(i,1);
        localStorage.setItem(todoKey, JSON.stringify(current));
        loadTodos();
      });
    });
  }
  function saveTodo(text){
    const cur = JSON.parse(localStorage.getItem(todoKey) || '[]');
    cur.push(text);
    localStorage.setItem(todoKey, JSON.stringify(cur));
    loadTodos();
  }
  if(todoForm){
    todoForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const v = todoInput.value.trim();
      if(!v) return;
      saveTodo(v);
      todoInput.value = '';
      toast('Task added');
    });
    loadTodos();
  }

  // helper - escape
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]; }); }
});
