/* Browser-local prototype model. No account access or server-side data collection. */
window.TW = (() => {
  const KEY='timeworth-ui-v2';
  const round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
  const uid=()=>crypto.randomUUID();
  const today=()=>new Date().toLocaleDateString('sv-SE');
  const month=()=>today().slice(0,7);
  const shiftMonth=(m,n)=>{const [y,mm]=m.split('-').map(Number),d=new Date(y,mm-1+n,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;};
  const dueDate=(m,day)=>{const [y,mm]=m.split('-').map(Number);return `${m}-${String(Math.min(day,new Date(y,mm,0).getDate())).padStart(2,'0')}`;};
  function finance(price,terms=1,mode='zero',rate=0,upfront=0){
    const p=Math.round(price*100),n=Math.max(1,Math.round(terms)),fee=Math.round(upfront*100),r=rate/100/12;
    let rows=[],remaining=p;
    const payment=r?p*r/(1-Math.pow(1+r,-n)):p/n;
    for(let i=0;i<n;i++){
      const interest=mode==='apr'?Math.round(remaining*r):mode==='flat'?Math.round(p*rate/100):0;
      const principal=i===n-1?remaining:mode==='apr'?Math.min(remaining,Math.round(payment)-interest):Math.floor(p/n);
      remaining-=principal;
      rows.push({principal:principal/100,interest:interest/100,fee:i===0?fee/100:0,total:(principal+interest+(i===0?fee:0))/100});
    }
    const total=round(rows.reduce((s,r)=>s+r.total,0)),cost=round(total-price);
    let apr=0;if(cost>0&&p>0){let lo=0,hi=1;while(hi<1e12&&rows.reduce((s,r,j)=>s+r.total/Math.pow(1+hi,j+1),0)>price)hi*=2;for(let i=0;i<80;i++){const k=(lo+hi)/2,pv=rows.reduce((s,r,j)=>s+r.total/Math.pow(1+k,j+1),0);if(pv>price)lo=k;else hi=k;}apr=(lo+hi)/2*12*100;}
    return {rows,total,cost,apr};
  }
  function makeDebt(d){const f=finance(d.principal,d.terms,d.mode,d.rate,d.upfront);return {...d,schedule:f.rows.map((r,i)=>({...r,id:uid(),date:dueDate(shiftMonth(d.firstMonth,i),d.day),paid:false}))};}
  function defaults(){const m=month(),day=today();if(window.TW_NATIVE)return {version:2,nativeSetup:false,work:{salary:0,days:22,hours:8,commuteMinutes:0,workCost:0,basis:'work'},budgets:{'日常':0,'购物':0,'居住':0},dark:false,transactions:[],debts:[],wishes:[],goals:[],imports:[],v3:{theme:'frost',sources:[{id:'alipay',name:'支付宝',kind:'cash'},{id:'wechat',name:'微信',kind:'cash'},{id:'bank',name:'银行卡',kind:'cash'},{id:'credit',name:'信用账户',kind:'credit'}],cash:{opening:0,incomes:[],fixed:[],anchor:null}},v4:{density:'comfortable',wallpaper:null}};return {version:2,work:{salary:10000,days:22,hours:8,commuteMinutes:60,workCost:600,basis:'work'},budgets:{'日常':1800,'购物':1180,'居住':3300},dark:false,
    transactions:[{id:'coffee',name:'街角咖啡',amount:24,type:'expense',category:'日常',date:day,account:'支付宝',order:'coffee-demo',icon:'coffee'},{id:'lunch',name:'一顿好好吃的午饭',amount:38,type:'expense',category:'日常',date:day,account:'微信',order:'lunch-demo',icon:'food'},{id:'grocery',name:'一周的日常补给',amount:286,type:'expense',category:'日常',date:dueDate(m,Math.min(20,Number(day.slice(-2)))),account:'支付宝',icon:'bag'},{id:'shoes',name:'舒服的运动鞋',amount:432,type:'expense',category:'购物',date:dueDate(m,Math.min(18,Number(day.slice(-2)))),account:'银行卡',icon:'bag'},{id:'rent',name:'这个月的房租',amount:2500,type:'expense',category:'居住',date:dueDate(m,1),account:'银行卡',icon:'house'}],
    debts:[makeDebt({id:'huabei',name:'花呗',principal:2880,terms:4,mode:'zero',rate:0,upfront:0,firstMonth:m,day:25}),makeDebt({id:'baitiao',name:'京东白条',principal:2160,terms:4,mode:'zero',rate:0,upfront:0,firstMonth:m,day:28})],
    wishes:[{id:'headphones',name:'降噪耳机',price:1999,icon:'headphone',note:'让通勤安静一点'},{id:'weekend',name:'一场轻装旅行',price:4800,icon:'plane',note:'去一个一直想去的地方'}],
    goals:[{id:'mountains',name:'去看一次山海',target:8000,monthly:1600,icon:'mountain',entries:[{id:'opening',amount:3200,date:dueDate(shiftMonth(m,-1),1),note:'此前已存'}]}],imports:[]};}
  let state=defaults(),storageError=false;
  try{const v=JSON.parse(localStorage.getItem(KEY));if(v?.version===2&&(v.work?.salary>0||(window.TW_NATIVE&&v.nativeSetup===false))&&Array.isArray(v.debts)&&Array.isArray(v.goals))state=v;else{const old=JSON.parse(localStorage.getItem('timeworth-ui-v1'));if(old?.salary>0){state.work={...state.work,salary:old.salary,days:old.days,hours:old.hours,commuteMinutes:Number.isFinite(old.commute)?Math.round(old.commute*60):60,workCost:Number.isFinite(old.workCost)?old.workCost:600};state.dark=!!old.dark;if(Array.isArray(old.transactions)){state.transactions=old.transactions.map(t=>{let date=t.date==='今天'?today():t.date==='昨天'?new Date(Date.now()-86400000).toLocaleDateString('sv-SE'):null;const parts=String(t.date).match(/(\d+)月(\d+)日/);if(!date&&parts)date=dueDate(month().slice(0,4)+'-'+parts[1].padStart(2,'0'),Number(parts[2]));return {...t,date:date||today(),type:'expense'};});}if(old.wishes?.length)state.wishes=old.wishes.map(w=>({...w,id:uid(),note:''}));if(Number.isFinite(old.saved))state.goals[0].entries[0].amount=old.saved;}}}catch{storageError=true;}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{storageError=true;return false;}};
  const clone=v=>JSON.parse(JSON.stringify(v));
  const rate=(basis=state.work.basis)=>{const w=state.work;return basis==='real'?Math.max(0,w.salary-w.workCost)/(w.days*(w.hours+w.commuteMinutes/60)):w.salary/(w.days*w.hours);};
  const monthlyTx=(m=month())=>state.transactions.filter(t=>t.date.startsWith(m));
  const spending=(m=month(),category)=>round(monthlyTx(m).filter(t=>!category||t.category===category).reduce((s,t)=>s+(t.type==='refund'?-1:1)*t.amount,0));
  const installments=(m=month())=>state.debts.flatMap(d=>d.schedule.filter(r=>r.date.startsWith(m)).map(r=>({...r,debtId:d.id,name:d.name})));
  const due=(m=month(),unpaid=false)=>round(installments(m).filter(r=>!unpaid||!r.paid).reduce((s,r)=>s+r.total,0));
  const balance=g=>round(g.entries.reduce((s,e)=>s+e.amount,0));
  const goalAllocation=()=>round(state.goals.reduce((s,g)=>s+g.entries.filter(e=>e.date.startsWith(month())).reduce((a,e)=>a+e.amount,0),0));
  const budgetReserved=()=>round(Object.entries(state.budgets).reduce((s,[k,v])=>s+Math.max(v,spending(month(),k)),0));
  const available=()=>round(state.work.salary-budgetReserved()-due()-goalAllocation());
  const fingerprint=t=>[t.account,t.order||'',t.date,t.name,round(t.amount),t.type].join('|');
  const duplicate=t=>state.imports.includes(t.key)||state.transactions.some(x=>fingerprint(x)===fingerprint(t));
  const reset=()=>{state=defaults();save();return state;};
  return {get state(){return state;},get storageError(){return storageError;},save,round,uid,today,month,shiftMonth,dueDate,finance,makeDebt,clone,rate,monthlyTx,spending,installments,due,balance,goalAllocation,budgetReserved,available,fingerprint,duplicate,reset};
})();
