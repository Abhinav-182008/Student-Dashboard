(function(root) {
  const grades={O:10,A:9,B:8,C:7,D:6,P:5,F:0}, order=Object.keys(grades);
  const descriptions={O:'Outstanding',A:'Very good',B:'Good',C:'Above average',D:'Average',P:'Pass',F:'Fail'};
  const creditCap=category=>category==='SSHAM'?2:category==='Institute Core'?4:40;
  function attendance(attended,held,medical=false){
    if(attended===''&&held==='')return {kind:'none',text:''};
    const a=Number(attended),h=Number(held);
    if(attended===''||held===''||!Number.isFinite(a)||!Number.isFinite(h)||a<0||h<=0||a>h)return {kind:'invalid',text:'Check the missed and counted attendance units.'};
    const percent=a/h*100,needed=Math.max(0,Math.ceil((.75*h-a)/.25)),skip=Math.max(0,Math.floor(a/.75-h));
    const kind=percent<50?'fail':percent<65?(medical?'review':'fail'):percent<75?(medical?'safe':'penalty'):'safe';
    const text=percent<50?'Below 50% physical attendance: not eligible for medical/activity leave; F.':percent<65?(medical?'Below 65%: F is the default. Case-specific relaxation needs Dean forwarding and Director approval; use the official grade once decided. Adjusted GPA pending.':'Below 65%: F. Any exceptional relaxation needs Dean forwarding and Director approval.'):percent<75?(medical?'Institute-confirmed medical exemption: no downgrade applied.':'Below 75% after any approved claims: one subject grade down. P becomes F.'):'75% or above: no grade penalty.';
    return {percent,needed,skip,kind,text};
  }
  function plan(s,semester){
    if(Number(semester)!==1||!['ICS101','IMA101','IEC101','IEC102','ISK101','SSH001'].includes(s.code||s.id))return null;
    const lab=['ICS101','IEC101','IEC102'].includes(s.code||s.id);
    return {lectures:(s.category==='SSHAM'?24:lab?36:48),labs:lab?12:0};
  }
  function missedAttendance(s){
    if(!s.attendance)return attendance(s.attended??'',s.held??'',false);
    const d=s.attendance,keys=['lectures','labs','missedLectures','missedLabs'];
    if(keys.some(k=>d[k]===''||!Number.isFinite(Number(d[k]))||Number(d[k])<0)||!Number.isInteger(Number(d.labs))||!Number.isInteger(Number(d.missedLabs))||Number(d.missedLectures)>Number(d.lectures)||Number(d.missedLabs)>Number(d.labs))return {kind:'invalid',text:'Missed hours/sessions must be between zero and the corresponding counted total. Lab sessions must be whole numbers.'};
    const held=Number(d.lectures)+Number(d.labs),missed=Number(d.missedLectures)+Number(d.missedLabs);
    return attendance(held-missed,held,false);
  }

  function subject(s,apply){
    const att=apply?missedAttendance(s):{kind:'none',text:''};
    if(!Number.isFinite(Number(s.credits))||Number(s.credits)<=0||Number(s.credits)>creditCap(s.category)||!s.name.trim())return {error:'Enter valid credits within the category limit.',att};
    let grade=s.grade;
    if(apply&&att.kind==='fail')grade='F';
    if(!(grade in grades))return {error:'Choose a grade.',att,unselected:true};
    if(apply&&['invalid','review','none'].includes(att.kind))return {error:att.text||'Enter attendance for this subject.',att};
    if(apply&&att.kind==='penalty')grade=order[Math.min(order.indexOf(grade)+1,order.length-1)];
    return {grade,points:grades[grade],credits:Number(s.credits),failed:grade==='F',att};
  }
  function aggregate(rows,apply){
    const results=rows.map(s=>subject(s,apply)),complete=rows.length>0&&results.every(r=>!r.error);
    const credits=results.reduce((n,r)=>n+(r.credits||0),0),points=results.reduce((n,r)=>n+(r.credits||0)*(r.points||0),0);
    const blocked=results.some(r=>r.error&&!r.unselected);
    const totalCredits=rows.reduce((n,s)=>n+(Number(s.credits)>0&&Number(s.credits)<=creditCap(s.category)?Number(s.credits):0),0);
    const earnedCredits=results.reduce((n,r)=>n+(!r.error&&!r.failed?r.credits:0),0);
    return {complete,credits,totalCredits,earnedCredits,points,gpa:credits&&!blocked?points/totalCredits:null,failed:results.filter(r=>r.failed).length,results};
  }
  const api={grades,descriptions,creditCap,attendance,plan,missedAttendance,subject,aggregate};
  if(typeof module!=='undefined')module.exports=api;else root.GPACore=api;
})(typeof window!=='undefined'?window:this);
