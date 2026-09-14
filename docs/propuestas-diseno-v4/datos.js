/* Contenido de `src/lib/data/ejemplos.ts` y la fórmula de `src/lib/formato.ts:108`.
   Piezas compartidas por las cinco pantallas. */

const PERFIL = {
  nombre:"Mateo", apellido:"Silveira", usuario:"mateo_silveira", pais:"Uruguay",
  bio:"Estudio Ingeniería en Computación y trabajo en proyectos propios de front-end con React y TypeScript. Busco mi primera experiencia laboral en un equipo donde pueda aprender de gente con más recorrido.",
  tags:["Desarrollo web","Diseño de interfaces","Primera experiencia"],
  habilidades:["React","TypeScript","JavaScript","HTML y CSS","Git","SQL","Inglés B2","Trabajo en equipo","Comunicación"],
  formaciones:[
    {titulo:"Ingeniería en Computación",institucion:"Universidad de la República",estado:"en_curso"},
    {titulo:"Desarrollo web front-end",institucion:"Plan Ceibal — Jóvenes a Programar",estado:"finalizado"},
    {titulo:"B2 First (FCE)",institucion:"Instituto Anglo Uruguayo",estado:"finalizado"},
  ],
};

const VACANTES = [
  {titulo:"Desarrollador Frontend Junior",empresa:"Mercado Libre",rubro:"Comercio electrónico",
   tipo:"empleo",posiciones:2,publicada:"hace 3 horas",
   resumen:"Sumate al equipo de design system: vas a construir componentes reutilizables en React y TypeScript, con acompañamiento de un referente técnico durante los primeros seis meses. No pedimos experiencia previa en la industria.",
   habilidades:["React","TypeScript","HTML y CSS","Git"],tags:["Desarrollo web","Diseño de interfaces"]},
  {titulo:"Pasantía en Ingeniería de Interfaces",empresa:"PedidosYa",rubro:"Tecnología y logística",
   tipo:"pasantia",posiciones:3,publicada:"hace 9 horas",
   resumen:"Pasantía rentada de seis meses en el equipo de checkout. Vas a trabajar sobre la interfaz que usan miles de personas por día, con revisión de código y mentoría semanal.",
   habilidades:["React","JavaScript","HTML y CSS"],tags:["Desarrollo web","Primera experiencia"]},
  {titulo:"Analista de Datos Junior",empresa:"dLocal",rubro:"Fintech",
   tipo:"empleo",posiciones:1,publicada:"hace 1 día",
   resumen:"Buscamos una persona curiosa para el equipo de reportes de negocio: vas a escribir consultas SQL, mantener tableros y presentar hallazgos al equipo comercial.",
   habilidades:["SQL","Planillas de cálculo","Inglés B2"],tags:["Datos","Negocios"]},
  {titulo:"Pasantía en Atención al Cliente",empresa:"Mercado Libre",rubro:"Comercio electrónico",
   tipo:"pasantia",posiciones:5,publicada:"hace 2 días",
   resumen:"Primera experiencia laboral en el equipo de posventa. Formación paga las primeras cuatro semanas y horario compatible con estudio.",
   habilidades:["Comunicación","Trabajo en equipo"],tags:["Atención al cliente","Primera experiencia"]},
];

const EVENTOS = [
  {dia:"23",mes:"setiembre",hora:"18:30",empresa:"PedidosYa",
   titulo:"Taller: cómo preparar tu primera entrevista técnica",
   resumen:"Taller práctico de dos horas con personas que entrevistan a diario. Se trabaja sobre casos reales y se sale con una devolución individual.",
   tags:["Primera experiencia","Desarrollo web"]},
  {dia:"04",mes:"octubre",hora:"14:00",empresa:"Universidad de la República",
   titulo:"Feria de Primer Empleo Tecnológico",
   resumen:"Jornada de vinculación con empresas de tecnología: charlas cortas, rondas de entrevistas breves y espacio de consultas sobre pasantías.",
   tags:["Primera experiencia","Networking"]},
  {dia:"15",mes:"octubre",hora:"19:00",empresa:"dLocal",
   titulo:"Charla abierta: primeros pasos en análisis de datos",
   resumen:"Recorrido por el trabajo cotidiano de un equipo de datos, las herramientas que se usan y cómo es el proceso de selección para perfiles junior.",
   tags:["Datos","Networking"]},
];

