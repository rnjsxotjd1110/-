// 기준 화면 (임시 상태로 메인 화면을 최종 품질로 그림)
(function(){
  var cv=document.getElementById('screen'); G.gfx.init(cv); G.ui.bind(cv);
  var gx=G.gfx, t=0;
  var orbits=[]; for(var s=2;s<=12;s++) orbits.push(s);
  var tiers={2:1,3:2,4:3,5:4,6:6,7:5,8:4,9:3,10:2,11:7,12:8};
  var bodies={}; orbits.forEach(function(s,i){ bodies[s]={tier:tiers[s],seed:s*3+1,a0:i*1.9+0.4,mass:10}; });
  var st={orbits:orbits,bodies:bodies,stage:1,sunForm:0};
  var specs=[{shape:'d6',faces:[2,5,1,6,3,4],mat:'ivory'},{shape:'d6',faces:[2,5,1,6,3,4],mat:'ivory'},{shape:'d6',faces:[2,5,1,6,3,4],mat:'ivory'}];
  var nextRoll=0.3, lastSum=0;
  function doRoll(){
    var res=specs.map(function(){return (Math.random()*6)|0;});
    G.tray.roll(specs,res,0.9,function(){
      var sum=0; res.forEach(function(f,i){sum+=specs[i].faces[f];});
      if(sum<2) sum=2; if(sum>12) sum=12;
      var sp=G.tray.sumPos();
      G.orrery.pop(sp.x, sp.y-2, String(sum), 4, 'g11b');
      G.orrery.beam(sp.x, sp.y, sum, function(){
        G.orrery.flash(sum,1); var p=G.orrery.bodyXY(st,sum);
        G.orrery.burst(p.x,p.y,8,[4,3,8]); G.orrery.pop(p.x,p.y-8,'+12',3,'g9');
      });
    });
  }
  function topbar(){
    gx.rect(0,0,640,20,13); gx.hline(0,18,640,2); gx.hline(0,19,640,12); gx.hline(0,17,640,18);
    gx.blit(G.spr.icDust,6,4);
    G.font.draw('3.48만',18,3,3,'g11b',12);
    G.font.draw('+1,240/초',64,4,15,'g9',12);
    gx.blit(G.spr.icCore,134,4); G.font.draw('12',146,3,7,'g11b',12);
    gx.blit(G.spr.icSoundOff,612,5); gx.blit(G.spr.icGear,626,5);
    G.font.draw('궤도 11 · 천체 11',470,4,15,'g9',12);
  }
  function panel(){
    var X=416,Y=20,W=224,H=340;
    G.nine(G.spr.panel,X,Y,W,H);
    G.ui.tabs('tab',X+12,Y+9,[{key:'m',label:'기계'},{key:'u',label:'개량',dot:true},{key:'d',label:'주사위'},{key:'c',label:'초신성'},{key:'r',label:'기록'}],'m',{gap:9});
    G.ui.groove(X+8,Y+27,W-16);
    var plates=[{ic:G.spr.icPower,n:'굴림 힘',lv:'Lv 14',e:'한 번에 질량 ×18',c:'2.1만',ok:true,b:'강화하기'},
      {ic:G.spr.icWind,n:'태엽 굴림대',lv:'Lv 6',e:'1.6초마다 굴림',c:'4.8만',ok:false,b:'감기'},
      {ic:G.spr.icDie,n:'주사위',lv:'3개',e:'궤도 3~18',c:'120만',ok:false,b:'추가하기'},
      {ic:G.spr.icChisel,n:'눈 새기기',lv:'2번',e:'면 하나 ±1',c:'9,600',ok:true,b:'새기기'}];
    plates.forEach(function(p,i){
      var px=X+8+(i%2)*104, py=Y+34+Math.floor(i/2)*92, pw=100, ph=88;
      G.nine(G.spr.inset,px,py,pw,ph);
      gx.blit(p.ic,px+5,py+5);
      G.font.draw(p.n,px+24,py+5,4,'g11b',12);
      G.font.draw(p.lv,px+24,py+18,15,'g9');
      G.font.draw(p.e,px+6,py+34,8,'g9');
      gx.blit(G.spr.icDust,px+6,py+50); G.font.draw(p.c,px+17,py+49,p.ok?3:17,'g11b',12);
      G.ui.button('pb'+i,px+5,py+64,pw-10,19,p.b,{enabled:p.ok});
    });
    // 분포
    var hy=Y+226;
    G.font.draw('합의 분포',X+12,hy,15,'g9');
    var bx=X+12, bw=W-24, by=hy+60, n=orbits.length, cw=Math.floor(bw/n);
    var pr={2:1,3:2,4:3,5:4,6:5,7:6,8:5,9:4,10:3,11:2,12:1};
    orbits.forEach(function(s,i){
      var hgt=Math.round(pr[s]/6*44); var x=bx+i*cw+1;
      var hot=(G.orrery&&0);
      for(var j=0;j<hgt;j++){ gx.hline(x,by-j,cw-2, j===hgt-1?3:(j>hgt-4?2:11)); }
      gx.vline(x+cw-3,by-hgt+1,hgt-1,18);
      G.font.drawCenter(String(s),x+((cw-2)>>1),by+3,15,'g7');
    });
    G.ui.groove(X+8,by+14,W-16);
    G.font.draw('최근 굴림',X+12,by+21,15,'g9');
    [7,11,6,8,3,9,7].forEach(function(v,i){ var x=X+64+i*20; G.nine(G.spr.inset,x,by+18,18,15); G.font.drawCenter(String(v),x+9,by+20,i===0?4:15,'g11b'); });
  }
  var last=performance.now();
  function frame(now){
    var dt=Math.min(0.05,(now-last)/1000); last=now; t+=dt;
    nextRoll-=dt; if(nextRoll<=0){ nextRoll=1.6; doRoll(); }
    G.orrery.update(dt,st); G.tray.update(dt);
    if(window.__freeze) { requestAnimationFrame(frame); return; }
    if(window.__logNext){ G.textLog=[]; }
    gx.clear(12);
    G.orrery.draw(st,t,{});
    G.tray.draw({leverHot:false});
    topbar(); panel();
    G.ui.drawTooltip();
    gx.present(); G.ui.endFrame();
    if(window.__logNext){ window.__lastLog=G.textLog; G.textLog=null; window.__logNext=false; window.__freeze=true; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setTimeout(function(){window.__ready=true;},50);
})();
