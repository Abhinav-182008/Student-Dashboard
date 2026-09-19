(() => {
  const params=new URLSearchParams(location.search), themeKey='iiits-theme';
  function storedTheme(){try{return localStorage.getItem(themeKey);}catch{return null;}}
  function apply(theme){if(!['light','dark'].includes(theme))return;document.documentElement.dataset.theme=theme;try{localStorage.setItem(themeKey,theme);}catch{}const label=document.getElementById('themeLabel'),icon=document.getElementById('themeIcon'),button=document.getElementById('themeToggle');if(label)label.textContent=theme==='dark'?'Light mode':'Dark mode';if(icon)icon.textContent=theme==='dark'?'☀':'☾';if(button)button.setAttribute('aria-pressed',String(theme==='dark'));}
  // Query propagation also works for local file pages with separate storage scopes.
  apply(params.get('theme')||storedTheme()||'light');
  addEventListener('storage',e=>{if(e.key===themeKey)apply(e.newValue);});
  addEventListener('pageshow',()=>apply(storedTheme()||document.documentElement.dataset.theme));
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
    const u=new URL(a.href,location.href);if(u.protocol!==location.protocol||u.host!==location.host||u.pathname.slice(0,u.pathname.lastIndexOf('/'))!==location.pathname.slice(0,location.pathname.lastIndexOf('/'))||!u.pathname.endsWith('.html'))return;
    u.searchParams.set('theme',document.documentElement.dataset.theme||'light');
    const dashboard=location.pathname.endsWith('/classroom_dashboard.html');
    const y=dashboard?String(Math.round(scrollY)):params.get('returnY');
    if(y!==null)u.searchParams.set('returnY',y);
    a.href=u.href;
  },true);
  if(location.pathname.endsWith('/classroom_dashboard.html')&&params.has('returnY')){
    const y=Number(params.get('returnY'));
    if(Number.isFinite(y)&&y>=0)addEventListener('load',()=>requestAnimationFrame(()=>requestAnimationFrame(()=>scrollTo(0,y))),{once:true});
  }
})();
