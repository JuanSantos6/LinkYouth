/* Datos de demostración y piezas compartidas entre las cinco pantallas.
   El contenido es el mismo de `src/lib/data/ejemplos.ts` y la fórmula de
   compatibilidad es la misma de `src/lib/formato.ts:108`. */

const PERFIL = {
  nombre: "Mateo", apellido: "Silveira", usuario: "mateo_silveira", pais: "Uruguay",
  bio: "Estudio Ingeniería en Computación y trabajo en proyectos propios de front-end con React y TypeScript. Busco mi primera experiencia laboral en un equipo donde pueda aprender de gente con más recorrido.",
  tags: ["Desarrollo web", "Diseño de interfaces", "Primera experiencia"],
  habilidades: ["React","TypeScript","JavaScript","HTML y CSS","Git","SQL","Inglés B2","Trabajo en equipo","Comunicación"],
  formaciones: [
    {titulo:"Ingeniería en Computación", institucion:"Universidad de la República", estado:"en_curso"},
    {titulo:"Desarrollo web front-end", institucion:"Plan Ceibal — Jóvenes a Programar", estado:"finalizado"},
    {titulo:"B2 First (FCE)", institucion:"Instituto Anglo Uruguayo", estado:"finalizado"},
  ],
};

const VACANTES = [
  {id:"v1",titulo:"Desarrollador Frontend Junior",empresa:"Mercado Libre",rubro:"Comercio electrónico",
   tipo:"empleo",posiciones:2,publicada:"hace 3 horas",
   descripcion:"Sumate al equipo de design system: vas a construir componentes reutilizables en React y TypeScript, con acompañamiento de un referente técnico durante los primeros seis meses. No pedimos experiencia previa en la industria.",
   habilidades:["React","TypeScript","HTML y CSS","Git"],tags:["Desarrollo web","Diseño de interfaces"]},
  {id:"v2",titulo:"Pasantía en Ingeniería de Interfaces",empresa:"PedidosYa",rubro:"Tecnología y logística",
   tipo:"pasantia",posiciones:3,publicada:"hace 9 horas",
   descripcion:"Pasantía rentada de seis meses en el equipo de checkout. Vas a trabajar sobre la interfaz que usan miles de personas por día, con revisión de código y mentoría semanal.",
   habilidades:["React","JavaScript","HTML y CSS"],tags:["Desarrollo web","Primera experiencia"]},
  {id:"v3",titulo:"Analista de Datos Junior",empresa:"dLocal",rubro:"Fintech",
   tipo:"empleo",posiciones:1,publicada:"hace 1 día",
   descripcion:"Buscamos una persona curiosa para el equipo de reportes de negocio: vas a escribir consultas SQL, mantener tableros y presentar hallazgos al equipo comercial.",
   habilidades:["SQL","Planillas de cálculo","Inglés B2"],tags:["Datos","Negocios"]},
  {id:"v4",titulo:"Pasantía en Atención al Cliente",empresa:"Mercado Libre",rubro:"Comercio electrónico",
   tipo:"pasantia",posiciones:5,publicada:"hace 2 días",
   descripcion:"Primera experiencia laboral en el equipo de posventa. Formación paga las primeras cuatro semanas y horario compatible con estudio.",
   habilidades:["Comunicación","Trabajo en equipo"],tags:["Atención al cliente","Primera experiencia"]},
];

const EVENTOS = [
  {dia:"23",mes:"SET",cuando:"martes 23 de setiembre, 18:30",empresa:"PedidosYa",
   titulo:"Taller: cómo preparar tu primera entrevista técnica",
   descripcion:"Taller práctico de dos horas con personas que entrevistan a diario. Se trabaja sobre casos reales y se sale con una devolución individual.",
   tags:["Primera experiencia","Desarrollo web"]},
  {dia:"04",mes:"OCT",cuando:"sábado 4 de octubre, 14:00",empresa:"Universidad de la República",
   titulo:"Feria de Primer Empleo Tecnológico",
   descripcion:"Jornada de vinculación con empresas de tecnología: charlas cortas, rondas de entrevistas breves y espacio de consultas sobre pasantías.",
   tags:["Primera experiencia","Networking"]},
  {dia:"15",mes:"OCT",cuando:"miércoles 15 de octubre, 19:00",empresa:"dLocal",
   titulo:"Charla abierta: primeros pasos en análisis de datos",
   descripcion:"Recorrido por el trabajo cotidiano de un equipo de datos, las herramientas que se usan y cómo es el proceso de selección para perfiles junior.",
   tags:["Datos","Networking"]},
];

