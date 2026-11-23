/* Nexo — comportamento da página (animações, demonstrações, planos, dúvidas). */
(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const RM = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : {matches:false};
  const reduced = () => RM.matches;
  const EASE = "cubic-bezier(.22,.8,.24,1)";
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const brl = n => "R$ " + n.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});

  /* --- Pagamento ---
     Os botões "Assinar o Nexo" do topo, da abertura e do final levam à seção de planos.
     O botão do plano abre o checkout do período selecionado. */
  const pay = $("[data-checkout]"), note = $("#pay-note"), via = $("#pay-via");
  let CFG = {};
  try { CFG = JSON.parse($("#nexo-config").textContent); } catch(e) { CFG = {}; }
  const PAYMENT_LINKS = (CFG && CFG.pagamento) || {};
  const ALLOWED_HOSTS = ["pay.hotmart.com", "buy.stripe.com"];
  const validLink = u => {
    if (typeof u !== "string" || !u.trim()) return false;
    try { const x = new URL(u.trim()); return x.protocol === "https:" && ALLOWED_HOSTS.includes(x.hostname); }
    catch(e) { return false; }
  };
  const linkFor = p => validLink(PAYMENT_LINKS[p]) ? PAYMENT_LINKS[p].trim() : "";
  const platform = u => /hotmart\.com/i.test(u) ? "Hotmart" : /stripe\.com/i.test(u) ? "Stripe" : "";
  const periods = $$("[data-period]").map(b => b.dataset.period);
  const available = periods.filter(p => linkFor(p));
  const single = available.length === 1;
  // Esconde períodos sem checkout (quando ao menos um tem link)
  if (available.length) $$("[data-period]").forEach(b => { b.hidden = !available.includes(b.dataset.period); });
  $(".switch").hidden = single;
  $$("[data-only]").forEach(el => { el.hidden = (el.dataset.only === "single") !== single; });
  function setCheckout(p){
    const url = linkFor(p);
    if (url) { pay.href = url; pay.rel = "noopener"; pay.removeAttribute("data-fallback"); note.classList.remove("show"); }
    else { pay.href = "#planos"; pay.removeAttribute("rel"); pay.setAttribute("data-fallback", ""); }
    const name = platform(url);
    if (via) { via.hidden = !name; via.textContent = name ? "Você conclui a assinatura na página de pagamento da " + name + "." : ""; }
  }
  pay.addEventListener("click", e => {
    if (!pay.hasAttribute("data-fallback")) return;   // link configurado: segue para o checkout
    e.preventDefault(); note.classList.add("show"); note.querySelector("a").focus();
  });

  /* --- Sequências canceláveis: uma nova execução interrompe a anterior --- */
  function Runner(){ this.id = 0; this.anims = []; this.temps = []; }
  Runner.prototype.start = function(){
    this.id++;
    this.anims.forEach(a => { try { a.cancel(); } catch(e){} });
    this.anims = []; this.temps.forEach(n => n.remove()); this.temps = [];
    return this.id;
  };
  Runner.prototype.alive = function(t){ return t === this.id; };
  Runner.prototype.anim = function(el, kf, opt){
    if (!el || !el.animate) return {finished: Promise.resolve()};
    const a = el.animate(kf, Object.assign({duration:240, easing:EASE, fill:"forwards"}, opt));
    this.anims.push(a); return a;
  };
  // Entrada padrão de um elemento
  Runner.prototype.enter = function(el, opt){
    return this.anim(el, [{opacity:0, transform:"translateY(6px)"},{opacity:1, transform:"none"}], opt);
  };
  // Assinatura: linha da cor da marca da resposta até o registro + check desenhado
  Runner.prototype.trace = async function(t, host, fromEl, ck){
    const svg = $(".trace", host), path = $("path", svg);
    const h = host.getBoundingClientRect(), a = fromEl.getBoundingClientRect(), b = ck.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${h.width} ${h.height}`);
    let d;
    if (b.left > a.right - 4) {           // registro à direita (painel em colunas)
      const ax = a.right - h.left + 6, ay = a.top + a.height/2 - h.top;
      const bx = b.left - h.left - 4, by = b.top + b.height/2 - h.top, mx = (ax + bx)/2;
      d = `M${ax} ${ay} C${mx} ${ay} ${mx} ${by} ${bx} ${by}`;
    } else {                              // registro abaixo
      const ax = a.left - h.left + 24, ay = a.bottom - h.top + 5;
      const bx = b.left + b.width/2 - h.left, by = b.top - h.top - 4, my = (ay + by)/2;
      d = `M${ax} ${ay} C${ax} ${my} ${bx} ${my} ${bx} ${by}`;
    }
    path.setAttribute("d", d);
    await this.anim(path, [{strokeDashoffset:1, opacity:1},{strokeDashoffset:0, opacity:1}], {duration:380, easing:"cubic-bezier(.6,0,.3,1)"}).finished.catch(()=>{});
    if (!this.alive(t)) return;
    this.anim(path, [{strokeDashoffset:0, opacity:1},{strokeDashoffset:0, opacity:0}], {duration:500, delay:350});
    await this.check(ck);
  };
  Runner.prototype.check = function(ck){
    this.anim($(".ck-bg", ck), [{transform:"scale(0)"},{transform:"scale(1.12)", offset:.7},{transform:"scale(1)"}], {duration:220});
    return this.anim($(".ck-mark", ck), [{strokeDashoffset:1},{strokeDashoffset:0}], {duration:240, delay:120, easing:"cubic-bezier(.65,0,.35,1)"}).finished.catch(()=>{});
  };
  Runner.prototype.count = function(t, el, to, dur){
    return new Promise(res => {
      const t0 = performance.now();
      const step = now => {
        if (!this.alive(t)) return res();
        const p = Math.min(1, (now - t0)/dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = brl(to * e);
        p < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
  };

  /* ===== 1. Primeira tela: o valor escrito vira o valor registrado ===== */
  const H = new Runner(), hero = $("#hero-demo");
  const HL = "rgba(71,215,123,.42)", HL0 = "rgba(71,215,123,0)";
  async function playHero(){
    const t = H.start();
    const out = $("#h-out"), typing = $("#h-typing"), reply = $("#h-in"), card = $("#h-result");
    const amt = $("#h-amt"), val = $("#h-val"), ck = $("#h-ck");
    hero.classList.add("armed"); amt.classList.remove("hl");
    if (reduced()) { hero.classList.remove("armed"); amt.classList.add("hl"); return; }
    H.enter(out, {duration:220});
    await wait(240); if (!H.alive(t)) return;
    H.anim(typing, [{opacity:0, transform:"scale(.9)"},{opacity:1, transform:"none"}], {duration:150});
    await wait(480); if (!H.alive(t)) return;
    H.anim(typing, [{opacity:1},{opacity:0}], {duration:100});
    H.enter(reply, {duration:200});
    // A ficha aparece sem o valor; o espaço dele já está reservado
    $$("[data-rv]", card).filter(el => el !== val).forEach((el, i) => H.enter(el, {duration:220, delay:i*40}));
    await wait(200); if (!H.alive(t)) return;
    // 1º destaque: o valor que a pessoa escreveu
    H.anim(amt, [{backgroundColor:HL0},{backgroundColor:HL}], {duration:160});
    await wait(170); if (!H.alive(t)) return;
    // 2º destaque: o mesmo valor, agora na ficha (mesma cena no celular e no computador)
    H.anim(val, [{opacity:0},{opacity:1}], {duration:180});
    H.anim(val, [{backgroundColor:HL0, boxShadow:"0 0 0 0 " + HL0},{backgroundColor:HL, boxShadow:"0 0 0 5px " + HL, offset:.3},{backgroundColor:HL0, boxShadow:"0 0 0 5px " + HL0}], {duration:900, easing:"ease-out"});
    await wait(150); if (!H.alive(t)) return;
    await H.check(ck);
  }
  $("#h-replay").addEventListener("click", playHero);
  if ("IntersectionObserver" in window) {
    // Começa quando a conversa e a ficha estão na tela
    // Espera o bloco terminar de entrar (abertura em cascata) antes de tocar a cena
    const entrance = () => Promise.all((hero.getAnimations ? hero.getAnimations() : []).filter(a => a.animationName === "nexoFadeUp").map(a => a.finished.catch(() => {})));
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); entrance().then(playHero); } }, {threshold:.8});
    io.observe($("#h-result"));
  } else playHero();

  /* ===== 2. Demonstração ===== */
  const tick = '<svg viewBox="0 0 16 11" aria-label="lida"><path d="M11.1.6 4.9 6.9 2.4 4.4 1.3 5.5l3.6 3.6L12.2 1.7zM14.7.6 8.4 6.9l-.6-.6-1.1 1.1 1.7 1.7 7.4-7.4z"/></svg>';
  const ckSvg = '<span class="ck"><svg viewBox="0 0 22 22" aria-hidden="true"><circle class="ck-bg" cx="11" cy="11" r="11"/><path class="ck-mark" pathLength="1" d="m6.6 11.3 3 3 5.9-6.3"/></svg></span>';
  const cats = [["Alimentação",812.30],["Casa",598.00],["Transporte",426.00],["Lazer",348.30]];
  const total = cats.reduce((s,c) => s + c[1], 0);

  const demos = [
    {
      out:"Quanto gastei esse mês?", tOut:"20:15",
      in:'Neste mês você gastou <b class="num">'+brl(total)+'</b>. Alimentação é a categoria que mais pesou. Quer o detalhe por categoria?', tIn:"20:15",
      result:
        '<p class="result-label" data-rv><span class="dot"></span>Gastos do mês</p>'+
        '<p class="result-main" id="d-total" data-rv>'+brl(total)+'</p>'+
        '<p class="result-sub" data-rv>Total registrado até hoje</p>'+
        '<ul class="bars">'+cats.map(c => '<li data-rv><span>'+c[0]+'</span><b>'+brl(c[1])+'</b><span class="bar" aria-hidden="true"><span style="width:'+(c[1]/cats[0][1]*100).toFixed(1)+'%"></span></span></li>').join("")+'</ul>'+
        '<p class="note" data-rv>Os valores são ilustrativos.</p>',
      play: async (t, R) => {
        const items = $$("#demo-result [data-rv]");
        R.enter(items[0], {duration:200});
        R.enter(items[1], {duration:200}); R.enter(items[2], {duration:200, delay:60});
        R.count(t, $("#d-total"), total, 650);
        $$("#demo-result .bars li").forEach((li, i) => {
          R.enter(li, {duration:220, delay:120 + i*70});
          R.anim($(".bar span", li), [{transform:"scaleX(0)"},{transform:"scaleX(1)"}], {duration:620, delay:160 + i*70});
        });
        R.enter(items[items.length-1], {duration:200, delay:500});
      }
    },
    {
      out:'Me lembra de pagar o aluguel <span class="tk" data-k="d">dia 5</span> <span class="tk" data-k="h">às 9h</span>', tOut:"18:02",
      in:'Combinado! Vou te lembrar no dia 5, às 9h. 📅', tIn:"18:02",
      result:
        '<p class="result-label" data-rv>'+ckSvg+'Lembrete criado</p>'+
        '<div class="agenda" data-rv>'+
          '<div class="cal"><span class="cal-m">DIA</span><span class="cal-d" data-to="d" data-rv>5</span></div>'+
          '<div><p class="ag-title">Pagar o aluguel</p><p class="ag-time"><span class="pill" data-to="h" data-rv>9:00</span>Aviso no WhatsApp</p></div>'+
        '</div>'+
        '<p class="note" data-rv>O compromisso também entra no seu resumo diário.</p>',
      play: async (t, R, reply) => {
        const res = $("#demo-result"), panel = $("#painel");
        const [label, agenda, note] = $$(":scope > [data-rv]", res);
        R.enter(label, {duration:200}); R.enter(agenda, {duration:240, delay:40});
        // Data e horário saem da mensagem e viram a ficha de agenda
        const p = panel.getBoundingClientRect();
        const flights = $$("#demo-chat .tk").map((tk, i) => {
          R.anim(tk, [{backgroundColor:"rgba(71,215,123,0)"},{backgroundColor:"rgba(71,215,123,.42)"}], {duration:180});
          const target = $('[data-to="'+tk.dataset.k+'"]', res);
          const a = tk.getBoundingClientRect(), b = target.getBoundingClientRect();
          const f = document.createElement("span"); f.className = "fly"; f.textContent = tk.textContent;
          f.style.left = (a.left - p.left - 4) + "px"; f.style.top = (a.top - p.top) + "px";
          panel.appendChild(f); R.temps.push(f);
          const dx = (b.left + b.width/2) - (a.left + a.width/2), dy = (b.top + b.height/2) - (a.top + a.height/2);
          return R.anim(f, [{transform:"translate(0,0)", opacity:1},{transform:`translate(${dx}px,${dy}px) scale(1.15)`, opacity:.9, offset:.85},{transform:`translate(${dx}px,${dy}px) scale(1.2)`, opacity:0}],
            {duration:560, delay:160 + i*90, easing:"cubic-bezier(.5,0,.2,1)"}).finished.then(() => {
              f.remove();
              if (R.alive(t)) R.anim(target, [{opacity:0, transform:"scale(.85)"},{opacity:1, transform:"none"}], {duration:200});
            }).catch(()=>{});
        });
        await Promise.all(flights); if (!R.alive(t)) return;
        R.anim($(".pill", res), [{background:"var(--green)", boxShadow:"0 0 0 5px rgba(71,215,123,.28)"},{background:"var(--green-soft)", boxShadow:"0 0 0 0 rgba(71,215,123,0)"}], {duration:700, easing:"ease-out"});
        R.enter(note, {duration:200, delay:100});
        await R.trace(t, panel, reply, $(".ck", res));
      }
    },
    {
      out:"Investi 500 reais no Tesouro Selic hoje", tOut:"10:27",
      in:"Aporte registrado! Já está na sua carteira. 📈", tIn:"10:27",
      result:
        '<p class="result-label" data-rv>'+ckSvg+'Aporte registrado</p>'+
        '<p class="result-main" id="d-aporte" data-rv>'+brl(500)+'</p>'+
        '<p class="result-sub" data-rv>Tesouro Selic</p>'+
        '<dl class="facts"><div data-rv><dt>Tipo</dt><dd>Aporte</dd></div><div data-rv><dt>Data</dt><dd>Hoje</dd></div><div data-rv><dt>Consulta</dt><dd>Pelo WhatsApp</dd></div></dl>'+
        '<p class="note" data-rv>Os valores são ilustrativos.</p>',
      play: async (t, R, reply) => {
        const items = $$("#demo-result [data-rv]");
        items.forEach((el, i) => R.enter(el, {duration:240, delay:i*55}));
        R.count(t, $("#d-aporte"), 500, 500);
        await wait(420); if (!R.alive(t)) return;
        await R.trace(t, $("#painel"), reply, $("#demo-result .ck"));
      }
    }
  ];

  const D = new Runner();
  const chat = $("#demo-chat"), res = $("#demo-result"), panel = $("#painel");
  const tabs = $$('[role="tab"]'), tabThumb = $(".tab-thumb");
  function placeTab(instant){
    const b = tabs.find(x => x.getAttribute("aria-selected") === "true");
    if (!b || !tabThumb) return;
    if (instant) tabThumb.style.transition = "none";
    tabThumb.style.width = b.offsetWidth + "px";
    tabThumb.style.height = b.offsetHeight + "px";
    tabThumb.style.transform = "translate(" + b.offsetLeft + "px," + b.offsetTop + "px)";
    if (instant) { tabThumb.offsetWidth; tabThumb.style.transition = ""; }
  }
  window.addEventListener("resize", () => placeTab(true));

  async function show(i, animate){
    const d = demos[i], t = D.start();
    tabs.forEach((tb, j) => { tb.setAttribute("aria-selected", j === i); tb.tabIndex = j === i ? 0 : -1; });
    placeTab(!animate || reduced());
    panel.setAttribute("aria-labelledby", "tab-" + i);
    chat.innerHTML = '<span class="day">Hoje</span>'+
      '<p class="msg out" data-rv>'+d.out+'<span class="t">'+d.tOut+' '+tick+'</span></p>'+
      '<p class="msg in" data-rv>'+d.in+'<span class="t">'+d.tIn+'</span></p>';
    res.innerHTML = d.result;
    if (!animate || reduced()) { panel.classList.remove("armed"); return; }
    panel.classList.add("armed");
    const [out, reply] = $$(".msg", chat);
    D.enter(out, {duration:180});
    D.enter(reply, {duration:200, delay:170});
    await wait(330); if (!D.alive(t)) return;
    d.play(t, D, reply);
  }
  tabs.forEach((tb, i) => {
    tb.addEventListener("click", () => show(i, true));
    tb.addEventListener("keydown", e => {
      let n = null;
      if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") n = 0;
      if (e.key === "End") n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); tabs[n].focus(); show(n, true); }
    });
  });
  show(0, false);
  // O primeiro exemplo já vem aberto; anima uma vez quando o painel aparece
  if ("IntersectionObserver" in window) {
    const io2 = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io2.disconnect(); if (tabs[0].getAttribute("aria-selected") === "true") show(0, true); } }, {threshold:.45});
    io2.observe(panel);
  }

  /* ===== 3. Celular: concluir a tarefa pela conversa ===== */
  const T = new Runner(), tdemo = $("#task-demo"), tbtn = $("#t-btn"), task = $("#task"), hist = $("#t-history");
  const tOut = $("#t-out"), tTyping = $("#t-typing"), tIn = $("#t-in"), tStatus = $("#t-status");
  const RISE = [{opacity:0, transform:"translateY(8px)"},{opacity:1, transform:"none"}];
  // Rola apenas o histórico dentro do aparelho; a página fica onde está
  function toLatest(smooth){
    const top = hist.scrollHeight - hist.clientHeight;
    if (top <= 0) return;
    if (smooth && !reduced() && hist.scrollTo) hist.scrollTo({top, behavior:"smooth"}); else hist.scrollTop = top;
  }
  function setBtn(state){
    tbtn.dataset.state = state;
    tbtn.setAttribute("aria-disabled", state === "running" ? "true" : "false");
    tbtn.classList.toggle("again", state === "done");
    tbtn.textContent = state === "done" ? "Rever exemplo" : "Simular conclusão";
  }
  function setTyping(on){
    tStatus.textContent = on ? "digitando…" : "online";
    tStatus.classList.toggle("typing-now", on);
  }
  function resetTask(){
    T.start(); tdemo.classList.add("armed");
    [tOut, tTyping, tIn].forEach(el => { el.hidden = true; });
    task.classList.remove("done"); setTyping(false);
    $("#task-s").textContent = "Pendente · hoje"; $("#t-line").textContent = "⏳ Tarefa: pagar a conta de luz";
    hist.scrollTop = 0;
    setBtn("idle");
  }
  function finishTask(){
    task.classList.add("done"); $("#task-s").textContent = "Concluída · agora";
    $("#t-line").textContent = "✅ Tarefa: pagar a conta de luz";
    setBtn("done");
  }
  tbtn.addEventListener("click", async () => {
    const st = tbtn.dataset.state;
    if (st === "running") return;                 // cliques repetidos não duplicam mensagens
    if (st === "done") { resetTask(); return; }   // "Rever exemplo"
    const t = T.start(); setBtn("running");
    if (reduced()) {                              // menos movimento: estado final direto
      tOut.hidden = false; tIn.hidden = false; toLatest(false);
      tdemo.classList.remove("armed"); finishTask(); return;
    }
    tOut.hidden = false; T.anim(tOut, RISE, {duration:200}); toLatest(true);
    await wait(320); if (!T.alive(t)) return;
    setTyping(true);
    tTyping.hidden = false; T.anim(tTyping, RISE, {duration:200}); toLatest(true);
    await wait(750); if (!T.alive(t)) return;
    tTyping.hidden = true; setTyping(false);
    tIn.hidden = false; T.anim(tIn, RISE, {duration:200}); toLatest(true);
    await wait(380); if (!T.alive(t)) return;
    await T.trace(t, tdemo, tIn, $("#t-ck"));
    if (T.alive(t)) finishTask();
  });
  setBtn("idle");

  /* ===== Planos: seletor com fundo deslizante ===== */
  const plans = {
    mensal:{val:"39,90", per:"/mês", was:"Cobrança recorrente todo mês", period:"1 mês", total:"R$ 39,90 por mês"},
    semestral:{val:"179,00", per:"/6 meses", was:"Equivale a cerca de R$ 29,83 por mês", period:"6 meses", total:"R$ 179,00 a cada 6 meses"}
  };
  const sw = $$("[data-period]"), thumb = $(".switch .thumb"), block = $("#p-block");
  function placeThumb(instant){
    const b = sw.find(x => x.getAttribute("aria-pressed") === "true");
    if (instant) thumb.style.transition = "none";
    thumb.style.width = b.offsetWidth + "px";
    thumb.style.transform = "translateX(" + (b.offsetLeft) + "px)";
    if (instant) { thumb.offsetWidth; thumb.style.transition = ""; }
  }
  sw.forEach(b => b.addEventListener("click", () => {
    if (b.getAttribute("aria-pressed") === "true") return;
    const p = plans[b.dataset.period];
    sw.forEach(x => x.setAttribute("aria-pressed", x === b));
    placeThumb(false);
    $("#p-val").textContent = p.val; $("#p-per").textContent = p.per; $("#p-was").innerHTML = p.was;
    $("#p-period").textContent = p.period; $("#p-total").textContent = p.total;
    setCheckout(b.dataset.period);
    if (!reduced() && block.animate) block.animate([{opacity:.25, transform:"translateY(4px)"},{opacity:1, transform:"none"}], {duration:240, easing:EASE});
  }));
  // Começa no primeiro período com checkout (Mensal, se houver)
  const first = sw.find(b => !b.hidden) || sw[0];
  if (first.getAttribute("aria-pressed") !== "true") first.click(); else setCheckout(first.dataset.period);
  placeThumb(true);
  window.addEventListener("resize", () => placeThumb(true));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placeThumb(true));

  /* ===== FAQ: abrir e fechar com suavidade ===== */
  $$(".faq details").forEach(d => {
    const s = $("summary", d), a = $(".a", d);
    s.addEventListener("click", e => {
      if (reduced() || !a.animate) return;
      e.preventDefault();
      if (d._an) d._an.cancel();
      if (!d.open) {
        d.open = true;
        const h = a.scrollHeight;
        d._an = a.animate([{height:"0px", opacity:0},{height:h + "px", opacity:1}], {duration:300, easing:"cubic-bezier(.45,0,.55,1)"});
        d._an.onfinish = () => { d._an = null; };
      } else {
        const h = a.offsetHeight;
        d._an = a.animate([{height:h + "px", opacity:1},{height:"0px", opacity:0}], {duration:260, easing:"cubic-bezier(.45,0,.55,1)"});
        d._an.onfinish = () => { d.open = false; d._an = null; };
      }
    });
  });

  /* ===== Site reativo ===== */
  const fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Entrada dos blocos ao rolar
  const groups = [
    ["section:not(.hero) .kicker", ""], ["section:not(.hero) h2", ""], [".sec-lead", ""], [".demo-head .badge", ""],
    [".tabs", ""], [".panel", "scale"], [".feature:not(.rev) .shot", "left"], [".feature.rev .shot", "right"],
    [".feature > div", ""], [".phone-figure", ""], [".more > div", "", 50], [".plan", "scale"], [".faq details", "", 40],
    [".final p", ""], [".final .actions", ""]
  ];
  groups.forEach(([sel, kind, step]) => $$(sel).forEach((el, i) => {
    el.setAttribute("data-reveal", kind || "");
    if (step) el.style.setProperty("--d", (i * step) + "ms");
  }));
  const revealIO = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
  }), {threshold:.12, rootMargin:"0px 0px -6% 0px"}) : null;
  $$("[data-reveal]").forEach(el => revealIO ? revealIO.observe(el) : el.classList.add("in"));

  // Cabeçalho: barra de progresso, modo compacto e seção ativa
  const top = $("#top"), prog = $("#progress");
  let ticking = false;
  let lastY = scrollY, navLock = false;   // navLock: rolagem feita pelos links do próprio site
  function onScroll(){
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
      top.classList.toggle("scrolled", y > 24);
      // Recolhe ao rolar para baixo; volta ao rolar para cima, no topo ou durante a navegação pelos links
      if (navLock || y < 120 || reduced()) { top.classList.remove("hide"); lastY = y; }
      else if (Math.abs(y - lastY) > 6) {
        top.classList.toggle("hide", y > lastY && !top.contains(document.activeElement));
        lastY = y;
      }
      ticking = false;
    });
  }
  addEventListener("scroll", onScroll, {passive:true}); onScroll();
  const navLinks = $$(".nav a");
  if ("IntersectionObserver" in window) {
    const secIO = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    }), {rootMargin:"-45% 0px -50% 0px"});
    ["como-funciona","recursos","planos","duvidas"].forEach(id => secIO.observe(document.getElementById(id)));
    const heroIO = new IntersectionObserver(es => { if (es[0].isIntersecting) navLinks.forEach(a => a.classList.remove("on")); }, {rootMargin:"-45% 0px -50% 0px"});
    heroIO.observe($(".hero"));
  }

  // Navegação interna: rolagem suave até a seção, com o título logo abaixo do cabeçalho fixo.
  // A rolagem para na hora se a pessoa usar a roda do mouse, o trackpad, o toque ou o teclado.
  const SECTIONS = ["inicio","como-funciona","recursos","planos","duvidas"];
  let navAnim = null;
  function stopNav(){
    if (!navAnim) return;
    cancelAnimationFrame(navAnim.raf); navAnim = null; navLock = false;
    document.documentElement.style.scrollBehavior = "";
  }
  ["wheel","touchstart","keydown","mousedown"].forEach(ev => addEventListener(ev, stopNav, {passive:true}));
  function sectionTop(el){
    if (el.id === "inicio") return 0;
    // Usa a altura atual do cabeçalho: ele encolhe ao rolar e puxa a página junto,
    // então a seção termina exatamente na borda de baixo do cabeçalho compacto.
    const header = document.getElementById("top");
    return Math.max(0, Math.round(el.getBoundingClientRect().top + scrollY - (header ? header.offsetHeight : 57)));
  }
  function smoothTo(y){
    stopNav();
    const html = document.documentElement, start = scrollY, dist = y - start;
    html.style.scrollBehavior = "auto";
    if (reduced() || Math.abs(dist) < 2) { scrollTo(0, y); html.style.scrollBehavior = ""; return; }
    const dur = Math.min(900, Math.max(420, Math.abs(dist) * 0.35));
    const ease = p => p < .5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2;
    const t0 = performance.now();
    navLock = true; top.classList.remove("hide");
    const step = now => {
      if (!navAnim) return;
      const p = Math.min(1, (now - t0) / dur);
      scrollTo(0, start + dist * ease(p));
      if (p < 1) navAnim.raf = requestAnimationFrame(step);
      else { navAnim = null; html.style.scrollBehavior = ""; lastY = scrollY; setTimeout(() => { navLock = false; }, 80); }
    };
    navAnim = {raf: requestAnimationFrame(step)};
  }
  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (!SECTIONS.includes(id)) return;
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    smoothTo(sectionTop(el));
    // Salto instantâneo (movimento reduzido): o cabeçalho encolhe logo depois; reajusta no quadro seguinte
    if (reduced()) requestAnimationFrame(() => requestAnimationFrame(() => {
      const html = document.documentElement; html.style.scrollBehavior = "auto";
      scrollTo(0, sectionTop(el)); html.style.scrollBehavior = "";
    }));
    try { history.pushState(null, "", "#" + id); } catch(err){}
    if (el.matches("section")) el.focus({preventScroll:true});
  });

  // Reações ao ponteiro (apenas mouse/trackpad e sem movimento reduzido)
  if (fine && !reduced()) {
    const heroEl = $(".hero");
    heroEl.addEventListener("pointermove", e => {
      const r = heroEl.getBoundingClientRect();
      heroEl.style.setProperty("--mx", (e.clientX - r.left) + "px");
      heroEl.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
    $$(".btn").forEach(b => {
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--tx", ((e.clientX - r.left - r.width/2) * .12).toFixed(1) + "px");
        b.style.setProperty("--ty", ((e.clientY - r.top - r.height/2) * .25).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", () => { b.style.removeProperty("--tx"); b.style.removeProperty("--ty"); });
    });
    $$(".tilt").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
        el.classList.add("moving");
        el.style.setProperty("--ry", (x * 4).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-y * 3).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", () => { el.classList.remove("moving"); el.style.removeProperty("--rx"); el.style.removeProperty("--ry"); });
    });
    $$(".spot, .more > div").forEach(el => {
      el.classList.add("spot");
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sx", (e.clientX - r.left) + "px");
        el.style.setProperty("--sy", (e.clientY - r.top) + "px");
      });
    });
  }
})();
