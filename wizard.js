/* ============ MeuDesigner · assistente de criação (4 passos, estilo CarrosseIA) ============ */
(function(){
  var A = window.MDAuth;
  var $ = function(id){ return document.getElementById(id); };

  // ---------- templates ----------
  var T = [
    {id:'post-social',nome:'Post / Rede Social',badge:'SOCIAL',photo:false,acc:'#111827',head:'Anton',body:'Inter',bg:'#FFFFFF',text:'#111827',scene:''},
    {id:'insider',nome:'Insider',badge:'INSIDER',photo:false,acc:'#F2A93B',head:'Archivo Black',body:'Inter',bg:'#12100E',text:'#FFFFFF',scene:''},
    {id:'advocacia',nome:'Advocacia',badge:'DIREITO',photo:true,acc:'#C9A24B',head:'Playfair Display',body:'Inter',bg:'#FAF7F1',text:'#1A1714',scene:'retrato de advogado de terno em escritorio classico com estante de livros juridicos, iluminacao cinematografica'},
    {id:'noticias-virais',nome:'Notícias Virais',badge:'VIRAL',photo:true,acc:'#E5484D',head:'Oswald',body:'Inter',bg:'#111318',text:'#FFFFFF',scene:'cena urbana noturna dramatica de grande cidade, clima de manchete urgente'},
    {id:'marketing',nome:'Marketing',badge:'MARKETING',photo:true,acc:'#8B5CF6',head:'Montserrat',body:'Inter',bg:'#14121A',text:'#FFFFFF',scene:'profissional de marketing analisando graficos em telas, escritorio criativo moderno'},
    {id:'ia',nome:'Inteligência Artificial',badge:'IA',photo:true,acc:'#22D3EE',head:'Space Grotesk',body:'Inter',bg:'#0C1116',text:'#FFFFFF',scene:'representacao abstrata de inteligencia artificial, rede neural futurista com luz azul ciano'},
    {id:'imobiliaria',nome:'Imobiliária',badge:'IMÓVEIS',photo:true,acc:'#3B82F6',head:'Poppins',body:'Inter',bg:'#F5F7FA',text:'#16202E',scene:'sala de estar de casa moderna de alto padrao, luz natural ao entardecer'},
    {id:'nutricionista',nome:'Nutricionista',badge:'NUTRIÇÃO',photo:true,acc:'#34C759',head:'Poppins',body:'Inter',bg:'#F4FAF5',text:'#12241A',scene:'retrato de nutricionista sorridente de jaleco segurando prato de salada colorida, cozinha clara'},
    {id:'medicos',nome:'Médicos / Hospitalar',badge:'SAÚDE',photo:true,acc:'#2E9BE6',head:'Poppins',body:'Inter',bg:'#F3F8FC',text:'#12222E',scene:'retrato de medico de jaleco branco com estetoscopio em corredor de hospital moderno'},
    {id:'educacao',nome:'Educação / Professores',badge:'EDUCAÇÃO',photo:true,acc:'#F59E0B',head:'Playfair Display',body:'Inter',bg:'#FBF7F0',text:'#241C10',scene:'retrato de professor experiente em biblioteca aconchegante cheia de livros'},
    {id:'clinica-estetica',nome:'Clínica de Estética',badge:'ESTÉTICA',photo:true,acc:'#EC4899',head:'Montserrat',body:'Inter',bg:'#FCF4F8',text:'#2A121F',scene:'ambiente sofisticado de clinica de estetica em tons de rosa e branco, elegante'},
    {id:'contabilidade',nome:'Contabilidade e Financeiro',badge:'FINANÇAS',photo:true,acc:'#0EA5A0',head:'Oswald',body:'Inter',bg:'#F2F8F7',text:'#0E2422',scene:'retrato de contador de terno revisando graficos financeiros em escritorio corporativo'},
    {id:'academia',nome:'Academia / Fitness',badge:'FITNESS',photo:true,acc:'#EF4444',head:'Anton',body:'Inter',bg:'#131316',text:'#FFFFFF',scene:'retrato de atleta musculoso treinando com pesos em academia moderna, iluminacao dramatica'},
    {id:'turismo',nome:'Turismo',badge:'TURISMO',photo:true,acc:'#06B6D4',head:'Poppins',body:'Inter',bg:'#F0FAFC',text:'#0C2830',scene:'praia paradisiaca tropical com aguas azul-turquesa cristalinas e areia branca'},
    {id:'beleza',nome:'Beleza e Estética',badge:'BELEZA',photo:true,acc:'#D946EF',head:'Playfair Display',body:'Inter',bg:'#FBF4FB',text:'#2A1230',scene:'salao de beleza elegante e sofisticado com iluminacao suave e dourada'},
    {id:'categoria',nome:'Notícias',badge:'NOTÍCIAS',photo:true,acc:'#F2A93B',head:'Oswald',body:'Inter',bg:'#14140F',text:'#FFFFFF',scene:'cena de redacao de noticias moderna, clima de reportagem seria'},
    {id:'dentistas',nome:'Dentistas',badge:'ODONTO',photo:true,acc:'#06B6D4',head:'Poppins',body:'Inter',bg:'#F2FAFC',text:'#0C2630',scene:'consultorio odontologico moderno impecavelmente branco, ambiente clean'},
    {id:'joias',nome:'Joias e Semijoias',badge:'JOIAS',photo:true,acc:'#C9A24B',head:'Playfair Display',body:'Inter',bg:'#141210',text:'#FFFFFF',scene:'aneis e joias de ouro e diamantes brilhando sobre veludo escuro, luz de estudio'},
    {id:'pets',nome:'Pets',badge:'PETS',photo:true,acc:'#F97316',head:'Baloo 2',body:'Nunito',bg:'#FBF6F0',text:'#241809',scene:'cachorro golden retriever fofo e feliz em ambiente aconchegante e iluminado'}
  ];
  function tById(id){ for(var i=0;i<T.length;i++) if(T[i].id===id) return T[i]; return T[0]; }

  var HEAD_FONTS=['Space Grotesk','Anton','Bebas Neue','Archivo Black','Oswald','Montserrat','Poppins','Playfair Display','Baloo 2','Fjalla One'];
  var BODY_FONTS=['Inter','Nunito','Poppins','DM Sans','Work Sans','Manrope','Rubik','Lexend','Roboto','Open Sans'];

  // ---------- estado ----------
  var S = { step:1, tpl:null, tema:'', link:'', n:6, slides:[], design:null, prev:0 };
  var coverImg=null, coverReady=false, fotoImg=null;
  var reopenId=null;

  function defaultDesign(t){
    return { aspect:'4:5', fHead:t.head, fBody:t.body, bg:t.bg, text:t.text, btn:t.acc,
             sec: t.text==='#FFFFFF'?'rgba(255,255,255,.66)':'rgba(26,23,20,.6)',
             nome:'', arroba:'', verif:true };
  }

  // ---------- helpers de desenho ----------
  function fam(f){ return '"'+f+'", sans-serif'; }
  function hx(h,i){ return parseInt(h.replace('#','').substr(i,2),16); }
  function rgba(h,a){ if(h[0]!=='#') return h; return 'rgba('+hx(h,0)+','+hx(h,2)+','+hx(h,4)+','+a+')'; }
  function shade(h,a){ function c(v){return Math.max(0,Math.min(255,v));} return 'rgb('+c(hx(h,0)+a)+','+c(hx(h,2)+a)+','+c(hx(h,4)+a)+')'; }
  function isLight(h){ if(h[0]!=='#')return true; return (hx(h,0)*0.299+hx(h,2)*0.587+hx(h,4)*0.114)>150; }
  function roundRect(x,ctx,y,w,hh,r){ ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+hh,r);ctx.arcTo(x+w,y+hh,x,y+hh,r);ctx.arcTo(x,y+hh,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath(); }
  function rrect(ctx,x,y,w,hh,r){ ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+hh,r);ctx.arcTo(x+w,y+hh,x,y+hh,r);ctx.arcTo(x,y+hh,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath(); }
  function wrap(ctx,text,maxW){ var w=(text||'').split(/\s+/),L=[],c=''; for(var i=0;i<w.length;i++){var t=c?c+' '+w[i]:w[i]; if(c&&ctx.measureText(t).width>maxW){L.push(c);c=w[i];}else c=t;} if(c)L.push(c); return L.length?L:['']; }
  function drawRich(ctx,text,x,y,maxW,lh,base,acc,size,fb){
    var parts=[],re=/\*\*(.+?)\*\*/g,last=0,m;
    while((m=re.exec(text))){ if(m.index>last)parts.push({t:text.slice(last,m.index),h:false}); parts.push({t:m[1],h:true}); last=re.lastIndex; }
    if(last<text.length)parts.push({t:text.slice(last),h:false});
    var words=[]; parts.forEach(function(p){ p.t.split(/(\s+)/).forEach(function(w){ if(w.length)words.push({w:w,h:p.h}); }); });
    var cx=x,cy=y; ctx.textAlign='left';
    words.forEach(function(o){ ctx.font=(o.h?'700 ':'400 ')+size+'px '+fam(fb); var ww=ctx.measureText(o.w).width; if(o.w.trim()!==''&&cx+ww>x+maxW){cx=x;cy+=lh;} ctx.fillStyle=o.h?acc:base; ctx.fillText(o.w,cx,cy); cx+=ww; });
    return cy;
  }
  function badge(ctx,label,acc,W){ ctx.font='700 24px "JetBrains Mono", monospace'; var tw=ctx.measureText(label).width,pw=tw+46,ph=50,x=W-70-pw,y=64; ctx.fillStyle=acc; rrect(ctx,x,y,pw,ph,13); ctx.fill(); ctx.fillStyle=isLight(acc)?'#12100E':'#fff'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(label,x+23,y+ph/2+1); ctx.textBaseline='alphabetic'; }
  function verifiedCheck(ctx,x,y,r){ ctx.fillStyle='#1D9BF0'; ctx.beginPath(); for(var i=0;i<12;i++){var a=i*Math.PI/6;var rr=i%2?r*0.86:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);} ctx.closePath(); ctx.fill(); ctx.strokeStyle='#fff';ctx.lineWidth=r*0.22;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x-r*0.4,y);ctx.lineTo(x-r*0.08,y+r*0.34);ctx.lineTo(x+r*0.44,y-r*0.28);ctx.stroke(); }
  function profileRow(ctx,x,y,D,onDark){
    var av=54, tx=x;
    if(fotoImg){ ctx.save(); ctx.beginPath(); ctx.arc(x+av/2,y+av/2,av/2,0,7); ctx.clip(); var r=Math.max(av/fotoImg.width,av/fotoImg.height); ctx.drawImage(fotoImg,x+av/2-fotoImg.width*r/2,y+av/2-fotoImg.height*r/2,fotoImg.width*r,fotoImg.height*r); ctx.restore(); }
    else { ctx.fillStyle=D.btn; ctx.beginPath(); ctx.arc(x+av/2,y+av/2,av/2,0,7); ctx.fill(); ctx.fillStyle=isLight(D.btn)?'#111':'#fff'; ctx.font='700 26px '+fam(D.fHead); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(((D.nome||'S').charAt(0)).toUpperCase(),x+av/2,y+av/2+2); ctx.textBaseline='alphabetic'; ctx.textAlign='left'; }
    tx=x+av+16; var col=onDark?'#fff':D.text;
    ctx.fillStyle=col; ctx.font='700 28px '+fam(D.fHead); var nm=D.nome||'Seu Nome'; ctx.fillText(nm,tx,y+24);
    var nw=ctx.measureText(nm).width; if(D.verif) verifiedCheck(ctx,tx+nw+18,y+16,11);
    ctx.fillStyle=onDark?'rgba(255,255,255,.6)':D.sec; ctx.font='400 22px '+fam(D.fBody); ctx.fillText('@'+(D.arroba||'seuperfil'),tx,y+50);
  }
  function footer(ctx,i,n,acc,onDark,W,H){
    var y=H-74,pad=70,col=onDark?'#fff':'rgba(26,23,20,.55)';
    ctx.textAlign='left';ctx.fillStyle=col;ctx.font='400 26px "JetBrains Mono", monospace';
    ctx.fillText(('0'+(i+1)).slice(-2)+'/'+('0'+n).slice(-2),pad,y);
    var dw=15,gap=10,tot=n*dw+(n-1)*gap,sx=(W-tot)/2;
    for(var k=0;k<n;k++){var dx=sx+k*(dw+gap); if(k===i){ctx.save();ctx.translate(dx+dw/2,y-8);ctx.rotate(Math.PI/4);ctx.fillStyle=acc;ctx.fillRect(-6.5,-6.5,13,13);ctx.restore();}else{ctx.fillStyle=onDark?'rgba(255,255,255,.4)':'rgba(26,23,20,.22)';ctx.fillRect(dx,y-14,dw,13);}}
    ctx.textAlign='right';ctx.fillStyle=col;ctx.font='700 25px '+fam(S.design.fHead);ctx.fillText('ARRASTA →',W-pad,y);ctx.textAlign='left';
  }
  function tsize(txt,big){ var L=(txt||'').length; if(big) return L>78?58:L>50?70:L>30?86:100; return L>78?52:L>50?60:72; }

  function drawSlide(slide,i,n){
    var D=S.design, t=S.tpl, W=1080, H=D.aspect==='1:1'?1080:1350;
    var c=document.createElement('canvas'); c.width=W;c.height=H; var ctx=c.getContext('2d');
    var role=slide.role||'content',pad=70,maxW=W-pad*2,acc=D.btn;
    if(role==='cover'){
      if(t.photo && coverImg && coverReady){ var r=Math.max(W/coverImg.width,H/coverImg.height),dw=coverImg.width*r,dh=coverImg.height*r; ctx.drawImage(coverImg,(W-dw)/2,(H-dh)/2,dw,dh);
        var sc=ctx.createLinearGradient(0,H*0.32,0,H); sc.addColorStop(0,'rgba(9,11,15,0)'); sc.addColorStop(1,'rgba(9,11,15,.94)'); ctx.fillStyle=sc; ctx.fillRect(0,0,W,H);
        ctx.fillStyle='rgba(9,11,15,.3)'; ctx.fillRect(0,0,W,200);
        badge(ctx,(slide.kick||t.badge).toUpperCase().slice(0,18),acc,W);
        var hs=tsize(slide.title,true); ctx.font='700 '+hs+'px '+fam(D.fHead); var tl=wrap(ctx,slide.title,maxW);
        ctx.font='400 38px '+fam(D.fBody); var sl=slide.body?wrap(ctx,slide.body,maxW):[]; var lhT=hs*1.05;
        var bottom=H-150, bh=tl.length*lhT+(sl.length?20+sl.length*52:0), y=bottom-bh;
        ctx.fillStyle='#fff'; ctx.font='700 '+hs+'px '+fam(D.fHead);
        tl.forEach(function(ln){ y+=hs; ctx.fillText(ln,pad,y); y+=lhT-hs; });
        if(sl.length){ y+=20; ctx.fillStyle='rgba(255,255,255,.86)'; ctx.font='400 38px '+fam(D.fBody); sl.forEach(function(ln){ y+=38; ctx.fillText(ln,pad,y); y+=14; }); }
        footer(ctx,i,n,acc,true,W,H);
      } else { // capa tipográfica (estilo post social)
        ctx.fillStyle=D.bg; ctx.fillRect(0,0,W,H); var dk=!isLight(D.bg);
        profileRow(ctx,pad,90,D,dk);
        badge(ctx,(slide.kick||t.badge).toUpperCase().slice(0,18),acc,W);
        var hs2=tsize(slide.title,true); ctx.font='700 '+hs2+'px '+fam(D.fHead); ctx.fillStyle=D.text; ctx.textAlign='left';
        var tl2=wrap(ctx,slide.title,maxW), y2=H*0.34; tl2.forEach(function(ln){ y2+=hs2; ctx.fillText(ln,pad,y2); y2+=hs2*0.06; });
        if(slide.body){ y2+=24; ctx.font='400 40px '+fam(D.fBody); ctx.fillStyle=D.sec; wrap(ctx,slide.body,maxW).forEach(function(ln){ y2+=40; ctx.fillText(ln,pad,y2); y2+=16; }); }
        footer(ctx,i,n,acc,dk,W,H);
      }
    } else if(role==='cta'){
      var dark=!isLight(D.bg); ctx.fillStyle=dark?D.bg:shade(D.text,0); if(isLight(D.bg)){ctx.fillStyle=D.text;} ctx.fillRect(0,0,W,H);
      var base=isLight(D.bg)?D.text:D.bg; ctx.fillStyle=isLight(D.bg)?D.text:D.bg; ctx.fillRect(0,0,W,H);
      var g=ctx.createRadialGradient(W*0.8,H*0.2,0,W*0.8,H*0.2,W*0.8); g.addColorStop(0,rgba(acc,0.25)); g.addColorStop(1,rgba(acc,0)); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      badge(ctx,(slide.kick||'BORA').toUpperCase().slice(0,14),acc,W);
      var hs3=tsize(slide.title,true); ctx.font='700 '+hs3+'px '+fam(D.fHead); ctx.fillStyle='#fff'; ctx.textAlign='left';
      var tl3=wrap(ctx,slide.title,maxW),y3=H*0.32; tl3.forEach(function(ln){ y3+=hs3; ctx.fillText(ln,pad,y3); y3+=hs3*0.08; });
      if(slide.body){ y3+=22; ctx.font='400 40px '+fam(D.fBody); ctx.fillStyle='rgba(255,255,255,.82)'; wrap(ctx,slide.body,maxW).forEach(function(ln){ y3+=40; ctx.fillText(ln,pad,y3); y3+=16; }); }
      y3+=44; var ct=slide.cta||('@'+(D.arroba||'seuperfil')); ctx.font='700 44px '+fam(D.fHead); var cw=ctx.measureText(ct).width+90;
      ctx.fillStyle=acc; rrect(ctx,pad,y3,cw,100,16); ctx.fill(); ctx.fillStyle=isLight(acc)?'#111':'#fff'; ctx.textBaseline='middle'; ctx.fillText(ct,pad+45,y3+54); ctx.textBaseline='alphabetic';
      footer(ctx,i,n,acc,true,W,H);
    } else {
      ctx.fillStyle=D.bg; ctx.fillRect(0,0,W,H); var dk3=!isLight(D.bg);
      badge(ctx,(slide.kick||t.badge).toUpperCase().slice(0,16),acc,W);
      var hs4=tsize(slide.title,false); ctx.font='700 '+hs4+'px '+fam(D.fHead); ctx.fillStyle=D.text; ctx.textAlign='left';
      var tl4=wrap(ctx,slide.title,maxW),y4=H*0.22; tl4.forEach(function(ln){ y4+=hs4; ctx.fillText(ln,pad,y4); y4+=hs4*0.08; });
      y4+=8; ctx.fillStyle=acc; ctx.fillRect(pad,y4,88,9); y4+=62;
      drawRich(ctx,slide.body||'',pad,y4+42,maxW,60,D.text,acc,42,D.fBody);
      footer(ctx,i,n,acc,dk3,W,H);
    }
    return c;
  }

  // ---------- navegação de passos ----------
  function setStep(n){
    S.step=n;
    [1,2,3,4].forEach(function(k){ $('step'+k).style.display = k===n?'block':'none'; });
    var bar=$('stepsBar'); var labels=['Templates','Tema','Roteiro','Imagens']; bar.innerHTML='';
    labels.forEach(function(lb,idx){
      var st=idx+1, cls=st===n?'on':(st<n?'done':'');
      var d=document.createElement('div'); d.className='stp '+cls; d.innerHTML='<span class="num">'+(st<n?'✓':st)+'</span><span class="lb">'+lb+'</span>';
      bar.appendChild(d); if(st<4){ var b=document.createElement('div'); b.className='bar'; bar.appendChild(b); }
    });
    window.scrollTo(0,0);
  }

  // ---------- passo 1: galeria ----------
  function renderGallery(q){
    var g=$('gallery'); q=(q||'').toLowerCase();
    var list=T.filter(function(t){ return !q || t.nome.toLowerCase().indexOf(q)>=0 || t.badge.toLowerCase().indexOf(q)>=0; });
    g.innerHTML=list.map(function(t){
      return '<button class="tpl" data-id="'+t.id+'"><div class="im"><img src="/assets/templates/preview-'+t.id+'.jpg" alt="'+t.nome+'" loading="lazy" onerror="this.closest(\'.tpl\').style.display=\'none\'"><span class="use">Ver / usar →</span></div><div class="ft">'+t.nome+'</div></button>';
    }).join('');
    g.querySelectorAll('.tpl').forEach(function(el){ el.onclick=function(){ openPreview(el.getAttribute('data-id')); }; });
  }
  var previewId=null;
  function openPreview(id){ previewId=id; var t=tById(id); $('pvNome').textContent=t.nome; $('pvImg').src='/assets/templates/preview-'+id+'.jpg'; $('prevModal').classList.add('open'); document.body.style.overflow='hidden'; }
  function chooseTemplate(id){
    S.tpl=tById(id); S.design=defaultDesign(S.tpl); coverImg=null; coverReady=false;
    $('chImg').src='/assets/templates/preview-'+id+'.jpg'; $('chNm').textContent=S.tpl.nome;
    closeModal('prevModal'); setStep(2);
  }

  // ---------- passo 2 ----------
  function updN(){ $('nsl').textContent=S.n; }

  // ---------- passo 3 ----------
  function fillFontSelects(){
    $('fHead').innerHTML=HEAD_FONTS.map(function(f){return '<option'+(f===S.design.fHead?' selected':'')+'>'+f+'</option>';}).join('');
    $('fBody').innerHTML=BODY_FONTS.map(function(f){return '<option'+(f===S.design.fBody?' selected':'')+'>'+f+'</option>';}).join('');
  }
  function toHex(c){ if(c[0]==='#') return c; var m=c.match(/\d+/g); if(!m) return '#000000'; return '#'+m.slice(0,3).map(function(x){return ('0'+parseInt(x).toString(16)).slice(-2);}).join(''); }
  function syncControls(){
    $('cBg').value=toHex(S.design.bg); $('cText').value=toHex(S.design.text); $('cBtn').value=toHex(S.design.btn); $('cSec').value=toHex(S.design.sec.indexOf('rgba')>=0?S.design.text:S.design.sec);
    $('pNome').value=S.design.nome; $('pArroba').value=S.design.arroba; $('pVerif').checked=S.design.verif;
    document.querySelectorAll('#aspectSeg button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-a')===S.design.aspect); });
    fillFontSelects();
  }
  function renderRot(){
    var box=$('rotList'); box.innerHTML='';
    S.slides.forEach(function(s,i){
      var d=document.createElement('div'); d.className='rot'+(i===S.prev?' on':'');
      d.innerHTML='<div class="rh"><span class="rn">'+(s.role==='cover'?'Capa':s.role==='cta'?'CTA':'Slide '+(i+1))+'</span><input class="et" value="'+(s.kick||'').replace(/"/g,'&quot;')+'" placeholder="etiqueta"></div>'+
        '<input class="rt tt" value="'+(s.title||'').replace(/"/g,'&quot;')+'" placeholder="Título">'+
        '<textarea class="rt bb" rows="2" placeholder="Texto (use **destaque**)">'+(s.body||'')+'</textarea>';
      var et=d.querySelector('.et'),tt=d.querySelector('.tt'),bb=d.querySelector('.bb');
      et.oninput=function(){s.kick=et.value;refreshPrev();}; tt.oninput=function(){s.title=tt.value;refreshPrev();}; bb.oninput=function(){s.body=bb.value;refreshPrev();};
      d.onclick=function(e){ if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'){ S.prev=i; markRot(); refreshPrev(true); } };
      box.appendChild(d);
    });
  }
  function markRot(){ document.querySelectorAll('#rotList .rot').forEach(function(el,i){ el.classList.toggle('on',i===S.prev); }); }
  function refreshPrev(keep){
    var f=$('prevFrame'); var c=drawSlide(S.slides[S.prev],S.prev,S.slides.length); f.innerHTML=''; f.appendChild(c);
    $('pInfo').textContent=(S.prev+1)+' / '+S.slides.length;
  }

  // ---------- passo 4 ----------
  function renderFinal(){
    var g=$('finalGrid'); g.innerHTML='';
    S.slides.forEach(function(s,i){
      var box=document.createElement('div'); box.className='fs';
      var c=drawSlide(s,i,S.slides.length); c.style.width='100%'; box.appendChild(c);
      var a=document.createElement('a'); a.textContent='⤓ Baixar '+('0'+(i+1)).slice(-2); a.href='#';
      a.onclick=function(e){ e.preventDefault(); var url=drawSlide(s,i,S.slides.length).toDataURL('image/png'); var l=document.createElement('a'); l.href=url; l.download='slide-'+(i+1)+'.png'; l.click(); };
      box.appendChild(a); g.appendChild(box);
    });
  }

  // ---------- IA ----------
  function skeleton(){
    var s=[{role:'cover',kick:S.tpl.badge,title:S.tema||'Seu tema',body:''}];
    for(var i=1;i<=S.n-2;i++) s.push({role:'content',kick:'Ponto '+i,title:'Título '+i,body:'Escreva aqui o conteúdo com **destaque**.'});
    s.push({role:'cta',kick:'Bora',title:'Gostou? Salva e segue.',body:'',cta:'@'+(S.design.arroba||'seuperfil')});
    return s;
  }
  function overlay(on,title,step){ var o=$('genov'); o.classList.toggle('on',on); if(title)$('genTitle').textContent=title; if(step)$('genStep').textContent=step; }
  async function loadImg(src){ return new Promise(function(res){ var im=new Image(); im.onload=function(){res(im);}; im.onerror=function(){res(null);}; im.src=src; }); }

  async function consumir(qtd){
    if(!(A.configured&&A.sb)) return {ok:true};
    try{ var r=await A.sb.rpc('consumir_creditos',{p_qtd:qtd}); var row=r.data&&r.data[0]; if(r.error||!row) return {ok:false,err:'erro'}; if(!row.ok) return {ok:false,saldo:row.saldo}; $('creditsN').textContent=row.saldo; return {ok:true}; }catch(e){ return {ok:false,err:e.message}; }
  }

  async function gerarRoteiro(){
    var btn=$('gerarRoteiro'); S.tema=$('tema').value.trim(); S.link=$('link').value.trim();
    if(!S.tema && !S.link){ $('tema').focus(); return; }
    var cr=await consumir(3);
    if(!cr.ok){ if(cr.saldo!==undefined){ alert('Créditos insuficientes ('+cr.saldo+'). O roteiro custa 3.'); location.href='/#planos'; } else alert('Erro nos créditos.'); return; }
    overlay(true,'Escrevendo o roteiro…','A IA está montando seu carrossel'); await document.fonts.ready;
    var got=null;
    try{ if(A.configured&&A.sb){ var r=await A.sb.functions.invoke('gerar-carrossel',{body:{tema:S.tema+(S.link?(' (base: '+S.link+')'):''),template:S.tpl.nome,n:S.n-2}}); if(!r.error&&r.data&&r.data.slides&&r.data.slides.length) got=r.data.slides.map(function(s){return {role:s.role||'content',kick:s.kick||'',title:s.title||'',body:s.body||'',cta:s.cta};}); } }catch(e){ console.warn(e); }
    S.slides = got || skeleton(); S.prev=0;
    overlay(false); setStep(3); syncControls(); renderRot(); refreshPrev();
  }

  async function gerarImagens(){
    var custo = S.tpl.photo ? 10 : 2;
    var cr=await consumir(custo);
    if(!cr.ok){ if(cr.saldo!==undefined){ alert('Créditos insuficientes ('+cr.saldo+'). As imagens custam '+custo+'.'); location.href='/#planos'; } else alert('Erro nos créditos.'); return; }
    overlay(true,'Desenhando as artes…', S.tpl.photo?'Gerando a capa por IA (~30s)':'Montando os slides');
    await document.fonts.ready;
    if(S.tpl.photo){
      coverReady=false;
      try{ if(A.configured&&A.sb){ var r=await A.sb.functions.invoke('gerar-capa',{body:{scene:S.tpl.scene,tema:S.tema}}); if(!r.error&&r.data&&r.data.b64){ coverImg=await loadImg('data:image/png;base64,'+r.data.b64); coverReady=!!coverImg; } } }catch(e){ console.warn(e); }
    }
    overlay(false); setStep(4); renderFinal();
  }

  async function download(){
    var btn=$('dlAll'); btn.classList.add('is-loading'); btn.disabled=true;
    try{ var zip=new JSZip(); await document.fonts.ready;
      for(var i=0;i<S.slides.length;i++){ zip.file('slide-'+(i+1)+'.png', drawSlide(S.slides[i],i,S.slides.length).toDataURL('image/png').split(',')[1], {base64:true}); }
      var blob=await zip.generateAsync({type:'blob'}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='meudesigner-carrossel.zip'; a.click(); setTimeout(function(){URL.revokeObjectURL(a.href)},4000);
    }catch(e){ alert('Erro: '+e.message); }
    btn.classList.remove('is-loading'); btn.disabled=false;
  }
  async function save(){
    var btn=$('saveBtn'),lab=btn.querySelector('.btn-label'),old=lab.textContent; lab.textContent='Salvando...';
    try{ var s=await A.getSession(); if(!s){location.href='/login.html';return;} await A.sb.from('carousels').insert({user_id:s.user.id,template:S.tpl.id,tema:S.tema,slides:S.slides}); lab.textContent='Salvo ✓'; }catch(e){ lab.textContent='Erro'; }
    setTimeout(function(){lab.textContent=old;},1800);
  }

  // ---------- modais / projetos ----------
  function closeModal(m){ $(m).classList.remove('open'); document.body.style.overflow=''; }
  async function loadProjetos(){
    var list=$('projList'); list.innerHTML='<div class="empty-state"><span class="spin" style="display:inline-block"></span></div>';
    try{ var s=await A.getSession(); if(!s){list.innerHTML='<div class="empty-state">Faça login.</div>';return;}
      var r=await A.sb.from('carousels').select('id,template,tema,slides,criado_em').eq('user_id',s.user.id).order('criado_em',{ascending:false}); if(r.error)throw r.error;
      var rows=r.data||[]; if(!rows.length){ list.innerHTML='<div class="empty-state"><div class="big">📁</div>Você ainda não tem projetos.</div>'; return; }
      list.innerHTML=rows.map(function(p){ var nm=tById(p.template).nome; var ds=new Date(p.criado_em).toLocaleDateString('pt-BR'); return '<button class="proj" data-id="'+p.id+'"><div class="proj-tpl">'+nm+'</div><div class="proj-tema">'+(p.tema||'—')+'</div><div class="proj-meta">'+((p.slides&&p.slides.length)||0)+' slides · '+ds+'</div></button>'; }).join('');
      list.querySelectorAll('.proj').forEach(function(el){ el.onclick=function(){ var p=rows.find(function(x){return x.id===el.getAttribute('data-id');}); reopen(p); }; });
    }catch(e){ list.innerHTML='<div class="empty-state">Erro: '+e.message+'</div>'; }
  }
  function reopen(p){
    S.tpl=tById(p.template); S.design=defaultDesign(S.tpl); S.tema=p.tema||''; S.slides=p.slides||[]; S.prev=0; coverImg=null; coverReady=false;
    closeModal('projModal'); setStep(3); syncControls(); renderRot(); refreshPrev();
  }

  // ---------- wiring ----------
  function wire(){
    $('search').oninput=function(){ renderGallery(this.value); };
    $('prevClose').onclick=function(){ closeModal('prevModal'); };
    $('prevModal').onclick=function(e){ if(e.target.id==='prevModal') closeModal('prevModal'); };
    $('pvUse').onclick=function(){ chooseTemplate(previewId); };
    $('trocarBtn').onclick=function(){ setStep(1); };
    $('s2back').onclick=function(){ setStep(1); };
    $('less').onclick=function(){ if(S.n>3){S.n--;updN();} };
    $('more').onclick=function(){ if(S.n<10){S.n++;updN();} };
    $('gerarRoteiro').onclick=gerarRoteiro;
    // passo 3 controles
    document.querySelectorAll('#aspectSeg button').forEach(function(b){ b.onclick=function(){ S.design.aspect=b.getAttribute('data-a'); document.querySelectorAll('#aspectSeg button').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); refreshPrev(); }; });
    $('fHead').onchange=function(){ S.design.fHead=this.value; refreshPrev(); };
    $('fBody').onchange=function(){ S.design.fBody=this.value; refreshPrev(); };
    $('cBg').oninput=function(){ S.design.bg=this.value; refreshPrev(); };
    $('cText').oninput=function(){ S.design.text=this.value; refreshPrev(); };
    $('cBtn').oninput=function(){ S.design.btn=this.value; refreshPrev(); };
    $('cSec').oninput=function(){ S.design.sec=this.value; refreshPrev(); };
    $('pNome').oninput=function(){ S.design.nome=this.value; refreshPrev(); };
    $('pArroba').oninput=function(){ S.design.arroba=this.value; refreshPrev(); };
    $('pVerif').onchange=function(){ S.design.verif=this.checked; refreshPrev(); };
    $('pFotoBtn').onclick=function(){ $('pFoto').click(); };
    $('pFoto').onchange=function(){ var f=this.files[0]; if(!f)return; var rd=new FileReader(); rd.onload=function(){ fotoImg=new Image(); fotoImg.onload=refreshPrev; fotoImg.src=rd.result; }; rd.readAsDataURL(f); };
    $('s3back').onclick=function(){ setStep(2); };
    $('gerarImagens').onclick=gerarImagens;
    $('pPrev').onclick=function(){ if(S.prev>0){S.prev--;markRot();refreshPrev();} };
    $('pNext').onclick=function(){ if(S.prev<S.slides.length-1){S.prev++;markRot();refreshPrev();} };
    $('dlAll').onclick=download; $('saveBtn').onclick=save;
    $('novo').onclick=function(){ S.tpl=null; S.slides=[]; coverImg=null; setStep(1); };
    // nav
    var menuOpen=false; function tm(v){menuOpen=v===undefined?!menuOpen:v;$('avatarMenu').classList.toggle('open',menuOpen);}
    $('avatarBtn').onclick=function(e){e.stopPropagation();tm();}; document.addEventListener('click',function(){if(menuOpen)tm(false);});
    $('creditsBtn').onclick=function(){location.href='/#planos';};
    $('mLogout').onclick=async function(){ await A.signOut(); location.assign('/'); };
    $('navProjetos').onclick=function(){ $('projModal').classList.add('open'); document.body.style.overflow='hidden'; loadProjetos(); };
    $('mProjetos').onclick=function(){ tm(false); $('projModal').classList.add('open'); document.body.style.overflow='hidden'; loadProjetos(); };
    $('projClose').onclick=function(){ closeModal('projModal'); };
    $('projModal').onclick=function(e){ if(e.target.id==='projModal') closeModal('projModal'); };
    A.onChange(function(evt){ if(evt==='SIGNED_OUT') location.replace('/login.html'); });
  }

  // ---------- boot ----------
  (async function(){
    if(!A.configured){ $('guard').innerHTML='<div style="text-align:center;padding:24px"><h1 style="font-family:Space Grotesk">Painel protegido</h1><p style="color:#4B5563;margin:12px 0">Configure o Supabase.</p><a class="btn btn-primary" style="width:auto;display:inline-flex" href="/login.html">Login</a></div>'; return; }
    var user=await A.requireAuth(); if(!user) return;
    var nome=(user.user_metadata&&user.user_metadata.nome)||(user.email?user.email.split('@')[0]:'você');
    $('avatarBtn').textContent=(nome||'?').charAt(0).toUpperCase(); $('mNome').textContent=nome; $('mEmail').textContent=user.email||'';
    try{ var r=await A.sb.from('profiles').select('nome,creditos').eq('id',user.id).single(); if(r.data){ $('creditsN').textContent=r.data.creditos; if(r.data.nome){$('mNome').textContent=r.data.nome;$('avatarBtn').textContent=r.data.nome.charAt(0).toUpperCase();} } }catch(_){}
    wire(); renderGallery(''); updN(); setStep(1);
    $('guard').style.display='none'; $('shell').style.display='block';
    await document.fonts.ready;
  })();
})();
