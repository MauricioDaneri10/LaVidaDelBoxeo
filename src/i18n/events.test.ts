import { beforeAll, expect, it, vi } from "vitest";
import { generarEventos, crearEstadoBase } from "../game/engine";
import { usarSemilla, conFuenteAzar } from "../game/random";
import { registrarCatalogo } from "./catalog";
import * as presentation from "./events";
import { contenidoPatrocinio } from "../game/eventContent";
import { fmt } from "../game/engine";
beforeAll(async()=>{
  const {readFileSync}=await vi.importActual<{readFileSync:(url:URL,encoding:string)=>string}>("node:fs");
  for(const locale of ["en","pt-BR"] as const) registrarCatalogo(locale,JSON.parse(readFileSync(new URL(`../../public/i18n/${locale}.json`,import.meta.url),"utf8")));
});
it.each(["es","en","pt-BR"] as const)("%s conserva nombres con parámetros aparentes y metadata desconocida literalmente",locale=>{
  const name="Sponsor {weekly} {name} $& 🥊";
  const event={...contenidoPatrocinio(name,0,0,fmt(0)),id:"literal-name",venceEn:0,extension:{zero:0}};
  expect(event.texto).toBe(`${name} ofrece $0 por semana durante 0 semanas a cambio de lucir su logo en el ring.`);
  const copy=presentation.presentarEvento(event,locale);
  expect(copy.historico).toBe(false);expect(copy.texto).toContain(name);
  expect(copy).toHaveProperty("extension",{zero:0});
  expect(copy.opciones[0].accion).toEqual(event.opciones[0].accion);
  const changed={...event,opciones:event.opciones.map((o,i)=>i ? o : {...o,accion:{...o.accion,extension:0}})};
  expect(presentation.presentarEvento(changed,locale)).toEqual({...changed,historico:true});
});
it.each(["es","en","pt-BR"] as const)("%s traduce todas las plantillas nuevas sin cambiar opciones, cobros ni RNG",locale=>{
  const restore=usarSemilla(5419);
  try {
    const state=crearEstadoBase();state.fama=20;state.legados=0;state.plantel[0].rol="boxeador";
    const seen=new Set<string>();
    for(let i=0;i<150;i++) for(const event of generarEventos(state)) {
      const before=JSON.stringify(event);
      const rng=vi.fn(()=>{throw new Error("Presentation consumed RNG");});
      const copy=conFuenteAzar(rng,()=>presentation.presentarEvento(event,locale));
      expect(copy.historico).toBe(false);
      expect(copy.opciones.map(o=>o.accion)).toEqual(event.opciones.map(o=>o.accion));
      expect(copy.venceEn).toBe(event.venceEn);expect(copy.id).toBe(event.id);
      if(locale==="es")expect({...copy,historico:undefined}).toEqual({...event,historico:undefined});
      else expect(copy.titulo).not.toBe(event.titulo);
      expect(JSON.stringify(event)).toBe(before);expect(rng).not.toHaveBeenCalled();
      seen.add(event.tipo);
      for(const damaged of [{...event,texto:"Registro original desconocido {name} 🥊"},{...event,titulo:"Otro título"},{...event,opciones:event.opciones.map((o,n)=>n ? o : {...o,accion:{tipo:"nada" as const}})}]) {
        if(JSON.stringify(damaged)===before)continue;
        expect(presentation.presentarEvento(damaged,locale)).toEqual({...damaged,historico:true});
      }
    }
    expect([...seen].sort()).toEqual(["desafio","entrevista","mantenimiento","patrocinio","prospecto","recaudacion"]);
  } finally {restore();}
});
