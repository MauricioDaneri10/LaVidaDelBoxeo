import { beforeAll,expect,it,vi } from "vitest";
import { registrarCatalogo,translate } from "./catalog";
import { presentarContenido } from "./content";
import { contenidoLibro,contenidoMensaje,contenidoPrensaResultado,TEXTOS_CONTENIDO,type ContenidoId } from "../game/messageContent";
import {contenidoProspecto} from "../game/eventContent";
import { presentarResultadoHistorico } from "./presentation";
import { crearEstadoBase,crearEstadoPelea,resolverPelea } from "../game/engine";
import { reductor } from "../game/state";
import { conFuenteAzar } from "../game/random";
import { EQUIPOS,CURSOS,PROPIEDADES,PERSONAL_INFO,COMUNITARIOS } from "../game/data";
beforeAll(async()=>{
  const {readFileSync}=await vi.importActual<{readFileSync:(url:URL,encoding:string)=>string}>("node:fs");
  for(const locale of ["en","pt-BR"] as const)registrarCatalogo(locale,JSON.parse(readFileSync(new URL(`../../public/i18n/${locale}.json`,import.meta.url),"utf8")));
});
it.each(["es","en","pt-BR"] as const)("%s liquida actividades conocidas por identidad, manteniendo nombre e importe históricos",locale=>{
  const base={...crearEstadoBase(),creado:true,dia:6 as const,comunitarios:[{tipo:"naipes" as const,nombre:COMUNITARIOS.naipes.nombre}]};
  const next=conFuenteAzar(()=>0.75,()=>reductor(base,{type:"AVANZAR_DIA"}));
  const row=next.resumen!.ingresos.find(r=>r.concepto===`Dividendos: ${COMUNITARIOS.naipes.nombre}`)!;
  expect(row.presentacion).toEqual({id:"ledger.activityDividends",parametros:{activity:"naipes"}});
  expect(presentarContenido(row.concepto,row.presentacion,locale)).toEqual({texto:translate(locale,"content.ledger.activityDividends",{activity:translate(locale,"social.naipes.name")}),historico:false});
  const historical={...base,comunitarios:[{tipo:"naipes" as const,nombre:"Actividad histórica {name} $&"}]};
  const other=conFuenteAzar(()=>0.75,()=>reductor(historical,{type:"AVANZAR_DIA"})).resumen!.ingresos.find(r=>r.concepto==='Dividendos: Actividad histórica {name} $&')!;
  expect(other.monto).toBe(row.monto);
  expect(other.presentacion).toEqual({id:"ledger.dividends",parametros:{name:"Actividad histórica {name} $&"}});
  expect(presentarContenido(other.concepto,other.presentacion,locale).texto).toContain("Actividad histórica {name} $&");
  expect(base.comunitarios).toEqual([{tipo:"naipes",nombre:COMUNITARIOS.naipes.nombre}]);
});
it.each(["es","en","pt-BR"] as const)("%s cubre todas las plantillas nuevas, incluidos errores y referencias anidadas",locale=>{
  const references:Record<string,string|number>={offer:"parejo",objective:"c9",event:JSON.stringify({...contenidoProspecto("Club {name} 🥊"),id:"content-event",venceEn:0}),reason:JSON.stringify(contenidoMensaje("save.error.format").presentacion),summary:JSON.stringify(contenidoMensaje("result.cards",{method:"Decisión Unánime",scores:"30-27"}).presentacion),method:"Decisión Unánime",title:4,belt:4,employee:"directorTecnico",gear:"soga",effect:"soga",course:"dt",property:"local",activity:"bingo",amount:0};
  for(const [id,template] of Object.entries(TEXTOS_CONTENIDO)) {
    const parameters=Object.fromEntries([...template.matchAll(/\{(\w+)\}/g)].map(match=>[match[1],references[match[1]]??`Literal {${match[1]}} $& 🥊`]));
    const copy=contenidoMensaje(id as ContenidoId,parameters),before=JSON.stringify(copy);
    const presented=presentarContenido(copy.texto,copy.presentacion,locale);
    expect(presented.historico,id).toBe(false);
    expect(presented.texto,id).not.toContain(`content.${id}`);
    if(locale==="es")expect(presented.texto,id).toBe(copy.texto);
    expect(JSON.stringify(copy),id).toBe(before);
  }
});
it.each(["es","en","pt-BR"] as const)("%s no presenta como fiable una referencia anidada cuyo método es desconocido",locale=>{
  const result=contenidoMensaje("result.cards",{method:"Método histórico desconocido",scores:"10-10"});
  const news=contenidoMensaje("press.win",{medium:"Diario",summary:JSON.stringify(result.presentacion)});
  expect(presentarContenido(news.texto,news.presentacion,locale)).toEqual({texto:news.texto,historico:true});
});
it.each(["es","en","pt-BR"] as const)("%s traduce resultado/prensa fiables y conserva resúmenes antiguos contradictorios",locale=>{
  const base=crearEstadoBase(),p=base.plantel[0],rival=base.plantel[1];
  const fight=crearEstadoPelea({id:"content-result",miId:p.id,rival,bolsa:600,esTitulo:0,velada:false},p,[]);
  fight.tarjetas=[{a:30,b:27},{a:30,b:27},{a:30,b:27}];fight.asaltosCerrados=fight.totalAsaltos;
  const result=resolverPelea(fight),original=JSON.stringify(result);
  const rng=vi.spyOn(Math,"random").mockImplementation(()=>{throw new Error("RNG in historical presentation");});
  try {
    expect(presentarResultadoHistorico(result,locale)).toEqual({method:translate(locale,"method.unanimous"),summary:translate(locale,"content.result.cards",{method:translate(locale,"method.unanimous"),scores:"30-27, 30-27, 30-27"}),historico:false});
    const news=contenidoPrensaResultado(result,"Diario {name} 🥊");
    expect(presentarContenido(news.texto,"presentacion" in news?news.presentacion:undefined,locale).texto).toContain(translate(locale,"method.unanimous"));
    expect(presentarContenido(news.texto,"presentacion" in news?news.presentacion:undefined,locale).texto).toContain("Diario {name} 🥊");
    expect(JSON.stringify(result)).toBe(original);
    const legacy={...result,resumen:"Crónica antigua que no permite inferir un asalto",presentacion:undefined};
    expect(presentarResultadoHistorico(legacy,locale)).toEqual({method:legacy.metodo,summary:legacy.resumen,historico:true});
    expect(contenidoPrensaResultado(legacy,"Diario")).toEqual({texto:'Diario celebra: "Crónica antigua que no permite inferir un asalto" en la noche del sábado.'});
    const changed={...result,tarjetas:[{a:10,b:10}]};
    expect(presentarResultadoHistorico(changed,locale).historico).toBe(true);
    expect(contenidoPrensaResultado(changed,"Diario")).toEqual({texto:`Diario celebra: "${changed.resumen}" en la noche del sábado.`});
    const ko=contenidoMensaje("result.ko",{method:"Nocaut",round:2});
    expect(presentarResultadoHistorico({...result,metodo:"Nocaut",resumen:ko.texto,presentacion:ko.presentacion},locale)).toEqual({method:translate(locale,"method.ko"),summary:translate(locale,"content.result.ko",{method:translate(locale,"method.ko"),round:2}),historico:false});
  } finally {rng.mockRestore();}
});
it.each(["es","en","pt-BR"] as const)("%s traduce cada referencia por ID, sin traducir nombres ni cambiar importes",locale=>{
  for(const [slot,namespace,source] of [
    ["gear","gear",EQUIPOS],["course","course",CURSOS],["property","property",PROPIEDADES],["employee","employee",PERSONAL_INFO],["activity","social",COMUNITARIOS],
  ] as const) {
    for(const id of Object.keys(source)) {
      const template=slot==="employee"?"toast.employeeJoined":slot==="activity"?"toast.activityFunds":`ledger.${slot}`;
      const params:Record<string,string|number>=slot==="employee"?{employee:id,name:"{name} $& 🥊",amount:1500}:slot==="activity"?{activity:id,amount:1500}:{[slot]:id};
      const line=contenidoLibro(template as Parameters<typeof contenidoLibro>[0],0,params),before=JSON.stringify(line);
      const presented=presentarContenido(line.concepto,line.presentacion,locale);
      expect(presented.historico).toBe(false);
      expect(presented.texto).toContain(translate(locale,`${namespace}.${id}.name` as Parameters<typeof translate>[1]));
      if(slot==="employee")expect(presented.texto).toContain("{name} $& 🥊");
      if(slot==="employee"||slot==="activity")expect(presented.texto).toContain(locale==="en"?"$1,500":"$1.500");
      expect(JSON.stringify(line)).toBe(before);
    }
  }
  const damaged={id:"ledger.gear",parametros:{gear:"no-existe"}};
  expect(presentarContenido("Original intacto",damaged,locale)).toEqual({texto:"Original intacto",historico:true});
});
it.each(["es","en","pt-BR"] as const)("%s conserva nombres/ceros/metadata desconocida sin RNG o lógica textual",locale=>{
  const line=contenidoLibro("ledger.brand",0,{name:'{name} $& <literal> 🥊'}),before=JSON.stringify(line);
  const rng=vi.spyOn(Math,"random").mockImplementation(()=>{throw new Error("RNG in presentation");});
  try {
    const result=presentarContenido(line.concepto,line.presentacion,locale);
    expect(result).toEqual({texto:translate(locale,"content.ledger.brand",{name:'{name} $& <literal> 🥊'}),historico:false});
    expect(JSON.stringify(line)).toBe(before);
    expect(presentarContenido(line.concepto,undefined,locale)).toEqual({texto:line.concepto,historico:true});
    expect(presentarContenido("Conservado",{id:"desconocido",parametros:{zero:0}},locale)).toEqual({texto:"Conservado",historico:true});
    expect(presentarContenido("Otro",line.presentacion,locale)).toEqual({texto:"Otro",historico:true});
    expect(presentarContenido(line.concepto,{id:line.presentacion.id,parametros:{name:"Otro"}},locale)).toEqual({texto:line.concepto,historico:true});
    expect(presentarContenido("Cuotas",{id:"ledger.students",parametros:{count:0}},locale)).toEqual({texto:"Cuotas",historico:true});
    expect(presentarContenido("Alquiler del local",{id:"ledger.rent",parametros:{extra:0}},locale)).toEqual({texto:"Alquiler del local",historico:true});
    const zero=contenidoLibro("ledger.students",0,{count:0,fee:"18"});
    expect(presentarContenido(zero.concepto,zero.presentacion,locale)).toEqual({texto:translate(locale,"content.ledger.students",{count:0,fee:"18"}),historico:false});
  } finally {rng.mockRestore();}
});
