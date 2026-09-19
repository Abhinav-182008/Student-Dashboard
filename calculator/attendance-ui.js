window.AttendanceUI={
  renderResult(node,result){
    node.replaceChildren();
    if(Number.isFinite(result.percent)){
      const badge=document.createElement('span');badge.className='attendance-badge';
      badge.dataset.hue=result.percent>=75?'green':result.percent>=65?'orange':'red';
      badge.textContent=result.percent.toFixed(2)+'%';node.append(badge);
    }
    const message=document.createElement('span');message.className='attendance-explanation';message.textContent=result.text;node.append(message);
  },
  init(s,semester){const p=GPACore.plan(s,semester);if(!p)return;const old=s.attendance||{};s.attendance={lectures:p.lectures,labs:p.labs,missedLectures:old.missedLectures??0,missedLabs:p.labs?(old.missedLabs??0):0,medical:false};},
  fields(s,i){const d=s.attendance;if(!d)return '<p class="small">Attendance setup for this course is awaiting confirmation.</p>';const esc=v=>String(v).replace(/[&<>"']/g,'');return `<p class="small">${d.lectures} lecture hours${d.labs?' + '+d.labs+' lab sessions':''} · ${d.lectures+d.labs} semester attendance units</p><div class="attendance-fields" data-att-index="${i}"><label>Lecture hours missed<input type="number" data-att="missedLectures" min="0" max="${d.lectures}" step="0.5" value="${esc(d.missedLectures)}"></label>${d.labs?`<label>Lab sessions missed<input type="number" data-att="missedLabs" min="0" max="${d.labs}" step="1" value="${esc(d.missedLabs)}"></label>`:''}</div>`;}
};