const POSTULACIONES = [
  {titulo:"Pasantía en Ingeniería de Interfaces",empresa:"PedidosYa",enviada:"hace 1 día",estado:"en_revision"},
  {titulo:"Desarrollador Frontend Junior",empresa:"Mercado Libre",enviada:"hace 4 días",estado:"pendiente"},
  {titulo:"Analista de Datos Junior",empresa:"dLocal",enviada:"hace 2 semanas",estado:"rechazada"},
];

const DECLARADAS = new Set([...PERFIL.tags, ...PERFIL.habilidades].map(s=>s.toLowerCase()));
const tengo = r => DECLARADAS.has(r.toLowerCase());
const requisitos = v => [...v.habilidades, ...v.tags];
const afinidad = v => { const r = requisitos(v);
  return r.length ? Math.round(100*r.filter(tengo).length/r.length) : 0; };
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* El glifo: una celda por requisito, en dos filas. Misma forma que la marca. */
function glifo(req, anima){
  return `<span class="glifo${anima?" anima":""}" role="img"
    aria-label="${req.filter(tengo).length} de ${req.length} requisitos cubiertos">${
    req.map((r,i)=>`<i class="${tengo(r)?"llena":""}"${anima?` style="animation-delay:${i*40}ms"`:""}></i>`).join("")
  }</span>`;
}
/* La marca es el mismo glifo, con un patrón fijo de seis celdas. */
const MARCA_GLIFO = `<span class="glifo" aria-hidden="true">${
  [1,1,0,1,0,1].map(f=>`<i class="${f?"llena":""}"></i>`).join("")}</span>`;

