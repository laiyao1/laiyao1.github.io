/* Original pixel artwork. No external assets or runtime dependencies. */
(function () {
  'use strict';
  const root = document.getElementById('chip-town');
  if (!root || root.chipTown) return;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const W = 1024, H = 620, TOP_ROAD = 298;
  const stations = [
    { id: 'logic', name: 'Logic Design', stage: '01 · Circuit design', x: 66, y: 80, w: 178, h: 158, color: '#bb6851', works: [
      { name: 'ArithTreeRL', venue: 'NeurIPS 2024 · Spotlight', desc: 'Reinforcement learning generates arithmetic trees for adders and multipliers.', paper: 'https://arxiv.org/abs/2405.06758', code: 'https://github.com/laiyao1/ArithmeticTree' }
    ], desc: 'Build the arithmetic blocks that make a chip compute.' },
    { id: 'analog', name: 'Analog Design', stage: '01 · Circuit design', x: 302, y: 72, w: 178, h: 166, color: '#d19e53', works: [
      { name: 'AnalogCoder', venue: 'AAAI 2025 · Oral', desc: 'A training-free LLM agent generates analog circuits with simulation feedback.', paper: 'https://arxiv.org/abs/2405.14918', code: 'https://github.com/laiyao1/AnalogCoder' },
      { name: 'AnalogCoder-Pro', venue: 'IEEE TCAD 2026', desc: 'Unifies topology generation, diagnosis, repair, and device sizing.', paper: 'https://arxiv.org/abs/2508.02518', code: 'https://github.com/laiyao1/AnalogCoderPro' }
    ], desc: 'Turn specifications into circuit topologies and sized devices.' },
    { id: 'physical', name: 'Physical Design', stage: '02 · Layout design', x: 547, y: 70, w: 206, h: 168, color: '#658f9f', works: [
      { name: 'MaskPlace', venue: 'NeurIPS 2022 · Spotlight', desc: 'Reinforced visual representation learning for fast chip placement.', paper: 'https://arxiv.org/abs/2211.13382', code: 'https://github.com/laiyao1/maskplace' },
      { name: 'ChiPFormer', venue: 'ICML 2023', desc: 'An offline decision transformer transfers placement policies to new circuits.', paper: 'https://arxiv.org/abs/2306.14744', code: 'https://github.com/laiyao1/chipformer' }
    ], desc: 'Arrange circuit blocks into a physical chip layout.' },
    { id: 'sim', name: 'Simulation Center', stage: 'Research · Cross-stack simulation', x: 801, y: 76, w: 157, h: 162, color: '#669c87', works: [
      { name: 'AIxSIM', venue: 'Current work · University of Cambridge', desc: 'Cross-stack simulation for exploring novel AI hardware.', paper: 'https://aicrosssim.github.io/' }
    ], desc: 'Explore hardware behavior and performance across the stack.' },
    { id: 'litho', name: 'Mask & Lithography', stage: '03 · Manufacturing preparation', x: 707, y: 366, w: 223, h: 164, color: '#9876a1', works: [
      { name: 'LithoGRPO', venue: 'ICML 2026', desc: 'Flow matching and GRPO optimize lithography masks with physics-based rewards.', paper: 'https://arxiv.org/abs/2606.00228', code: 'https://github.com/laiyao1/LithoGRPO' }
    ], desc: 'Prepare optimized masks for transferring layouts onto wafers.' },
    { id: 'fab', name: 'Wafer Fabrication', stage: '04 · Manufacturing', x: 388, y: 366, w: 224, h: 164, color: '#718e9b', works: [], desc: 'Repeated deposition, patterning, etching, and other processes build devices and interconnects on a wafer. This building completes the process map.' },
    { id: 'pack', name: 'Packaging & Test', stage: '05 · Assembly and test', x: 86, y: 374, w: 215, h: 156, color: '#c58f58', works: [], desc: 'Separate dies, assemble packages, and test the finished chips. This building completes the process map.' }
  ];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reduced.matches, selected = null, pinned = null, seconds = 0, last = 0, hideTimer, suppressFocus = false, onScreen = true;
  const tip = root.querySelector('.ct-tooltip');
  const motion = root.querySelector('.ct-motion');
  const shipmentStatus = root.querySelector('.ct-shipment');
  const hitLayer = root.querySelector('.ct-hotspots');
  const mobile = root.querySelector('.ct-mobile-stations');
  const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
  const b = bg.getContext('2d');
  const C = { grass:'#a5c887', grassHi:'#b6d596', grassDark:'#87b46f', path:'#e9d5a5', pathHi:'#f0dfb7', pathEdge:'#c3b17e', ink:'#405246', wood:'#927257', woodHi:'#c4986d', shadow:'#668455', wall:'#f5e7ca', stone:'#b0b6a2', blue:'#7daeb5', roof:'#b9694e', roofHi:'#d58463', roofDark:'#844e40' };
  const r = (c,x,y,w,h,color) => { c.fillStyle=color; c.fillRect(Math.round(x),Math.round(y),w,h); };
  function polygon(c, pts, color) { c.fillStyle=color; c.beginPath(); pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.closePath(); c.fill(); }
  function line(c,pts,color,width=2) { c.strokeStyle=color; c.lineWidth=width; c.beginPath(); pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.stroke(); }
  function ellipse(c,x,y,rx,ry,col) { c.fillStyle=col; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fill(); }
  let seed = 147;
  function rand() { seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; }
  function tree(c,x,y,s=1) {
    c.save(); c.translate(x,y); c.scale(s,s);
    r(c,-13,11,30,9,'#73975c'); r(c,-3,-4,7,27,'#96765a'); r(c,0,-4,3,24,'#b58e64');
    r(c,-17,-22,35,28,'#477d55'); r(c,-23,-13,45,20,'#477d55'); r(c,-12,-34,25,40,'#619b61');
    r(c,-17,-20,31,22,'#7eb06b'); r(c,-8,-32,18,19,'#90bd74'); r(c,-18,-12,11,12,'#639661');
    r(c,10,-12,9,17,'#3d704c'); r(c,-4,-5,14,9,'#578952'); c.restore();
  }
  function flowers(c,x,y) { [[0,0],[7,4],[14,-2]].forEach((a,i)=>{r(c,x+a[0],y+a[1],2,6,'#639d66');r(c,x+a[0]-2,y+a[1]-2,6,4,['#f4e4ba','#e7a794','#e3c366'][i]);}); }
  function bench(c,x,y) { r(c,x,y+10,34,7,'#70865b'); r(c,x+3,y,28,4,C.wood); r(c,x+3,y+6,28,5,C.woodHi); r(c,x+5,y+10,3,7,C.wood); r(c,x+27,y+10,3,7,C.wood); }
  function path(c,pts,w=40) { line(c,pts,C.pathEdge,w+6); line(c,pts,C.path,w); line(c,pts,C.pathHi,w-8); }
  function fence(c,x,y,w) { r(c,x,y+8,w,3,'#a89d76'); r(c,x,y+16,w,3,'#a89d76'); for(let i=0;i<w;i+=16){r(c,x+i,y,4,26,'#dbcfaa');r(c,x+i,y,4,3,'#f5e8c6');} }
  function roof(c,x,y,w,h,color=C.roof) {
    r(c,x+6,y+6,w,h,'#7e7661'); polygon(c,[[x,y+h],[x+14,y],[x+w-14,y],[x+w,y+h]],color);
    for(let yy=5;yy<h;yy+=7) { const inset=14*(1-yy/h); r(c,x+inset,y+yy,w-2*inset,2,'#ffffff20'); for(let xx=12+(yy%14?0:8);xx<w-5;xx+=18)r(c,x+xx,y+yy,2,6,'#33271820'); }
    r(c,x,y+h-3,w,4,'#6d554a');
  }
  function lamp(c,x,y) { r(c,x,y,3,24,'#62705d'); r(c,x-4,y-4,11,8,'#e7ce85'); r(c,x-3,y-3,8,5,'#fff0b0'); r(c,x-4,y-6,11,2,'#62705d'); }
  function windows(c,x,y,count=3) { for(let i=0;i<count;i++){r(c,x+i*25,y,18,25,'#849e9e');r(c,x+2+i*25,y+2,14,19,'#b2dad2');r(c,x+8+i*25,y,2,24,'#f0debd');r(c,x+i*25,y+10,18,2,'#f0debd');} }
  function shell(c,s) {
    const {x,y,w,h}=s;
    r(c,x+8,y+23,w,h-35,C.shadow); r(c,x-10,y+8,w+20,h-2,'#b9c59c');
    r(c,x,y+24,w,h-55,C.wood); r(c,x+4,y+28,w-8,h-63,C.wall);
    for(let yy=y+37;yy<y+h-30;yy+=10)r(c,x+4,yy,w-8,1,'#d8c5a7');
    r(c,x+8,y+64,w-16,h-99,'#d8bb91');
    for(let xx=x+10;xx<x+w-8;xx+=12)r(c,xx,y+64,1,h-99,'#c2a780');
    roof(c,x-7,y+6,w+14,49,s.color);
    r(c,x+w-35,y+h-67,23,34,'#7b7563');r(c,x+w-32,y+h-64,17,29,'#78958a');r(c,x+w-20,y+h-51,3,3,'#ebd5a3');
    r(c,x+w-40,y+h-32,34,7,'#e4d3ad');r(c,x+w-43,y+h-25,40,6,'#f0deba');
  }
  function monitor(c,x,y,w=42,h=30) { r(c,x,y,w,h,'#485a59');r(c,x+3,y+3,w-6,h-7,'#9cd2c0');r(c,x+w/2-2,y+h,4,6,'#485a59');r(c,x+7,y+h+6,w-14,3,'#8c6b51'); }
  function logic(c,s) {
    shell(c,s); const x=s.x,y=s.y;
    monitor(c,x+15,y+68,76,46); line(c,[[x+51,y+77],[x+51,y+90],[x+32,y+90],[x+32,y+102]],'#528975',3);line(c,[[x+51,y+90],[x+70,y+90],[x+70,y+102]],'#528975',3);
    [[47,76],[27,99],[65,99]].forEach(p=>r(c,x+p[0],y+p[1],9,8,'#d6efc5'));
    r(c,x+113,y+73,22,34,'#6f9aa3');r(c,x+117,y+77,14,7,'#d6e9ce');r(c,x+117,y+90,14,2,'#b7d29f');
    r(c,x+19,y+127,70,5,C.wood);r(c,x+25,y+132,6,11,C.wood);r(c,x+75,y+132,6,11,C.wood);
  }
  function analog(c,s) {
    shell(c,s); const x=s.x,y=s.y; monitor(c,x+15,y+73,69,42);
    line(c,[[x+21,y+95],[x+30,y+95],[x+36,y+86],[x+45,y+105],[x+54,y+85],[x+62,y+98],[x+77,y+98]],'#427e71',3);
    r(c,x+18,y+125,91,5,C.wood);r(c,x+95,y+82,35,27,'#9d8f75');r(c,x+99,y+86,27,17,'#e4d9a9');
    r(c,x+97,y+120,28,3,'#b39865');[[99,114],[111,114],[124,114]].forEach(a=>{r(c,x+a[0],y+a[1],5,7,'#548373');});
  }
  function physical(c,s) {
    shell(c,s);const x=s.x,y=s.y; r(c,x+13,y+69,108,67,'#536d70');r(c,x+18,y+74,98,57,'#afcbc0');
    [[21,78,26,16,'#d9af6d'],[52,78,26,27,'#82a4b0'],[84,78,26,18,'#b7796c'],[21,100,26,25,'#86a873'],[52,111,24,14,'#c391ab'],[82,102,28,23,'#deb96c']].forEach(p=>r(c,x+p[0],y+p[1],p[2],p[3],p[4]));
    line(c,[[x+47,y+84],[x+49,y+84],[x+49,y+122],[x+82,y+122]],'#e9ead1',2);r(c,x+134,y+75,35,47,'#748b88');windows(c,x+139,y+80,1);
  }
  function simulation(c,s) {
    const x=s.x,y=s.y,w=s.w,h=s.h;
    r(c,x+6,y+21,w,h-35,C.shadow);r(c,x,y+58,w,h-92,'#b8ccba');r(c,x+5,y+61,w-10,h-102,'#e3eddb');
    r(c,x+12,y+43,w-24,20,'#4f837f');r(c,x+24,y+23,w-48,28,'#699f94');r(c,x+39,y+11,w-78,24,'#8bbbb0');r(c,x+54,y+5,w-108,15,'#9dcbbb');
    r(c,x+12,y+57,w-24,5,'#426c67');r(c,x+28,y+67,92,49,'#596f6e');r(c,x+32,y+71,84,41,'#b7d9c9');
    for(let i=0;i<6;i++){r(c,x+39+i*12,y+80,8,6,'#618d8a');r(c,x+39+i*12,y+99,8,6,'#7ba78c');}line(c,[[x+43,y+87],[x+103,y+87],[x+103,y+96],[x+43,y+96]],'#6b9c91');
    r(c,x+64,y+123,24,26,'#739f8d');r(c,x+57,y+149,38,8,'#cddbc2');
    r(c,x+w-12,y+16,3,40,'#727f6e');r(c,x+w-10,y+17,24,13,'#bedfcc');
  }
  function lithography(c,s) {
    shell(c,s);const x=s.x,y=s.y;
    r(c,x+17,y+69,75,63,'#6c6481');r(c,x+23,y+76,63,32,'#c5bddb');r(c,x+32,y+77,44,11,'#7e7b99');r(c,x+45,y+88,19,18,'#9eb5da');r(c,x+30,y+112,47,7,'#e2d6bf');
    r(c,x+109,y+78,45,42,'#6f8390');r(c,x+114,y+83,35,31,'#e6d5b3');for(let i=0;i<4;i++){r(c,x+118+i*7,y+87,3,22,'#ab83a1');}
    r(c,x+112,y+129,52,5,C.wood);r(c,x+124,y+118,15,9,'#8ab3b3');
  }
  function wafer(c,x,y,rad=24) {
    ellipse(c,x,y,rad,rad,'#60758c');ellipse(c,x-1,y-2,rad-3,rad-3,'#8cb7c3');
    c.save();c.beginPath();c.arc(x-1,y-2,rad-5,0,Math.PI*2);c.clip();for(let yy=y-rad;yy<y+rad;yy+=10)for(let xx=x-rad;xx<x+rad;xx+=10){r(c,xx,yy,8,8,'#9dc7c7');r(c,xx,yy,2,8,'#6b9cac');}c.restore();r(c,x-4,y+rad-4,8,5,'#bed3c9');
  }
  function fabrication(c,s) {
    shell(c,s);const x=s.x,y=s.y;roof(c,x+21,y-15,31,24,'#98a4a1');r(c,x+28,y-24,18,18,'#b4c2b4');r(c,x+26,y-27,22,6,'#d7dfce');
    r(c,x+20,y+71,75,61,'#b4c3b5');r(c,x+25,y+76,65,43,'#59767b');wafer(c,x+57,y+97,20);
    r(c,x+105,y+72,49,57,'#98b2b1');r(c,x+111,y+78,37,21,'#d2e7db');r(c,x+111,y+106,37,4,'#7b9391');r(c,x+111,y+117,37,4,'#7b9391');
    r(c,x+165,y+72,28,33,'#c3d1bb');r(c,x+171,y+79,16,14,'#87b5b1');
  }
  function chip(c,x,y,s=1) { r(c,x-2*s,y,22*s,18*s,'#52765e');r(c,x+2*s,y+3*s,14*s,12*s,'#343e46');r(c,x+5*s,y+5*s,8*s,7*s,'#75909b');for(let i=0;i<4;i++){r(c,x+1*s+i*4*s,y-2*s,2*s,2*s,'#d5ba71');r(c,x+1*s+i*4*s,y+18*s,2*s,2*s,'#d5ba71');} }
  function packaging(c,s) {
    shell(c,s);const x=s.x,y=s.y;
    r(c,x+14,y+78,132,41,'#617b71');r(c,x+19,y+82,122,32,'#bbbfa3');for(let i=0;i<12;i++)r(c,x+21+i*10,y+84,2,27,'#969d87');
    for(let i=0;i<3;i++)chip(c,x+31+i*35,y+88,.8);
    r(c,x+146,y+57,18,42,'#d0a96e');r(c,x+121,y+58,40,7,'#e3c086');r(c,x+119,y+65,7,19,'#a47d54');
    [[29,133],[57,133],[85,133]].forEach(p=>{r(c,x+p[0],y+p[1],20,17,'#b98e5e');r(c,x+p[0]+1,y+p[1]+1,18,5,'#d4b783');r(c,x+p[0]+9,y+p[1],2,17,'#efd1a0');});
  }
  function drawBase() {
    seed=147;r(b,0,0,W,H,C.grass);
    for(let i=0;i<1600;i++){const x=rand()*W,y=rand()*H;r(b,x,y,2+rand()*3,2,rand()>.45?C.grassHi:C.grassDark);}
    // A quiet river at the edge of town.
    polygon(b,[[997,0],[982,97],[989,232],[978,383],[989,620],[1024,620],[1024,0]],'#809f9b');
    polygon(b,[[1002,0],[991,97],[998,232],[987,383],[998,620],[1024,620],[1024,0]],'#a6cbc5');
    for(let y=10;y<H;y+=32)r(b,1005+(y%3)*3,y,15,3,'#bedbd1');
    path(b,[[32,TOP_ROAD],[948,TOP_ROAD],[948,558],[32,558]],36);
    path(b,[[32,TOP_ROAD],[32,558]],28);
    stations.forEach(s=>{const cx=s.id==='sim'?s.x+76:s.x+s.w-23.5;path(b,[[cx,s.y+s.h-21],[cx,s.y<300?TOP_ROAD:558]],23);});
    // The simulation branch is outside the manufacturing sequence.
    r(b,805,260,130,3,'#819b76');
    for(let x=65;x<940;x+=38){r(b,x,264,6,2,'#c9b580');r(b,x,575,5,2,'#c9b580');}
    // Central garden, fountain, and small resting places.
    r(b,212,320,542,16,'#96ba77');r(b,226,318,516,16,'#b7cd91');
    for(let x=230;x<740;x+=21)flowers(b,x,323);
    ellipse(b,506,341,43,19,'#728f6d');ellipse(b,504,337,39,17,'#dedac0');ellipse(b,504,337,31,12,'#81b5b1');ellipse(b,500,335,21,7,'#aed4c7');r(b,500,321,8,13,'#e2e0c8');r(b,503,317,3,12,'#c7e1d3');
    bench(b,373,335);bench(b,615,335);flowers(b,668,344);flowers(b,312,348);
    // Side trees give the map a town silhouette instead of a flowchart grid.
    [[29,38,1],[67,30,.8],[986,40,.8],[977,112,.8],[34,123,1],[25,204,.8],[260,56,.9],[278,96,.7],[503,40,.9],[509,128,.85],[775,45,.8],[971,334,.7],[47,362,1],[56,429,.8],[335,401,.9],[350,447,.7],[652,404,1],[671,451,.8],[39,604,.8],[108,601,.7],[331,600,.8],[661,599,.8],[768,600,.7],[967,602,.85]].forEach(a=>tree(b,...a));
    [[35,320],[313,311],[676,312],[76,589],[867,589]].forEach(p=>flowers(b,...p));
    fence(b,84,42,163);fence(b,330,36,150);fence(b,570,36,171);fence(b,80,352,180);fence(b,396,345,211);fence(b,721,344,182);
    stations.forEach(s=>({logic,analog,physical,sim:simulation,litho:lithography,fab:fabrication,pack:packaging}[s.id])(b,s));
    [[61,252],[270,252],[518,252],[772,252],[932,332],[320,534],[656,534],[850,534]].forEach(p=>lamp(b,...p));
    // Directional paving shows the design-to-silicon loop without arrows over roofs.
    [268,511,763].forEach(x=>polygon(b,[[x,TOP_ROAD-4],[x+8,TOP_ROAD],[x,TOP_ROAD+4]],'#ad9b6e'));
    [355,659,878].forEach(x=>polygon(b,[[x+8,554],[x,558],[x+8,562]],'#ad9b6e'));
    polygon(b,[[944,345],[948,353],[952,345]],'#ad9b6e');
    r(b,386,589,251,19,'#89ab70');b.textAlign='center';b.font='12px monospace';b.fillStyle='#edf0d5';b.fillText('FROM IDEAS TO SILICON',512,603);
  }
  function person(c,x,y,color,step) {
    x=Math.round(x);y=Math.round(y);ellipse(c,x,y+11,6,3,'#6b86576b');r(c,x-3,y-8,7,7,'#e5c39b');r(c,x-3,y-10,7,3,'#665448');r(c,x-4,y-1,9,8,color);r(c,x-5,y,2,5,'#e3bc92');r(c,x+5,y,2,5,'#e3bc92');r(c,x-3,y+7,3,5+(step?1:0),'#51636b');r(c,x+2,y+7,3,5+(step?0:1),'#51636b');
  }
  function routeAt(points,u) {
    const lens=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
    let d=Math.max(0,Math.min(1,u))*lens.reduce((a,v)=>a+v,0);
    for(let i=0;i<lens.length;i++){if(d<=lens[i]){const a=points[i],b=points[i+1],f=lens[i]?d/lens[i]:0;return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,b[0]-a[0],b[1]-a[1]];}d-=lens[i];}
    return [...points[points.length-1],1,0];
  }
  const workshops = {
    logic: { bench:[173,203], input:'netlist', output:'netlist', action:'Designing', verb:'Creating a circuit netlist', duration:1.2 },
    analog: { bench:[409,202], input:'netlist', output:'netlist', action:'Designing', verb:'Creating a circuit netlist', duration:1.2 },
    physical: { bench:[617,188], input:'netlist', output:'layout', action:'Placing', verb:'Netlist → Physical layout', duration:1.5 },
    litho: { bench:[844,481], input:'layout', output:'mask', action:'Masking', verb:'Layout → Lithography mask', duration:1.5 },
    fab: { bench:[518,475], input:'mask', output:'wafer', action:'Fabricating', verb:'Mask → Patterned wafer', duration:1.5 },
    pack: { bench:[179,474], input:'wafer', output:'chip', action:'Testing', verb:'Wafer → Packaged chip', duration:1.5 }
  };
  const cargoNames={netlist:'Netlist',layout:'Layout',mask:'Mask',wafer:'Wafer',chip:'Chip'};
  const byId=id=>stations.find(s=>s.id===id);
  const porch=id=>{const s=byId(id);return [s.x+s.w-23.5,s.y+s.h-21];};
  const door=id=>{const s=byId(id);return [s.x+s.w-23.5,s.y+s.h-50];};
  const truckBed=p=>[p[0],p[1]-16];
  function deliveryRoute(from,to) {
    const a=porch(from),z=porch(to);
    if(byId(from).y<300 && byId(to).y<300)return [a,[a[0],TOP_ROAD],[z[0],TOP_ROAD],z];
    if(byId(from).y<300)return [a,[a[0],TOP_ROAD],[948,TOP_ROAD],[948,558],[z[0],558],z];
    return [a,[a[0],558],[z[0],558],z];
  }
  function buildJourney(origin,nextOrigin) {
    const sequence=[origin,'physical','litho','fab','pack'],phases=[];
    sequence.forEach((id,i)=>{
      const work=workshops[id];
      phases.push({type:'process',station:id,kind:work.input,output:work.output,duration:work.duration});
      if(i===sequence.length-1)return;
      const to=sequence[i+1];
      phases.push({type:'load',station:id,to,kind:work.output,duration:.5,points:[work.bench,door(id),truckBed(porch(id))]});
      phases.push({type:'transfer',station:id,to,kind:work.output,duration:[2.8,3.4,2.4,2.4][i],points:deliveryRoute(id,to)});
      phases.push({type:'unload',station:to,from:id,kind:work.output,duration:.65,points:[truckBed(porch(to)),door(to),workshops[to].bench]});
    });
    phases.push({type:'complete',station:'pack',kind:'chip',duration:1.7});
    const a=porch('pack'),z=porch(nextOrigin);
    phases.push({type:'return',station:'pack',to:nextOrigin,kind:'chip',duration:3.5,points:[a,[a[0],558],[32,558],[32,TOP_ROAD],[z[0],TOP_ROAD],z]});
    let elapsed=0;phases.forEach(p=>{p.start=elapsed;elapsed+=p.duration;});
    return {phases,duration:elapsed};
  }
  // Circuit design has two parallel entry points; neither is a manufacturing step after the other.
  const journeys=[buildJourney('logic','analog'),buildJourney('analog','logic')];
  const cycleDuration=journeys[0].duration;
  function shipmentAt(t) {
    const cycle=Math.floor(Math.max(0,t)/cycleDuration),local=Math.max(0,t)-cycle*cycleDuration;
    const journey=journeys[cycle%2];
    const phase=journey.phases.find(p=>local<p.start+p.duration)||journey.phases[journey.phases.length-1];
    const progress=Math.max(0,Math.min(1,(local-phase.start)/phase.duration));
    const state={...phase,progress,design:cycle+1,cart:porch(phase.station),cargo:workshops[phase.station].bench,outputVisible:false};
    if(phase.type==='transfer'){state.cart=routeAt(phase.points,progress);state.cargo=truckBed(state.cart);}
    else if(phase.type==='return')state.cart=routeAt(phase.points,progress);
    else if(phase.type==='load'||phase.type==='unload')state.cargo=routeAt(phase.points,progress);
    else if(phase.type==='process'&&progress>=.72){state.kind=phase.output;state.outputVisible=true;}
    if(phase.type==='transfer')state.caption=cargoNames[phase.kind]+' · '+byId(phase.station).name+' → '+byId(phase.to).name;
    else if(phase.type==='load')state.caption='Loading '+cargoNames[phase.kind].toLowerCase()+' · '+byId(phase.station).name+' → '+byId(phase.to).name;
    else if(phase.type==='unload')state.caption='Receiving '+cargoNames[phase.kind].toLowerCase()+' · '+byId(phase.station).name;
    else if(phase.type==='process')state.caption=byId(phase.station).name+' · '+workshops[phase.station].verb;
    else if(phase.type==='complete')state.caption='Packaging & Test · Finished chip ✓';
    else state.caption='Finished chip ✓ · Next design: '+byId(phase.to).name;
    return state;
  }
  function cart(c,x,y,direction=1) {
    c.save();c.translate(Math.round(x),Math.round(y));if(direction<0)c.scale(-1,1);
    ellipse(c,3,15,34,6,'#62815270');
    r(c,-22,-10,44,22,'#aa7854');r(c,-20,-8,40,18,'#e8c889');r(c,-20,6,40,4,'#b48e5a');
    r(c,20,-17,17,29,'#3f7d72');r(c,23,-14,11,12,'#bfe0ce');r(c,25,1,9,4,'#649b8b');r(c,35,4,4,6,'#e9d996');
    r(c,-18,10,10,8,'#42514d');r(c,24,10,10,8,'#42514d');r(c,-15,12,4,4,'#bac5b6');r(c,27,12,4,4,'#bac5b6');
    c.restore();
  }
  function payload(c,x,y,kind,t) {
    c.save();c.translate(Math.round(x),Math.round(y));
    ellipse(c,0,14,24,7,'#405d4430');
    if(kind==='netlist'){
      r(c,-17,-19,34,36,'#637d72');r(c,-15,-17,30,32,'#fff5d6');
      line(c,[[0,-10],[0,-1],[-9,-1],[-9,8]],'#4d8a80',3);line(c,[[0,-1],[9,-1],[9,8]],'#4d8a80',3);
      [[-4,-13],[-13,6],[5,6]].forEach(p=>r(c,p[0],p[1],8,6,'#739c83'));
    } else if(kind==='layout'){
      r(c,-19,-17,38,34,'#405f62');r(c,-16,-14,32,28,'#bfd7bc');
      [[-13,-11,11,8,'#ce965d'],[2,-11,11,14,'#719aaa'],[-13,1,11,10,'#7f9a67'],[2,7,11,5,'#b685a5']].forEach(p=>r(c,...p));
      line(c,[[-2,-7],[0,-7],[0,5],[7,5]],'#f9efb8',2);
    } else if(kind==='mask'){
      r(c,-19,-19,38,38,'#5b5775');r(c,-15,-15,30,30,'#ddd3e6');
      line(c,[[-10,-10],[3,-10],[3,-2],[11,-2],[11,10],[-5,10],[-5,2],[-11,2]],'#8c71a0',5);
      r(c,-17,-17,4,4,'#f3e7fa');r(c,13,13,4,4,'#f3e7fa');
    } else if(kind==='wafer')wafer(c,0,0,21);
    else chip(c,-15,-14,1.65);
    // A moving glint keeps the carried item readable against the road and the machinery.
    r(c,-20,-24,3,7,'#fff4b0');r(c,-22,-22,7,3,'#fff4b0');
    if(Math.floor(t*2)%2===0){r(c,20,12,2,5,'#fff4b0');r(c,18,14,6,2,'#fff4b0');}
    c.restore();
  }
  function roofTag(s,text) {
    const x=s.x+s.w/2,y=s.y+32;ctx.font='500 14px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    const w=ctx.measureText(text).width+16;r(ctx,x-w/2,y-11,w,22,'#395f50');r(ctx,x-w/2,y+11,w,2,'#f4e7a2');ctx.fillStyle='#fff4d3';ctx.fillText(text,x,y+1);
  }
  let lastStatus='';
  function drawShipment(state,t,showLabels,exportLabels) {
    const s=byId(state.station),p=state.progress;
    if(state.type==='transfer'){
      ctx.save();ctx.setLineDash([3,9]);line(ctx,state.points,'#61836b85',3);ctx.restore();
      const next=byId(state.to);roofTag(next,'NEXT');
      const d=door(state.to);ellipse(ctx,d[0],d[1]+1,17,13,'#fff1a44d');
    } else if(state.type!=='return'){
      const tag=state.type==='process'?workshops[state.station].action.toUpperCase():state.type==='load'?'LOADING':state.type==='unload'?'RECEIVING':'READY ✓';
      roofTag(s,tag);
      const work=workshops[state.station],x=work.bench[0],y=work.bench[1];
      r(ctx,x-26,y+27,52,5,'#506e5435');
      if(state.type==='process')r(ctx,x-26,y+27,52*p,5,'#f6e5a0');
      if(state.type==='complete')r(ctx,x-26,y+27,52,5,'#f6e5a0');
    }
    const direction=state.cart[2]|| (state.station==='litho'||state.station==='fab'||state.station==='pack'?-1:1);
    cart(ctx,state.cart[0],state.cart[1],state.cart[0]<42?1:direction);
    ctx.save();
    if(state.type==='return')ctx.globalAlpha=Math.min(1,(1-p)*4);
    payload(ctx,state.cargo[0],state.cargo[1],state.kind,t);
    const label=String(state.design).padStart(2,'0')+' · '+cargoNames[state.kind].toUpperCase();
    if(showLabels){ctx.font='500 15px monospace';ctx.textAlign='center';ctx.textBaseline='middle';const tw=ctx.measureText(label).width;
      let lx=state.cargo[0],ly=state.cargo[1]-45;
      if(state.type==='transfer' && state.cart[3]===0){
        // Keep the shipment identifier on the road, away from the workshop nameplates.
        lx=state.cart[0]+46+tw/2+6;ly=state.cart[1]+1;
        if(lx+tw/2+6>W-12)lx=state.cart[0]-32-tw/2-6;
      } else if(state.type==='transfer')ly=state.cargo[1]-57;
      lx=Math.max(tw/2+6,Math.min(W-tw/2-6,lx));
      r(ctx,lx-tw/2-6,ly-11,tw+12,22,'#fff6dceF');ctx.fillStyle='#355647';ctx.fillText(label,lx,ly+1);
    }
    ctx.restore();
    const status='Design '+String(state.design).padStart(2,'0')+' · '+state.caption;
    // Announce changes of phase only, rather than every animation frame.
    const statusKey=state.design+':'+state.start;
    if(lastStatus!==statusKey){shipmentStatus.textContent=status;lastStatus=statusKey;}
    if(exportLabels){r(ctx,258,583,510,37,C.grass);ctx.font='500 16px "Trebuchet MS", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      let caption='DESIGN '+String(state.design).padStart(2,'0')+' · '+state.caption;
      if(ctx.measureText(caption).width>690)caption='DESIGN '+String(state.design).padStart(2,'0')+' · '+cargoNames[state.kind]+' → '+byId(state.to||state.station).name;
      const tw=ctx.measureText(caption).width;r(ctx,512-tw/2-12,590,tw+24,27,'#eaf0cf');ctx.fillStyle=C.ink;ctx.fillText(caption,512,604);
    }
  }
  function draw(t=seconds, exportLabels=false) {
    ctx.clearRect(0,0,W,H);ctx.drawImage(bg,0,0);
    const wave=(Math.sin(t*Math.PI)+1)/2;
    // Small workshop activity: mask exposure, layout scanner, fab indicators.
    r(ctx,752,461,18,12,'#afc9e4');r(ctx,754,459,14,14,`rgba(221,239,255,${.2+.6*wave})`);
    r(ctx,569+((t%6)/6)*93,151,3,44,'#e5efd180');
    for(let i=0;i<3;i++)r(ctx,502+i*10,476,4,4,(Math.floor(t*2)+i)%3===0?'#f1db87':'#7eab93');
    // Townspeople are scenery. One tracked shipment makes the actual handoffs explicit.
    const p1=routeAt([[192,310],[692,310],[692,287],[690,310],[192,310]],((t/24)+.1)%1);person(ctx,p1[0],p1[1],'#7396bb',Math.floor(t*5)%2);
    const p2=routeAt([[889,304],[889,338],[633,338],[889,338],[889,304]],((t/24)+.5)%1);person(ctx,p2[0],p2[1],'#b77261',Math.floor(t*5)%2);
    const p3=routeAt([[190,570],[544,570],[190,570]],((t/24)+.4)%1);person(ctx,p3[0],p3[1],'#8a78a6',Math.floor(t*5)%2);
    person(ctx,180,196,'#78a28d',0);person(ctx,418,186,'#f2e6c6',Math.floor(t*3)%2);person(ctx,848,466,'#f2e6c6',0);
    const showLabels=exportLabels || root.clientWidth>=600;
    stations.forEach((s,i)=>{
      if(selected===s.id) { ctx.strokeStyle='#fff1ac';ctx.lineWidth=3;ctx.setLineDash([]);ctx.strokeRect(s.x-8,s.y-3,s.w+16,s.h+2);r(ctx,s.x+s.w/2-6,s.y-11,12,7,'#fff1ac'); }
      const lx=s.x+s.w/2,ly=s.y+s.h+10;
      ctx.textAlign='center';ctx.textBaseline='middle';
      if(showLabels){ctx.font='500 18px "Trebuchet MS", sans-serif';const tw=ctx.measureText(s.name).width;r(ctx,lx-tw/2-9,ly-11,tw+18,24,'#f8f2dce8');r(ctx,lx-tw/2-9,ly+13,tw+18,2,'#647c5050');ctx.fillStyle=C.ink;ctx.fillText(s.name,lx,ly+1);}
      else{r(ctx,lx-14,ly-14,28,28,'#f8f2dc');ctx.font='500 23px sans-serif';ctx.fillStyle=C.ink;ctx.fillText(String(i+1),lx,ly+1);}
    });
    drawShipment(shipmentAt(t),t,showLabels,exportLabels);
  }
  function saveChoice(id) { if(window.openai && window.openai.setWidgetState)window.openai.setWidgetState({modelContent:{building:id},privateContent:{playing}}).catch(()=>{}); }
  function clearSelection() { clearTimeout(hideTimer);selected=null;pinned=null;tip.hidden=true;root.querySelectorAll('[data-station]').forEach(el=>el.setAttribute('aria-expanded','false'));draw(); }
  function positionTip(s) {
    const stage=root.querySelector('.ct-stage'),cw=stage.clientWidth,ch=canvas.clientHeight;
    const x=(s.x+s.w/2)/W*cw,y=(s.y+s.h)/H*ch;
    const tw=tip.offsetWidth,th=tip.offsetHeight;
    const right=(s.x+s.w+16)/W*cw, leftSide=(s.x-16)/W*cw-tw;
    let left,top;
    // Place popovers beside the active building, so they never steal its hover.
    if(right+tw<=cw-12){left=right;top=Math.max(12,Math.min(ch-th-12,s.y/H*ch));}
    else if(leftSide>=12){left=leftSide;top=Math.max(12,Math.min(ch-th-12,s.y/H*ch));}
    else{left=Math.max(12,Math.min(cw-tw-12,x-tw/2));top=y+24;if(top+th>ch-12)top=Math.max(12,s.y/H*ch-th-12);}
    tip.style.left=left+'px';tip.style.top=top+'px';
  }
  function selectStation(id,pin=false,remember=true) {
    const s=stations.find(s=>s.id===id);if(!s)return;
    clearTimeout(hideTimer);selected=id;if(pin)pinned=id;
    tip.innerHTML='<div class="ct-tip-top"><h3 class="ct-tip-title">'+s.name+'</h3><button class="ct-close" type="button" aria-label="Close building details">×</button></div><p class="ct-tip-desc">'+s.desc+'</p>'+s.works.map(w=>'<div class="ct-work"><a href="'+w.paper+'" target="_blank" rel="noopener noreferrer">'+w.name+'</a><span class="ct-venue">'+w.venue+'</span><p>'+w.desc+'</p><div class="ct-work-links"><a href="'+w.paper+'" target="_blank" rel="noopener noreferrer">'+(w.name==='AIxSIM'?'Project ↗':'Paper ↗')+'</a>'+(w.code?'<a href="'+w.code+'" target="_blank" rel="noopener noreferrer">Code ↗</a>':'')+'</div></div>').join('');
    tip.hidden=false;tip.querySelector('.ct-close').addEventListener('click',()=>{const trigger=hitLayer.querySelector('[data-station="'+id+'"]');clearSelection();suppressFocus=true;trigger.focus({preventScroll:true});suppressFocus=false;});
    root.querySelectorAll('[data-station]').forEach(el=>el.setAttribute('aria-expanded',String(el.dataset.station===id)));positionTip(s);draw();if(pin&&remember)saveChoice(id);
  }
  function delayClose() { if(pinned)return;hideTimer=setTimeout(clearSelection,350); }
  stations.forEach((s,i)=>{
    const button=document.createElement('button');button.type='button';button.className='ct-hotspot cursor-interaction';button.dataset.station=s.id;button.setAttribute('aria-label',s.name+(s.works.length?': '+s.works.map(w=>w.name).join(', '):''));button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','ct-building-detail');button.style.left=(s.x-8)/W*100+'%';button.style.top=(s.y-5)/H*100+'%';button.style.width=(s.w+16)/W*100+'%';button.style.height=(s.h+29)/H*100+'%';
    button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!pinned)selectStation(s.id);});button.addEventListener('pointerleave',delayClose);button.addEventListener('focus',()=>{if(!pinned&&!suppressFocus)selectStation(s.id);});button.addEventListener('blur',delayClose);
    button.addEventListener('click',()=>{if(pinned===s.id)clearSelection();else selectStation(s.id,true);});hitLayer.appendChild(button);
    const mb=document.createElement('button');mb.type='button';mb.dataset.station=s.id;mb.setAttribute('aria-expanded','false');mb.setAttribute('aria-controls','ct-building-detail');mb.textContent=(i+1)+'. '+s.name;mb.addEventListener('click',()=>pinned===s.id?clearSelection():selectStation(s.id,true));mobile.appendChild(mb);
  });
  tip.id='ct-building-detail';tip.addEventListener('pointerenter',()=>clearTimeout(hideTimer));tip.addEventListener('pointerleave',delayClose);tip.addEventListener('focusin',()=>clearTimeout(hideTimer));tip.addEventListener('focusout',e=>{if(!tip.contains(e.relatedTarget))delayClose();});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){const trigger=(pinned||selected)&&hitLayer.querySelector('[data-station="'+(pinned||selected)+'"]');clearSelection();if(trigger){suppressFocus=true;trigger.focus({preventScroll:true});suppressFocus=false;}}});
  root.addEventListener('pointerdown',e=>{if(pinned&&!e.target.closest('.ct-tooltip, [data-station]'))clearSelection();});
  function setPlaying(value) { playing=Boolean(value);motion.textContent=playing?'Pause animation':'Play animation';motion.setAttribute('aria-pressed',String(!playing));last=0; }
  motion.addEventListener('click',()=>{setPlaying(!playing);saveChoice(pinned);});
  reduced.addEventListener('change',e=>{if(e.matches)setPlaying(false);});
  function tick(now) { const animate=playing&&onScreen&&document.visibilityState!=='hidden';if(last&&animate)seconds+=Math.min((now-last)/1000,.1);last=now;if(animate)draw();requestAnimationFrame(tick); }
  drawBase();root.classList.add('ct-ready');setPlaying(playing);draw();requestAnimationFrame(tick);
  const ro=new ResizeObserver(()=>{draw();if(selected)positionTip(stations.find(s=>s.id===selected));});ro.observe(root);
  const visibility=new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;});visibility.observe(root);
  root.chipTown={ render(t,labels=true){seconds=t;draw(t,labels);},setPlaying,selectStation,clearSelection,stations,shipmentAt,cycleDuration };
  function applyState(state){if(!state)return;if(state.privateContent && typeof state.privateContent.playing==='boolean')setPlaying(state.privateContent.playing);if(state.modelContent && state.modelContent.building)selectStation(state.modelContent.building,true,false);}
  if(window.openai)applyState(window.openai.widgetState);
  window.addEventListener('openai:set_globals',event=>{if(event.detail&&event.detail.globals)applyState(event.detail.globals.widgetState);});
}());
