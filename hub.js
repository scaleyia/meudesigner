/* ============ MeuDesigner · Hub compartilhado (agenda, contas, desempenho, planejador) ============
   Um único script para todas as páginas do app logado. Cada página inclui só as
   seções que quer; cada render() é guardado por existência do container. */
(function(){
  var A = window.MDAuth;
  var $ = function(id){ return document.getElementById(id); };
  var user=null, accounts=[], posts=[];
  var calRef = new Date(); calRef.setDate(1);

  var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var DOW=['dom','seg','ter','qua','qui','sex','sáb'];
  function pad(n){ return ('0'+n).slice(-2); }
  function fmtDate(d){ return pad(d.getDate())+'/'+pad(d.getMonth()+1)+' '+pad(d.getHours())+':'+pad(d.getMinutes()); }
  function autoType(t){ return t==='BUSINESS'||t==='CREATOR'; }

  // ---------- contas ----------
  async function fetchAccounts(){
    try{ var r=await A.sb.from('social_accounts').select('id,username,account_type,ativo,conectado_em').eq('user_id',user.id).order('conectado_em',{ascending:false});
      accounts=(r.data||[]); }catch(e){ accounts=[]; }
    renderAccounts();
  }
  function renderAccounts(){
    var box=$('accList'); if(!box) return;
    if(!accounts.length){ box.innerHTML='<div class="empty">Nenhuma conta conectada ainda. Conecte para publicar automaticamente ou receber lembretes.</div>'; return; }
    box.innerHTML=accounts.map(function(a){
      var auto=autoType(a.account_type);
      return '<div class="acc"><div class="ig">IG</div><div class="who"><b>@'+(a.username||'conta')+'</b><span>'+(a.account_type||'PERSONAL')+(a.ativo?'':' · inativa')+'</span></div>'+
        '<span class="pill '+(auto?'auto':'warn')+'" style="margin-left:auto">'+(auto?'publica sozinho':'lembrete')+'</span>'+
        '<button class="mini danger" data-dis="'+a.id+'">Desconectar</button></div>';
    }).join('');
    box.querySelectorAll('[data-dis]').forEach(function(b){ b.onclick=function(){ disconnect(b.getAttribute('data-dis')); }; });
  }
  async function disconnect(id){
    if(!confirm('Desconectar esta conta? Agendamentos automáticos dela viram lembrete.')) return;
    try{ await A.sb.from('social_accounts').update({ativo:false}).eq('id',id); await fetchAccounts(); }catch(e){ alert('Erro: '+e.message); }
  }
  async function connect(){
    var msg=$('connectMsg'); if(msg) msg.textContent='Abrindo conexão com o Facebook/Instagram…';
    try{ var s=await A.getSession(); if(!s){ location.href='/login.html'; return; }
      var ret=encodeURIComponent(location.origin+'/contas.html');
      location.href=window.SUPABASE_URL+'/functions/v1/instagram-oauth?action=start&token='+encodeURIComponent(s.access_token)+'&return='+ret;
    }catch(e){ if(msg) msg.textContent='Erro: '+e.message; }
  }

  // ---------- agendamentos / posts ----------
  async function loadPosts(){
    try{ var r=await A.sb.from('agendamentos').select('id,titulo,legenda,image_urls,scheduled_at,status,modo,social_account_id,ig_media_id,erro').eq('user_id',user.id).order('scheduled_at',{ascending:true});
      posts=(r.data||[]); renderCalendar(); renderPosts(); renderStats(); renderDashboard();
    }catch(e){ if($('postList')) $('postList').innerHTML='<div class="empty">Erro: '+e.message+'</div>'; }
  }
  function renderPosts(){
    var box=$('postList'); if(!box) return;
    if(!posts.length){ box.innerHTML='<div class="empty">Você ainda não agendou nada. Crie um carrossel e clique em “Agendar publicação”.</div>'; return; }
    box.innerHTML=posts.map(function(p){
      var d=new Date(p.scheduled_at); var thumb=(p.image_urls&&p.image_urls[0])||'';
      var acc=accounts.find(function(a){return a.id===p.social_account_id;});
      var canPublish=(p.status==='agendado'||p.status==='aguardando_usuario'||p.status==='falhou');
      return '<div class="post">'+
        (thumb?'<img class="thumb" src="'+thumb+'" alt="">':'<div class="thumb"></div>')+
        '<div class="info"><b>'+(p.titulo||'Carrossel')+'</b><span>'+fmtDate(d)+' · '+(acc?('@'+acc.username):'sem conta')+' · '+(p.modo==='auto'?'auto':'lembrete')+'</span></div>'+
        '<span class="stbadge '+p.status+'">'+p.status.replace('_',' ')+'</span>'+
        '<div class="acts">'+
          (thumb?'<button class="mini" data-view="'+p.id+'">Ver</button>':'')+
          (canPublish?'<button class="mini go" data-pub="'+p.id+'">Marcar publicado</button>':'')+
          (p.status!=='cancelado'&&p.status!=='publicado'?'<button class="mini" data-res="'+p.id+'">Reagendar</button>':'')+
          (p.status!=='cancelado'&&p.status!=='publicado'?'<button class="mini danger" data-can="'+p.id+'">Cancelar</button>':'')+
        '</div></div>';
    }).join('');
    box.querySelectorAll('[data-view]').forEach(function(b){ b.onclick=function(){ var p=byId(b.getAttribute('data-view')); if(p&&p.image_urls) p.image_urls.forEach(function(u){ window.open(u,'_blank'); }); }; });
    box.querySelectorAll('[data-pub]').forEach(function(b){ b.onclick=function(){ markPublished(b.getAttribute('data-pub')); }; });
    box.querySelectorAll('[data-res]').forEach(function(b){ b.onclick=function(){ reschedule(b.getAttribute('data-res')); }; });
    box.querySelectorAll('[data-can]').forEach(function(b){ b.onclick=function(){ cancelPost(b.getAttribute('data-can')); }; });
  }
  function byId(id){ return posts.find(function(p){return p.id===id;}); }
  async function markPublished(id){ try{ await A.sb.from('agendamentos').update({status:'publicado',publicado_em:new Date().toISOString()}).eq('id',id); await loadPosts(); }catch(e){ alert('Erro: '+e.message); } }
  async function cancelPost(id){ if(!confirm('Cancelar este agendamento?')) return; try{ await A.sb.from('agendamentos').update({status:'cancelado'}).eq('id',id); await loadPosts(); }catch(e){ alert('Erro: '+e.message); } }
  async function reschedule(id){
    var p=byId(id); var cur=new Date(p.scheduled_at);
    var v=prompt('Nova data e hora (formato: AAAA-MM-DD HH:MM):', cur.getFullYear()+'-'+pad(cur.getMonth()+1)+'-'+pad(cur.getDate())+' '+pad(cur.getHours())+':'+pad(cur.getMinutes()));
    if(!v) return; var nd=new Date(v.replace(' ','T')); if(isNaN(nd)){ alert('Data inválida.'); return; }
    try{ await A.sb.from('agendamentos').update({scheduled_at:nd.toISOString(),status:'agendado'}).eq('id',id); await loadPosts(); }catch(e){ alert('Erro: '+e.message); }
  }

  // ---------- calendário ----------
  function renderDow(){ var el=$('calDow'); if(el) el.innerHTML=DOW.map(function(d){return '<div class="cal-dow">'+d+'</div>';}).join(''); }
  function renderCalendar(){
    if(!$('calGrid')) return;
    $('calMonth').textContent=MESES[calRef.getMonth()]+' '+calRef.getFullYear();
    var first=new Date(calRef.getFullYear(),calRef.getMonth(),1);
    var start=new Date(first); start.setDate(1-first.getDay());
    var today=new Date(); today.setHours(0,0,0,0);
    var byDay={}; posts.forEach(function(p){ var d=new Date(p.scheduled_at); var k=d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate(); (byDay[k]=byDay[k]||[]).push(p); });
    var html='';
    for(var i=0;i<42;i++){
      var d=new Date(start); d.setDate(start.getDate()+i);
      var out=d.getMonth()!==calRef.getMonth();
      var isToday=d.getTime()===today.getTime();
      var k=d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
      var evs=(byDay[k]||[]).map(function(p){ return '<div class="ev '+p.status+'" title="'+(p.titulo||'')+'">'+pad(new Date(p.scheduled_at).getHours())+':'+pad(new Date(p.scheduled_at).getMinutes())+' '+(p.titulo||'post')+'</div>'; }).join('');
      html+='<div class="cal-day'+(out?' out':'')+(isToday?' today':'')+'"><div class="dn">'+d.getDate()+'</div>'+evs+'</div>';
    }
    $('calGrid').innerHTML=html;
  }

  // ---------- desempenho ----------
  function stat(n,label){ return '<div style="border:2px solid var(--ink);border-radius:11px;padding:13px;background:var(--cream);text-align:center"><div style="font-family:Space Grotesk,sans-serif;font-weight:700;font-size:26px">'+n+'</div><div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;color:var(--ink-3);letter-spacing:.06em;margin-top:2px">'+label+'</div></div>'; }
  async function renderStats(){
    var box=$('stats'); if(!box) return;
    var pub=posts.filter(function(p){return p.status==='publicado';}).length;
    var age=posts.filter(function(p){return p.status==='agendado';}).length;
    var aw=posts.filter(function(p){return p.status==='aguardando_usuario';}).length;
    var likes=0,reach=0,saved=0;
    try{ var ids=posts.filter(function(p){return p.status==='publicado';}).map(function(p){return p.id;});
      if(ids.length){ var r=await A.sb.from('post_metrics').select('agendamento_id,likes,reach,saved,coletado_em').in('agendamento_id',ids).order('coletado_em',{ascending:false});
        var seen={}; (r.data||[]).forEach(function(m){ if(seen[m.agendamento_id])return; seen[m.agendamento_id]=1; likes+=m.likes||0; reach+=m.reach||0; saved+=m.saved||0; }); } }catch(e){}
    box.innerHTML=stat(pub,'publicados')+stat(age,'agendados')+stat(aw,'aguardando você')+stat(likes,'curtidas')+stat(saved,'salvamentos')+stat(reach,'alcance');
    if(!pub){ var h=$('statsHint'); if(h) h.style.display='block'; }
  }

  // ---------- dashboard (analytics) ----------
  var dashRange=90, metricsByPost={}, charts={};
  var PAL={green:'#33B589',green2:'#7FE0B0',mint:'#9EEFC6',blue:'#3B82F6',amber:'#E6A700',red:'#E5484D',purple:'#8B5CF6',ink:'#222A35',gray:'#94A3B8'};
  function fmtNum(n){ n=n||0; if(n>=1000000) return (n/1000000).toFixed(1).replace('.0','')+'M'; if(n>=1000) return (n/1000).toFixed(1).replace('.0','')+'k'; return String(n); }
  function dayKey(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1); }
  var DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  function postDate(p){ return new Date(p.publicado_em||p.scheduled_at); }
  function toggleEmpty(id,on){ var e=$(id); if(e) e.style.display=on?'flex':'none'; }
  function mkChart(id,cfg){ if(!window.Chart) return; var el=$(id); if(!el) return; if(charts[id]) charts[id].destroy(); charts[id]=new Chart(el.getContext('2d'),cfg); }
  var CH_BASE={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{font:{family:'Space Grotesk',size:11}}}},
    scales:{x:{grid:{display:false},ticks:{font:{family:'JetBrains Mono',size:10}}},y:{beginAtZero:true,ticks:{font:{family:'JetBrains Mono',size:10},precision:0},grid:{color:'rgba(34,42,53,.08)'}}}};

  async function fetchMetrics(pubIds){
    metricsByPost={}; if(!pubIds.length) return;
    try{ var r=await A.sb.from('post_metrics').select('agendamento_id,likes,comments,saved,reach,impressions,coletado_em').in('agendamento_id',pubIds).order('coletado_em',{ascending:false});
      (r.data||[]).forEach(function(m){ if(!metricsByPost[m.agendamento_id]) metricsByPost[m.agendamento_id]=m; });
    }catch(e){}
  }
  var demoMode=false;
  function buildDemo(){
    var temas=['5 erros que travam seu crescimento','Como aumentar seu alcance','Mito x verdade: engajamento','Passo a passo do primeiro post','O que ninguém te conta','Guia rápido de hashtags','Antes e depois de 90 dias','Checklist de conteúdo','3 dicas de copy','Rotina de postagem','Erros de iniciante','Como criar autoridade'];
    var dps=[], mets={};
    for(var i=0;i<18;i++){
      var daysAgo=Math.floor((i*6)+ (i%3)*2 + 3);
      var d=new Date(Date.now()-daysAgo*86400000);
      var id='demo-'+i;
      var st = i<14?'publicado':(i<16?'agendado':'aguardando_usuario');
      if(st==='agendado') d=new Date(Date.now()+(i)*86400000);
      dps.push({id:id,titulo:temas[i%temas.length],status:st,modo:'auto',publicado_em:st==='publicado'?d.toISOString():null,scheduled_at:d.toISOString(),image_urls:[]});
      if(st==='publicado'){
        var base=300+ (i*47)%900;
        mets[id]={agendamento_id:id,likes:base+(i*13)%200,comments:8+(i*3)%40,saved:40+(i*11)%160,reach:base*4+(i*90)%1500,impressions:base*5};
      }
    }
    return {posts:dps,metrics:mets};
  }
  async function renderDashboard(){
    if(!$('dash')) return;
    var srcPosts;
    if(demoMode){ var dm=buildDemo(); srcPosts=dm.posts; metricsByPost=dm.metrics; }
    else { srcPosts=posts; }
    var cutoff=new Date(Date.now()-dashRange*86400000);
    var P=srcPosts.filter(function(p){ return postDate(p)>=cutoff || p.status==='agendado'; });
    var pub=P.filter(function(p){return p.status==='publicado';});
    var pubIds=pub.map(function(p){return p.id;});
    if(!demoMode) await fetchMetrics(pubIds);

    // KPIs atividade
    var age=P.filter(function(p){return p.status==='agendado';}).length;
    var aw=P.filter(function(p){return p.status==='aguardando_usuario';}).length;
    var fal=P.filter(function(p){return p.status==='falhou';}).length;
    var denom=pub.length+age+aw+fal;
    setTxt('kpiTotal',fmtNum(P.length)); setTxt('kpiPub',fmtNum(pub.length));
    setTxt('kpiAgend',fmtNum(age)); setTxt('kpiAguard',fmtNum(aw));
    setTxt('kpiTaxa', denom? Math.round(pub.length/denom*100)+'%' : '—');

    // KPIs engajamento
    var tot={likes:0,comments:0,saved:0,reach:0}; var withM=0;
    pub.forEach(function(p){ var m=metricsByPost[p.id]; if(m){ withM++; tot.likes+=m.likes||0; tot.comments+=m.comments||0; tot.saved+=m.saved||0; tot.reach+=m.reach||0; } });
    setTxt('kpiLikes',fmtNum(tot.likes)); setTxt('kpiCom',fmtNum(tot.comments));
    setTxt('kpiSaved',fmtNum(tot.saved)); setTxt('kpiReach',fmtNum(tot.reach));
    setTxt('kpiEng', withM? fmtNum(Math.round((tot.likes+tot.comments+tot.saved)/withM)) : '—');

    // gráfico status (donut)
    var order=['publicado','agendado','aguardando_usuario','falhou','rascunho','cancelado'];
    var labelsPt={publicado:'Publicado',agendado:'Agendado',aguardando_usuario:'Aguardando',falhou:'Falhou',rascunho:'Rascunho',cancelado:'Cancelado'};
    var colByStatus={publicado:PAL.green,agendado:PAL.blue,aguardando_usuario:PAL.amber,falhou:PAL.red,rascunho:PAL.gray,cancelado:'#cbd5e1'};
    var sc={}; P.forEach(function(p){ sc[p.status]=(sc[p.status]||0)+1; });
    var sLabels=[],sData=[],sColors=[]; order.forEach(function(s){ if(sc[s]){ sLabels.push(labelsPt[s]); sData.push(sc[s]); sColors.push(colByStatus[s]); } });
    toggleEmpty('emStatus', !P.length);
    mkChart('chStatus',{type:'doughnut',data:{labels:sLabels,datasets:[{data:sData,backgroundColor:sColors,borderColor:PAL.ink,borderWidth:2}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{position:'right',labels:{font:{family:'Space Grotesk',size:11},boxWidth:12}}}}});

    // publicações por mês
    var months=[]; var base=new Date(); base.setDate(1);
    var nM=dashRange<=30?3:dashRange<=90?6:12;
    for(var i=nM-1;i>=0;i--){ var d=new Date(base.getFullYear(),base.getMonth()-i,1); months.push(d); }
    var mCount=months.map(function(d){ var k=dayKey(d); return pub.filter(function(p){ return dayKey(postDate(p))===k; }).length; });
    toggleEmpty('emMonth', pub.length===0);
    mkChart('chMonth',{type:'bar',data:{labels:months.map(function(d){return MESES[d.getMonth()].slice(0,3);}),
      datasets:[{label:'Publicados',data:mCount,backgroundColor:PAL.green,borderColor:PAL.ink,borderWidth:2,borderRadius:6}]},
      options:Object.assign({},CH_BASE,{plugins:{legend:{display:false}}})});

    // engajamento por post (top 8)
    var eng=pub.map(function(p){ var m=metricsByPost[p.id]||{}; return {t:(p.titulo||'Post'),v:(m.likes||0)+(m.saved||0),likes:m.likes||0,saved:m.saved||0}; })
      .filter(function(x){return x.v>0;}).sort(function(a,b){return b.v-a.v;}).slice(0,8);
    toggleEmpty('emEngage', eng.length===0);
    mkChart('chEngage',{type:'bar',data:{labels:eng.map(function(e){return e.t.length>22?e.t.slice(0,22)+'…':e.t;}),
      datasets:[{label:'Curtidas',data:eng.map(function(e){return e.likes;}),backgroundColor:PAL.green,borderColor:PAL.ink,borderWidth:2,borderRadius:5},
                {label:'Salvamentos',data:eng.map(function(e){return e.saved;}),backgroundColor:PAL.blue,borderColor:PAL.ink,borderWidth:2,borderRadius:5}]},
      options:Object.assign({},CH_BASE,{indexAxis:'y',scales:{x:{beginAtZero:true,stacked:true,ticks:{font:{family:'JetBrains Mono',size:10}}},y:{stacked:true,grid:{display:false},ticks:{font:{family:'Space Grotesk',size:10}}}}})});

    // melhores dias (alcance médio por weekday; fallback: contagem de posts)
    var sumReach=[0,0,0,0,0,0,0],cntReach=[0,0,0,0,0,0,0],cntPosts=[0,0,0,0,0,0,0];
    pub.forEach(function(p){ var wd=postDate(p).getDay(); cntPosts[wd]++; var m=metricsByPost[p.id]; if(m&&m.reach){ sumReach[wd]+=m.reach; cntReach[wd]++; } });
    var hasReach=cntReach.some(function(c){return c>0;});
    var wdData=DIAS.map(function(_,i){ return hasReach ? (cntReach[i]?Math.round(sumReach[i]/cntReach[i]):0) : cntPosts[i]; });
    toggleEmpty('emWeekday', pub.length===0);
    mkChart('chWeekday',{type:'bar',data:{labels:DIAS,datasets:[{label:hasReach?'Alcance médio':'Posts',data:wdData,backgroundColor:PAL.green2,borderColor:PAL.ink,borderWidth:2,borderRadius:6}]},
      options:Object.assign({},CH_BASE,{plugins:{legend:{display:false}}})});

    // top posts (tabela)
    renderTop(pub);
  }
  function renderTop(pub){
    var wrap=$('topWrap'); if(!wrap) return;
    var rows=pub.map(function(p){ var m=metricsByPost[p.id]||{}; return {t:p.titulo||'Carrossel',d:postDate(p),likes:m.likes||0,saved:m.saved||0,reach:m.reach||0,has:!!metricsByPost[p.id]}; });
    var withM=rows.filter(function(r){return r.has;});
    if(!withM.length){ wrap.innerHTML='<div class="empty">Sem métricas ainda. Publique por uma conta Business para ver o ranking (as métricas são coletadas automaticamente a cada 6h).</div>'; return; }
    withM.sort(function(a,b){return b.saved-a.saved;});
    wrap.innerHTML='<table class="top"><thead><tr><th>Post</th><th>Data</th><th style="text-align:right">Curtidas</th><th style="text-align:right">Salvos</th><th style="text-align:right">Alcance</th></tr></thead><tbody>'+
      withM.slice(0,10).map(function(r){ return '<tr><td>'+r.t.replace(/</g,'&lt;')+'</td><td>'+pad(r.d.getDate())+'/'+pad(r.d.getMonth()+1)+'/'+r.d.getFullYear()+'</td><td class="num">'+fmtNum(r.likes)+'</td><td class="num">'+fmtNum(r.saved)+'</td><td class="num">'+fmtNum(r.reach)+'</td></tr>'; }).join('')+
      '</tbody></table>';
  }
  function setTxt(id,v){ var e=$(id); if(e) e.textContent=v; }

  // ---------- planejador editorial (IA) ----------
  var FMT_COR={'lista':'#3B82F6','mito x verdade':'#E5484D','passo a passo':'#33B589','educativo':'#8B5CF6','bastidores':'#E6A700','comparacao':'#0EA5A0','comparação':'#0EA5A0','prova social':'#EC4899'};
  function fmtCor(f){ return FMT_COR[(f||'').toLowerCase()]||'#222A35'; }
  function esc(s){ return (s||'').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
  async function gerarPlano(){
    var btn=$('planBtn'), lab=btn.querySelector('.btn-label'), out=$('planResult');
    var nicho=$('plNicho').value.trim(); var freq=parseInt($('plFreq').value)||3;
    var objetivo=$('plObjetivo')?$('plObjetivo').value:''; var tom=$('plTom')?$('plTom').value:'';
    if(!nicho){ $('plNicho').focus(); return; }
    btn.classList.add('is-loading'); btn.disabled=true; lab.textContent='Pensando…';
    out.innerHTML='<div class="card" style="text-align:center;padding:40px"><span class="spin" style="display:inline-block"></span><div style="margin-top:12px;color:var(--ink-3);font-size:13px">Montando seu calendário editorial…</div></div>';
    try{
      var r=await A.sb.functions.invoke('planejar-conteudo',{body:{nicho:nicho,por_semana:freq,objetivo:objetivo,tom:tom}});
      if(r.error) throw new Error(r.error.message||'falha');
      var itens=((r.data&&r.data.itens)||[]).filter(function(it){return it&&(it.titulo||it.tema);});
      if(!itens.length){ out.innerHTML='<div class="card"><div class="empty">Não consegui gerar agora. Tente de novo.</div></div>'; }
      else renderPlano(itens,nicho,objetivo,freq);
    }catch(e){ out.innerHTML='<div class="card"><div class="empty">Erro: '+e.message+'</div></div>'; }
    btn.classList.remove('is-loading'); btn.disabled=false; lab.textContent='Gerar plano do mês →';
  }
  function renderPlano(itens,nicho,objetivo,freq){
    var out=$('planResult');
    itens.sort(function(a,b){return (a.dia||0)-(b.dia||0);});
    // resumo
    var html='<div class="card"><h2>Plano do mês</h2>'+
      '<div class="plan-summary">'+
        '<div class="s"><b>'+itens.length+'</b><span>ideias</span></div>'+
        '<div class="s"><b>'+freq+'x</b><span>por semana</span></div>'+
        '<div class="s"><b style="font-size:15px;font-weight:700;font-family:Space Grotesk">'+esc(nicho)+'</b><span>nicho</span></div>'+
        '<div class="s"><b style="font-size:15px;font-weight:700;font-family:Space Grotesk">'+esc(objetivo||'—')+'</b><span>objetivo</span></div>'+
      '</div>';
    // calendário do mês (alinhado aos dias da semana)
    var byDay={}; itens.forEach(function(it){ if(it.dia) (byDay[it.dia]=byDay[it.dia]||[]).push(it); });
    var now=new Date(), y=now.getFullYear(), mo=now.getMonth();
    var startDow=new Date(y,mo,1).getDay(), dim=new Date(y,mo+1,0).getDate();
    var head='<div class="cal-grid">'+DOW.map(function(dn){return '<div class="cal-dow">'+dn+'</div>';}).join('')+'</div>';
    var cells='';
    for(var b=0;b<startDow;b++) cells+='<div class="cal-day out"></div>';
    for(var d=1;d<=dim;d++){
      var has=byDay[d];
      var evs=has?has.map(function(it){ return '<div class="ev" style="background:'+fmtCor(it.formato)+';color:#fff" title="'+esc(it.titulo||'')+'">'+esc(it.titulo||'post')+'</div>'; }).join(''):'';
      cells+='<div class="cal-day'+(has?' plan-has':'')+'"><div class="dn">'+d+'</div>'+evs+'</div>';
    }
    // legenda de formatos
    var fmts={}; itens.forEach(function(it){ if(it.formato) fmts[it.formato.toLowerCase()]=1; });
    var legend='<div class="fmt-legend">'+Object.keys(fmts).map(function(f){ return '<span class="lg"><i style="background:'+fmtCor(f)+'"></i>'+f+'</span>'; }).join('')+'</div>';
    html+='<div class="cal-top"><div class="mo">'+MESES[mo]+' '+y+'</div></div>'+head+'<div class="cal-grid" style="margin-top:8px">'+cells+'</div>'+legend+'</div>';
    // semanas
    var wrap='<div class="card"><h2>Ideias por semana</h2><div class="sub">Clique em qualquer ideia para abrir o criador já com o tema preenchido.</div>';
    for(var w=0;w<4;w++){
      var lo=w*7+1, hi=lo+6;
      var wkItens=itens.filter(function(it){ var dd=it.dia||0; return dd>=lo&&dd<=hi; });
      if(!wkItens.length) continue;
      wrap+='<div class="wk"><div class="wk-h">Semana '+(w+1)+' · dias '+lo+'–'+hi+'</div>';
      wkItens.forEach(function(it){
        var idx=itens.indexOf(it);
        wrap+='<div class="idea">'+
          '<div class="idea-day"><div class="dd">'+(it.dia||'—')+'</div><div class="dl">dia</div></div>'+
          '<div class="idea-main"><span class="fmt" style="background:'+fmtCor(it.formato)+'">'+esc(it.formato||'carrossel')+'</span>'+
            '<b>'+esc(it.titulo||'Ideia')+'</b>'+
            (it.gancho?'<div class="gk">“'+esc(it.gancho)+'”</div>':'')+
            (it.tema?'<div class="tm">'+esc(it.tema)+'</div>':'')+'</div>'+
          '<div class="acts"><button class="mini go" data-idea="'+idx+'">Criar →</button></div></div>';
      });
      wrap+='</div>';
    }
    wrap+='</div>';
    out.innerHTML=html+wrap;
    out.querySelectorAll('[data-idea]').forEach(function(b){ b.onclick=function(){ var it=itens[b.getAttribute('data-idea')]; try{ sessionStorage.setItem('md_plan_tema', it.tema||it.titulo||''); }catch(_){} location.href='/app.html'; }; });
  }

  // ---------- boot ----------
  (async function(){
    if(!A.configured){ $('guard').innerHTML='<div style="text-align:center;padding:24px"><h1 style="font-family:Space Grotesk">Configure o Supabase</h1><a class="btn btn-primary" style="width:auto;display:inline-flex" href="/login.html">Login</a></div>'; return; }
    user=await A.requireAuth(); if(!user) return;
    var nome=(user.user_metadata&&user.user_metadata.nome)||(user.email?user.email.split('@')[0]:'você');
    if($('avatarBtn')) $('avatarBtn').textContent=(nome||'?').charAt(0).toUpperCase();
    if($('mNome')) $('mNome').textContent=nome; if($('mEmail')) $('mEmail').textContent=user.email||'';
    try{ var r=await A.sb.from('profiles').select('nome,creditos').eq('id',user.id).single(); if(r.data){ if($('creditsN'))$('creditsN').textContent=r.data.creditos; if(r.data.nome){ if($('mNome'))$('mNome').textContent=r.data.nome; if($('avatarBtn'))$('avatarBtn').textContent=r.data.nome.charAt(0).toUpperCase(); } } }catch(_){}

    // avatar menu (guardado)
    if($('avatarBtn')&&$('avatarMenu')){
      var menuOpen=false; function tm(v){menuOpen=v===undefined?!menuOpen:v;$('avatarMenu').classList.toggle('open',menuOpen);}
      $('avatarBtn').onclick=function(e){e.stopPropagation();tm();}; document.addEventListener('click',function(){if(menuOpen)tm(false);});
      if($('mLogout')) $('mLogout').onclick=async function(){ await A.signOut(); location.assign('/'); };
    }
    if($('creditsBtn')) $('creditsBtn').onclick=function(){location.href='/#planos';};
    if($('connectBtn')) $('connectBtn').onclick=connect;
    if($('calPrev')) $('calPrev').onclick=function(){ calRef.setMonth(calRef.getMonth()-1); renderCalendar(); };
    if($('calNext')) $('calNext').onclick=function(){ calRef.setMonth(calRef.getMonth()+1); renderCalendar(); };
    if($('planBtn')) $('planBtn').onclick=gerarPlano;
    var rs=$('rangeSeg'); if(rs){ rs.querySelectorAll('button').forEach(function(b){ b.onclick=function(){ rs.querySelectorAll('button').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); dashRange=parseInt(b.getAttribute('data-r'))||90; renderDashboard(); }; }); }
    if($('demoBtn')) $('demoBtn').onclick=function(){ demoMode=!demoMode; this.classList.toggle('on',demoMode); this.textContent=demoMode?'Sair do exemplo':'Ver exemplo'; renderDashboard(); };

    // feedback pós-OAuth
    var qs=new URLSearchParams(location.search);
    if($('connectMsg')){ if(qs.get('connected')) $('connectMsg').textContent='✓ Conta '+qs.get('connected')+' conectada!'; if(qs.get('error')) $('connectMsg').textContent='Não deu para conectar: '+qs.get('error'); }

    renderDow();
    $('guard').style.display='none'; $('shell').style.display='block';

    // carrega só o que a página precisa
    var needsAccounts = !!$('accList');
    var needsPosts = !!($('calGrid')||$('postList')||$('stats')||$('dash'));
    if(needsAccounts || needsPosts) await fetchAccounts();
    if(needsPosts) await loadPosts();
  })();
})();