const SECCIONES = [
  {href:"inicio.html",etiqueta:"Inicio",icono:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-5.5h5V20"/>'},
  {href:"empleos.html",etiqueta:"Empleos",icono:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M3 12h18"/>'},
  {href:"eventos.html",etiqueta:"Eventos",icono:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'},
  {href:"postulaciones.html",etiqueta:"Postulaciones",icono:'<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8h5"/><path d="M9 13.5l2 2 4-4"/>'},
  {href:"perfil.html",etiqueta:"Mi perfil",icono:'<circle cx="12" cy="8.5" r="3.75"/><path d="M4.75 20a7.25 7.25 0 0 1 14.5 0"/>'},
];
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

function barraLateral(actual){
  return `<nav class="nav" aria-label="Secciones de LinkYouth">
    <div class="nav-cabeza">
      <a class="marca" href="inicio.html">${MARCA_GLIFO}<span class="marca-nombre">LinkYouth</span></a>
      <form class="salir" onsubmit="return false"><button type="submit">Cerrar sesión</button></form>
    </div>
    <ul class="nav-lista">${SECCIONES.map(s=>`<li>
      <a href="${s.href}"${s.href===actual?' aria-current="page"':""}>${svg(s.icono)}${s.etiqueta}</a>
    </li>`).join("")}</ul>
  </nav>`;
}

function aviso(){
  return `<div class="aviso"><p><b>Contenido de demostración.</b> La base respondió, pero todavía
    no tiene datos cargados. Cargá las credenciales en <code>.env.local</code> y aplicá
    <code>db/schema.sql</code> y <code>db/politicas.sql</code> para ver datos reales.</p></div>`;
}

function tarjetaVacante(v, i){
  const req = requisitos(v), pct = afinidad(v), cubiertos = req.filter(tengo).length;
  const chips = l => l.map(t=>`<li class="chip${tengo(t)?"":" falta"}">${esc(t)}</li>`).join("");
  return `<article class="vacante">
    <div class="canaleta">
      <p class="puntaje">${pct}<small>%</small></p>
      ${glifo(req, true)}
      <p class="cuantos">${cubiertos} de ${req.length} requisitos</p>
    </div>
    <div class="vacante-texto">
      <p class="donde"><b>${esc(v.empresa)}</b>, ${esc(v.rubro)}. Publicado ${esc(v.publicada)}.</p>
      <h2>${esc(v.titulo)}</h2>
      <p class="resumen">${esc(v.resumen)}</p>
      <div class="bloque">
        <p class="rotulo">Habilidades que piden</p>
        <ul class="chips">${chips(v.habilidades)}</ul>
      </div>
      <div class="bloque">
        <p class="rotulo">Áreas de interés</p>
        <ul class="chips">${chips(v.tags)}</ul>
      </div>
    </div>
    <div class="vacante-pie">
      <div class="pie-izq">
        <span class="insignia${v.tipo==="pasantia"?" acento":""}">${v.tipo==="pasantia"?"Pasantía":"Empleo"}</span>
        <span class="meta">${v.posiciones===1?"1 posición":v.posiciones+" posiciones"}</span>
      </div>
      <button class="boton" type="button" disabled>Disponible cuando haya vacantes reales</button>
    </div>
  </article>`;
}

function filaEvento(e){
  return `<article class="evento">
    <div class="cuando">
      <span class="dia">${e.dia}</span>
      <span class="mes">${esc(e.mes)}</span>
      <span class="hora">${e.hora}</span>
    </div>
    <div class="evento-texto">
      <p class="donde"><b>${esc(e.empresa)}</b></p>
      <h2>${esc(e.titulo)}</h2>
      <p class="resumen">${esc(e.resumen)}</p>
      <ul class="chips" style="margin-top:12px">${e.tags.map(t=>
        `<li class="chip${tengo(t)?"":" falta"}">${esc(t)}</li>`).join("")}</ul>
      <div class="evento-pie">
        <span class="meta">Inscripción gratuita</span>
        <button class="boton secundario" type="button" disabled>Disponible cuando haya eventos reales</button>
      </div>
    </div>
  </article>`;
}

const ETIQUETA_ESTADO = {pendiente:"Enviada",en_revision:"En revisión",
  aceptada:"Aceptada",rechazada:"No seleccionada",cancelada:"Cancelada por vos"};

function ficha(){
  const enCurso = PERFIL.formaciones.find(f=>f.estado==="en_curso");
  const activas = POSTULACIONES.filter(p=>["pendiente","en_revision"].includes(p.estado));
  const iniciales = (PERFIL.nombre[0] + PERFIL.apellido[0]).toUpperCase();

  return `<div class="ficha">
    <div class="ficha-quien">
      <span class="retrato chico" aria-hidden="true">${iniciales}</span>
      <div style="min-width:0">
        <h2>${PERFIL.nombre} ${PERFIL.apellido}</h2>
        <p class="usuario">@${PERFIL.usuario}</p>
      </div>
    </div>
    ${enCurso?`<p class="estudia">${esc(enCurso.titulo)}, en ${esc(enCurso.institucion)}</p>`:""}

    <section class="bloque-lateral">
      <h3>Lo que tenés cargado</h3>
      <ul class="datos-fila">
        <li><span>Habilidades</span><b>${PERFIL.habilidades.length}</b></li>
        <li><span>Áreas de interés</span><b>${PERFIL.tags.length}</b></li>
        <li><span>Estudios</span><b>${PERFIL.formaciones.length}</b></li>
      </ul>
      <p class="pista">Cada cosa que cargues entra en el cálculo de compatibilidad
        de todas las vacantes.</p>
    </section>

    <section class="bloque-lateral">
      <h3>${activas.length===1?"Postulación activa":"Postulaciones activas"}</h3>
      ${activas.length?`<ul class="post-mini">${activas.map(p=>`<li>
        <p class="estado">${ETIQUETA_ESTADO[p.estado]}</p>
        <p class="puesto">${esc(p.titulo)}</p>
        <p class="emp">${esc(p.empresa)}, enviada ${esc(p.enviada)}</p>
      </li>`).join("")}</ul>`
      :`<p class="pista" style="margin-top:8px">Todavía no tenés ninguna en curso.</p>`}
    </section>

    <a class="boton secundario" href="perfil.html">Ver mi perfil</a>
  </div>`;
}

function vacio(titulo, texto, enlace){
  return `<div class="vacio"><h2>${esc(titulo)}</h2><p>${esc(texto)}</p>
    ${enlace?`<a href="${enlace.href}">${esc(enlace.texto)}</a>`:""}</div>`;
}

function montar(actual){ document.getElementById("barra").innerHTML = barraLateral(actual); }