const POSTULACIONES = [
  {titulo:"Pasantía en Ingeniería de Interfaces",empresa:"PedidosYa",enviada:"hace 1 día",estado:"en_revision"},
  {titulo:"Desarrollador Frontend Junior",empresa:"Mercado Libre",enviada:"hace 4 días",estado:"pendiente"},
  {titulo:"Analista de Datos Junior",empresa:"dLocal",enviada:"hace 2 semanas",estado:"rechazada"},
];

/* ---- compatibilidad: misma fórmula que `afinidad()` en la aplicación ---- */
const DECLARADAS = new Set([...PERFIL.tags, ...PERFIL.habilidades].map(s => s.toLowerCase()));
const tengo = r => DECLARADAS.has(r.toLowerCase());
const requisitos = v => [...v.habilidades, ...v.tags];
const afinidad = v => {
  const req = requisitos(v);
  return req.length ? Math.round(100 * req.filter(tengo).length / req.length) : 0;
};
const nivel = pct => pct >= 70 ? "alta" : pct >= 40 ? "media" : "";

const iniciales = nombre => nombre.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase();
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---- navegación: la misma de `BarraLateral.tsx`, con enlaces que andan ---- */
const SECCIONES = [
  {href:"inicio.html", etiqueta:"Inicio", icono:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-5.5h5V20"/>'},
  {href:"empleos.html", etiqueta:"Empleos", icono:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M3 12h18"/>'},
  {href:"eventos.html", etiqueta:"Eventos", icono:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'},
  {href:"postulaciones.html", etiqueta:"Postulaciones", icono:'<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8h5"/><path d="M9 13.5l2 2 4-4"/>'},
  {href:"perfil.html", etiqueta:"Mi perfil", icono:'<circle cx="12" cy="8.5" r="3.75"/><path d="M4.75 20a7.25 7.25 0 0 1 14.5 0"/>'},
];

const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

function barraLateral(actual){
  return `<nav class="nav" aria-label="Secciones de LinkYouth">
    <div class="nav-cabeza">
      <a class="marca" href="inicio.html">
        <span class="marca-cuadro" aria-hidden="true">LY</span>
        <span class="marca-nombre">LinkYouth</span>
      </a>
      <form class="salir" onsubmit="return false"><button type="submit">Cerrar sesión</button></form>
    </div>
    <ul class="nav-lista">${SECCIONES.map(s=>`<li>
      <a href="${s.href}"${s.href===actual?' aria-current="page"':""}>${svg(s.icono)}${s.etiqueta}</a>
    </li>`).join("")}</ul>
  </nav>`;
}

function avisoDemo(){
  return `<div class="aviso">
    <span class="aviso-icono" aria-hidden="true">i</span>
    <p><b>Contenido de demostración.</b> La base respondió, pero todavía no tiene datos cargados.
    Cargá las credenciales en <code>.env.local</code> y aplicá <code>db/schema.sql</code> y
    <code>db/politicas.sql</code> para ver datos reales.</p>
  </div>`;
}

/* ---- NIVEL 1: la vacante, con el puntaje como pieza principal ---- */
function tarjetaVacante(v){
  const pct = afinidad(v);
  const req = requisitos(v);
  const cubiertos = req.filter(tengo).length;
  const chips = lista => lista.map(t =>
    `<li class="chip${tengo(t)?" propia":""}">${esc(t)}</li>`).join("");

  return `<article class="vacante ${nivel(pct)}">
    <div class="vacante-cuerpo">
      <div class="puntaje">
        <div>
          <p class="puntaje-cifra">${pct}<span style="font-size:18px">%</span></p>
          <p class="puntaje-palabra">compatible</p>
        </div>
        <div>
          <div class="puntaje-barra" role="img"
               aria-label="${cubiertos} de ${req.length} requisitos cubiertos">
            ${req.map(r=>`<span class="${tengo(r)?"ok":""}"></span>`).join("")}
          </div>
          <p class="puntaje-detalle">${cubiertos} de ${req.length} requisitos</p>
        </div>
      </div>

      <div class="vacante-texto">
        <p class="vacante-empresa">
          <span class="avatar cuadrado sm" aria-hidden="true">${iniciales(v.empresa)}</span>
          <span><strong>${esc(v.empresa)}</strong>, ${esc(v.rubro)}. Publicado ${esc(v.publicada)}.</span>
        </p>
        <h2>${esc(v.titulo)}</h2>
        <p class="vacante-desc">${esc(v.descripcion)}</p>

        <div class="grupo">
          <p class="rotulo">Habilidades que piden</p>
          <ul class="chips">${chips(v.habilidades)}</ul>
        </div>
        <div class="grupo">
          <p class="rotulo">Áreas de interés</p>
          <ul class="chips">${chips(v.tags)}</ul>
        </div>
      </div>
    </div>

    <div class="vacante-pie">
      <div class="izq">
        <span class="insignia${v.tipo==="pasantia"?" primario":""}">${v.tipo==="pasantia"?"Pasantía":"Empleo"}</span>
        <span class="meta">${v.posiciones===1?"1 posición":v.posiciones+" posiciones"}</span>
      </div>
      <button class="boton" type="button" disabled>Disponible cuando haya vacantes reales</button>
    </div>
  </article>`;
}

/* ---- NIVEL 2: el evento, sin franja de degradado ---- */
function tarjetaEvento(e){
  return `<article class="evento">
    <div class="fecha-bloque" aria-hidden="true">
      <span class="fecha-dia">${e.dia}</span>
      <span class="fecha-mes">${e.mes}</span>
    </div>
    <div class="evento-texto">
      <p class="evento-org">${esc(e.empresa)}</p>
      <h2>${esc(e.titulo)}</h2>
      <p class="evento-desc">${esc(e.descripcion)}</p>
      <p class="evento-cuando"><time>${esc(e.cuando)}</time></p>
      <ul class="chips" style="margin-top:10px">${e.tags.map(t=>
        `<li class="chip${tengo(t)?" propia":""}">${esc(t)}</li>`).join("")}</ul>
      <div class="evento-pie">
        <span class="meta">Inscripción gratuita</span>
        <button class="boton secundario" type="button" disabled>Disponible cuando haya eventos reales</button>
      </div>
    </div>
  </article>`;
}

function fichaUsuario(){
  const enCurso = PERFIL.formaciones.find(f => f.estado === "en_curso");
  return `<div class="ficha">
    <div class="ficha-quien">
      <span class="avatar redondo md" aria-hidden="true">${iniciales(PERFIL.nombre+" "+PERFIL.apellido)}</span>
      <div>
        <h2>${PERFIL.nombre} ${PERFIL.apellido}</h2>
        <p>@${PERFIL.usuario}</p>
      </div>
    </div>
    ${enCurso ? `<p class="ficha-estudia">${esc(enCurso.titulo)}, en ${esc(enCurso.institucion)}</p>` : ""}
    <p class="ficha-donde">${svg('<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>')}${PERFIL.pais}</p>

    <div class="metricas">
      <p class="metrica-principal"><b>${POSTULACIONES.length}</b><span>postulaciones en curso</span></p>
      <p class="metrica-resto">${PERFIL.habilidades.length} habilidades declaradas y ${PERFIL.formaciones.length} estudios cargados.</p>
    </div>

    <div class="grupo">
      <p class="rotulo">Tus habilidades principales</p>
      <ul class="chips">${PERFIL.habilidades.slice(0,5).map(h=>`<li class="chip">${esc(h)}</li>`).join("")}</ul>
    </div>

    <a class="boton secundario" href="perfil.html">Ver mi perfil</a>
  </div>`;
}

function estadoVacio(titulo, texto, enlace){
  return `<div class="vacio">
    <h3>${esc(titulo)}</h3>
    <p>${esc(texto)}</p>
    ${enlace ? `<a href="${enlace.href}">${esc(enlace.texto)}</a>` : ""}
  </div>`;
}

function montar(actual){
  document.getElementById("barra").innerHTML = barraLateral(actual);
}
