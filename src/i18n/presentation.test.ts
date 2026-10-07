import { beforeAll, expect, it, vi } from "vitest";
import { COMUNITARIOS, CURSOS, EQUIPOS, LOGOS_DISPONIBLES, PERSONAL_INFO, PROPIEDADES, TITULOS, RASGOS, DIVISIONES } from "../game/data";
import type { CursoId, GearId, PersonalId, PropiedadId, ResultadoPelea, TipoComunitario } from "../game/types";
import { registrarCatalogo, translate } from "./catalog";
import * as presentation from "./presentation";
import { crearEstadoBase, generarOfertas } from "../game/engine";
import { weeklyEconomy } from "../game/economy";
import { nombreDia, nombreMes, presentarActividad, presentarCurso, presentarEmblema, presentarEquipo, presentarPersonal, presentarPropiedad } from "./presentation";
beforeAll(async () => {
  const { readFileSync } = await vi.importActual<{ readFileSync: (url: URL, encoding: string) => string }>("node:fs");
  for (const locale of ["en", "pt-BR"] as const) registrarCatalogo(locale, JSON.parse(readFileSync(new URL(`../../public/i18n/${locale}.json`, import.meta.url), "utf8")));
});
it.each(["es", "en", "pt-BR"] as const)("%s no promete un ingreso fijo de sucursal que el motor no paga", locale => {
  const state=crearEstadoBase({sinPoblacion:true});
  state.semana=2;state.fama=0;state.propiedades=["sucursal"];
  state.personal=[{id:"manager",nombre:"Histórico",tipo:"gerente"}];
  const income=weeklyEconomy(state,{nivel:1,multiplicadorMarca:1}).ingresos;
  expect(income.find(l=>l.concepto==="Ingresos pasivos de sucursales (1)")?.monto).toBe(650);
  const benefit=presentarPropiedad("sucursal",locale).beneficio;
  expect(benefit).not.toContain("800");
  expect(benefit).toContain("10");
});
it.each(["es", "en", "pt-BR"] as const)("%s presenta ofertas con identidad y plantilla fiables, conservando desconocidos y sin consumir RNG",locale=>{
  const boxer=crearEstadoBase().plantel[0];
  const offers=generarOfertas(boxer);
  const before=JSON.stringify(offers);
  const random=vi.spyOn(Math,"random");
  for(const offer of offers) {
    const copy=presentation.presentarOferta(offer,locale);
    expect(copy.historico).toBe(false);
    if(locale==="es")expect(copy).toEqual({etiqueta:offer.etiqueta,detalle:offer.detalle,historico:false});
    else expect(copy.etiqueta).not.toBe(offer.etiqueta);
    const unknown={...offer,detalle:"Historia desconocida {name} 🥊",etiqueta:"Nombre histórico desconocido"};
    expect(presentation.presentarOferta(unknown,locale)).toEqual({etiqueta:unknown.etiqueta,detalle:unknown.detalle,historico:true});
  }
  expect(JSON.stringify(offers)).toBe(before);
  expect(random).not.toHaveBeenCalled();
  random.mockRestore();
});
it.each(["es", "en", "pt-BR"] as const)("%s presenta el resultado recién emitido sin modificar pago, decisiones, estadísticas ni texto persistido", locale => {
  for(const metodo of ["Nocaut","Nocaut Técnico","Empate","Decisión Unánime","Decisión Mayoritaria","Decisión Dividida"] as const) {
    const ko=metodo.startsWith("Nocaut");
    const tarjetas=[{a:30,b:27},{a:29,b:28},{a:28,b:29}];
    const resumen=ko ? `${metodo} en el asalto 3` : `${metodo} (30-27, 29-28, 28-29)`;
    const punches={jab:{lanzados:0,conectados:0},poder:{lanzados:0,conectados:0}};
    const result:ResultadoPelea={miId:"fixture",rivalNombre:"Nombre {histórico} 🥊",gane:true,empate:false,metodo,tarjetas,caidasA:0,caidasB:0,registroA:punches,registroB:punches,bolsa:0,fama:0,tituloGanado:0,resumen};
    const before=JSON.stringify(result);
    const copy=presentation.presentarResultadoActual(result,3,ko,locale);
    if(locale==="es") expect(copy).toEqual({method:metodo,summary:resumen});
    else expect(copy.method).toBe(translate(locale,({Nocaut:"method.ko","Nocaut Técnico":"method.tko",Empate:"method.draw","Decisión Unánime":"method.unanimous","Decisión Mayoritaria":"method.majority","Decisión Dividida":"method.split"} as const)[metodo]));
    expect(copy.summary).toContain(ko ? "3" : "30-27, 29-28, 28-29");
    expect(JSON.stringify(result)).toBe(before);
  }
});
it.each(["es", "en", "pt-BR"] as const)("%s conserva requisitos deportivos, premios e identidades al presentar títulos/rasgos/divisiones", locale => {
  const before=JSON.stringify({TITULOS,RASGOS,DIVISIONES});
  const numbers=(s:string)=>s.match(/\d+/g)??[];
  for(const level of [1,2,3,4] as const) {
    const title=presentation.presentarTitulo(level,locale);
    expect(title.bolsa).toBe(TITULOS[level].bolsa);
    expect(title.colores).toEqual(TITULOS[level].colores);
    expect(numbers(title.req)).toEqual(numbers(TITULOS[level].req));
    if(locale==="es") expect(title).toEqual(TITULOS[level]);
  }
  for(const trait of RASGOS) {
    const copy=presentation.presentarRasgo(trait.id,locale)!;
    expect(copy.id).toBe(trait.id);expect(copy.nombre).toBe(translate(locale,`trait.${trait.id}.name` as "trait.mandibula.name"));
    if(locale==="es")expect(copy).toEqual(trait);
  }
  if(locale==="es")for(const division of DIVISIONES)expect(presentation.presentarDivision(division,locale)).toBe(division);
  expect(presentation.presentarDivision("Categoría histórica desconocida 🥊",locale)).toBe("Categoría histórica desconocida 🥊");
  expect(presentation.presentarRasgo("id-desconocido",locale)).toBeUndefined();
  expect(JSON.stringify({TITULOS,RASGOS,DIVISIONES})).toBe(before);
});
it("Legado visible coincide con los cinturones históricos del motor, no con títulos actuales del plantel", () => {
  const state=crearEstadoBase({sinPoblacion:true});
  state.fama=0;
  expect(presentation.legadoDisponible(state)).toBe(false);
  state.cinturones=[{id:"transferido",dueno:"Campeón que salió del club",nivel:4,semana:1}];
  expect(presentation.legadoDisponible(state)).toBe(true);
  state.cinturones=[];state.fama=84;
  expect(presentation.legadoDisponible(state)).toBe(false);
  state.fama=85;
  expect(presentation.legadoDisponible(state)).toBe(true);
});
it("la presentación española conserva exactamente todos los datos canónicos, sin duplicarlos ni normalizarlos", () => {
  for (const id of Object.keys(EQUIPOS) as GearId[]) expect(presentarEquipo(id, "es")).toEqual(EQUIPOS[id]);
  for (const id of Object.keys(CURSOS) as CursoId[]) expect(presentarCurso(id, "es")).toEqual(CURSOS[id]);
  for (const id of Object.keys(PERSONAL_INFO) as PersonalId[]) expect(presentarPersonal(id, "es")).toEqual(PERSONAL_INFO[id]);
  for (const id of Object.keys(PROPIEDADES) as PropiedadId[]) expect(presentarPropiedad(id, "es")).toEqual(PROPIEDADES[id]);
  for (const id of Object.keys(COMUNITARIOS) as TipoComunitario[]) expect(presentarActividad(id, "es")).toEqual(COMUNITARIOS[id]);
  for (const logo of LOGOS_DISPONIBLES) expect(presentarEmblema(logo, "es")).toEqual({ nombre: logo.nombre, lema: logo.lema });
  expect(nombreDia(0,"es")).toBe("Lunes"); expect(nombreDia(6,"es")).toBe("Domingo");
  expect(nombreMes(0,"es")).toBe("Enero"); expect(nombreMes(11,"es")).toBe("Diciembre");
});
it.each(["en", "pt-BR"] as const)("%s traduce contenido sin modificar IDs, reglas, precios, promesas numéricas ni objetos del motor", locale => {
  const original=JSON.stringify({EQUIPOS,CURSOS,PERSONAL_INFO,PROPIEDADES,COMUNITARIOS});
  const numbers=(s:string)=>s.replace(/(\d),(\d)/g,"$1.$2").replace(/−/g,"-").match(/-?\d+(?:\.\d+)?/g)??[];
  for(const id of Object.keys(EQUIPOS) as GearId[]) {
    const {nombre,desc,efecto,...domain}=presentarEquipo(id,locale);
    const {nombre:_,desc:__,efecto:originalEffect,...expected}=EQUIPOS[id];
    expect(domain).toEqual(expected); expect(nombre).toBe(translate(locale, `gear.${id}.name`));
    expect(numbers(efecto)).toEqual(numbers(originalEffect));
    expect(desc.trim()).not.toBe("");
  }
  for(const id of Object.keys(CURSOS) as CursoId[]) { const p=presentarCurso(id,locale);expect(p.costo).toBe(CURSOS[id].costo);expect(p.req).toBe(CURSOS[id].req);expect(numbers(p.desc)).toEqual(numbers(CURSOS[id].desc)); }
  for(const id of Object.keys(PERSONAL_INFO) as PersonalId[]) expect(presentarPersonal(id,locale).sueldo).toBe(PERSONAL_INFO[id].sueldo);
  for(const id of Object.keys(PROPIEDADES) as PropiedadId[]) expect(numbers(presentarPropiedad(id,locale).beneficio)).toEqual(numbers(PROPIEDADES[id].beneficio!));
  for(const id of Object.keys(COMUNITARIOS) as TipoComunitario[]) {const p=presentarActividad(id,locale);expect([p.inversion,p.min,p.max]).toEqual([COMUNITARIOS[id].inversion,COMUNITARIOS[id].min,COMUNITARIOS[id].max]);}
  expect(JSON.stringify({EQUIPOS,CURSOS,PERSONAL_INFO,PROPIEDADES,COMUNITARIOS})).toBe(original);
});
