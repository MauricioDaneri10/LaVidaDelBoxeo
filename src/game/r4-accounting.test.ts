import { describe, expect, it } from "vitest";
import { crearEstadoBase } from "./engine";
import { reductor } from "./state";
import { migrarGuardado, hashTexto, SCHEMA_ACTUAL } from "./saveValidation";
import { RepositorioPartidas, CLAVE_GUARDADO as K } from "./saveRepository";
import { conFuenteAzar } from "./random";

describe("R4 — identidad contable independiente de etiquetas", () => {
  it("un desembolso nuevo tiene identidad financiera y traducir su etiqueta no lo vuelve ingreso ganado", () => {
    const base={...crearEstadoBase(), creado:true, dinero:-143};
    const borrowed=reductor(base,{type:"PEDIR_PRESTAMO"});
    expect(borrowed.libroIngresos).toEqual([{concepto:"Desembolso del préstamo",monto:500,claseContable:"financiacion"}]);
    const renamed=structuredClone(borrowed);
    renamed.libroIngresos[0].concepto="Loan disbursement / Empréstimo / texto histórico";
    const settle=(s: typeof base)=>conFuenteAzar(()=>0.75,()=>{
      for(let day=0;day<6;day++) s=reductor(s,{type:"AVANZAR_DIA"});
      return s;
    });
    const original=settle(borrowed),translated=settle(renamed);
    expect(translated.stats).toEqual(original.stats);
    expect(translated.stats.dineroGanado).toBe(294);
    expect(translated.dinero).toBe(original.dinero);
    expect(translated.resumen?.total).toBe(original.resumen?.total);
    expect(translated.prestamo).toEqual(original.prestamo);
    expect(translated.libroIngresos[0].concepto).toBe(renamed.libroIngresos[0].concepto);
  });
  it("8→9 solo identifica el desembolso conocido: importes, textos y extensiones se conservan; migración idempotente", () => {
    const old={...crearEstadoBase(),schemaVersion:8,libroIngresos:[
      {concepto:"Desembolso del préstamo",monto:500,extension:{literal:0}},
      {concepto:"Desembolso externo desconocido",monto:0,extension:["intacto"]},
    ]};
    const migrated=migrarGuardado(old).estado as typeof old;
    expect(migrated.schemaVersion).toBe(9);
    expect(migrated.libroIngresos).toEqual([{...old.libroIngresos[0],claseContable:"financiacion"},old.libroIngresos[1]]);
    expect(migrarGuardado(migrated)).toEqual({estado:migrated,migrado:false});
    expect(old.libroIngresos[0]).not.toHaveProperty("claseContable");
  });
  it("migrar no escribe; guardar protege bytes originales y backup, con roundtrip exacto", () => {
    const old={...crearEstadoBase(),schemaVersion:8,libroIngresos:[{concepto:"Desembolso del préstamo",monto:500}],
      resumen:{ingresos:[{concepto:"Desembolso del préstamo",monto:0}],gastos:[],total:0}};
    const raw=JSON.stringify(old),backup=JSON.stringify(crearEstadoBase());
    const bytes=new Map([[K,raw],[`${K}:respaldo`,backup]]);
    const adapter={durable:true,getItem:(k:string)=>bytes.get(k)??null,setItem:(k:string,v:string)=>{bytes.set(k,v);},removeItem:(k:string)=>{bytes.delete(k);}};
    const repo=new RepositorioPartidas(adapter),loaded=repo.cargar();
    expect(loaded.schemaVersion).toBe(9);
    expect(bytes.get(K)).toBe(raw);
    expect(bytes.get(`${K}:respaldo`)).toBe(backup);
    expect(loaded.resumen?.ingresos).toEqual([{concepto:"Desembolso del préstamo",monto:0,claseContable:"financiacion"}]);
    expect(repo.guardar(loaded)).toBe(true);
    expect(bytes.get(`${K}:recuperacion:${hashTexto(raw)}`)).toBe(raw);
    expect(new RepositorioPartidas(adapter).cargar()).toEqual(loaded);
  });
  it.each(["extension-desconocida",false,0])("una colisión legacy %j protege original y backup, sin inventar identidad", value => {
    const old={...crearEstadoBase(),schemaVersion:8,libroIngresos:[{concepto:"Otro",monto:0,claseContable:value}]};
    const seed=new Map([[K,JSON.stringify(old)],[`${K}:respaldo`,JSON.stringify(crearEstadoBase())]]),bytes=new Map(seed);
    const repo=new RepositorioPartidas({durable:true,getItem:(k:string)=>bytes.get(k)??null,setItem:(k:string,v:string)=>{bytes.set(k,v);},removeItem:(k:string)=>{bytes.delete(k);}});
    expect(repo.guardar(repo.cargar())).toBe(false);
    expect(bytes).toEqual(seed);
  });
  it("un schema futuro sigue protegido",()=>{
    expect(()=>migrarGuardado({...crearEstadoBase(),schemaVersion:SCHEMA_ACTUAL+1})).toThrow("Schema incompatible");
  });
  it.each(["libroIngresos", "libroGastos", "ingresosResumen", "gastosResumen"])("identidad dañada en %s no se repara eliminándola y habilitando pagos", path => {
    const old=crearEstadoBase();
    const damaged={concepto:"Desembolso del préstamo",monto:500,claseContable:false};
    if(path.startsWith("libro")) Object.assign(old,{[path]:[damaged]});
    else Object.assign(old,{resumen:{ingresos:path==="ingresosResumen"?[damaged]:[],gastos:path==="gastosResumen"?[damaged]:[],total:0}});
    const seed=new Map([[K,JSON.stringify(old)],[`${K}:respaldo`,JSON.stringify(crearEstadoBase())]]),bytes=new Map(seed);
    const repo=new RepositorioPartidas({durable:true,getItem:(k:string)=>bytes.get(k)??null,setItem:(k:string,v:string)=>{bytes.set(k,v);},removeItem:(k:string)=>{bytes.delete(k);}});
    expect(repo.guardar(repo.cargar())).toBe(false);
    expect(bytes).toEqual(seed);
  });
});
