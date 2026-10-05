import { describe,expect,it } from "vitest";
import { crearEstadoBase } from "./engine";
import { contenidoLibro } from "./messageContent";
import { migrarGuardado,hashTexto,SCHEMA_ACTUAL,validarEstado } from "./saveValidation";
import { RepositorioPartidas,CLAVE_GUARDADO as K } from "./saveRepository";
import { weeklyEconomy } from "./economy";

function isolated(state:unknown) {
  const raw=JSON.stringify(state),backup=JSON.stringify(crearEstadoBase());
  const bytes=new Map([[K,raw],[`${K}:respaldo`,backup]]),original=new Map(bytes);
  const repo=new RepositorioPartidas({durable:true,getItem:(key:string)=>bytes.get(key)??null,setItem:(key:string,value:string)=>{bytes.set(key,value);},removeItem:(key:string)=>{bytes.delete(key);}});
  return {repo,bytes,original,raw};
}
describe("R4 — metadata de presentación no altera dinero ni historia",()=>{
  it("9→10 es explícita, idempotente y no infiere identidad de texto antiguo",()=>{
    const old={...crearEstadoBase(),schemaVersion:9,libroIngresos:[{concepto:"Cuotas de alumnos (0 × $18)",monto:0,extension:["{nombre}",0]}]};
    const migrated=migrarGuardado(old);
    expect(SCHEMA_ACTUAL).toBe(10);
    expect(migrated).toEqual({estado:{...old,schemaVersion:10},migrado:true});
    expect(migrarGuardado(migrated.estado)).toEqual({estado:migrated.estado,migrado:false});
    expect(old.schemaVersion).toBe(9);
  });
  it("carga/migración no escribe y guardar protege los bytes originales/backup",()=>{
    const {repo,bytes,original,raw}=isolated({...crearEstadoBase(),schemaVersion:9});
    const loaded=repo.cargar();
    expect(loaded.schemaVersion).toBe(10);
    expect(bytes).toEqual(original);
    expect(repo.guardar(loaded)).toBe(true);
    expect(bytes.get(`${K}:recuperacion:${hashTexto(raw)}`)).toBe(raw);
    expect(new RepositorioPartidas({durable:true,getItem:k=>bytes.get(k)??null,setItem:(k,v)=>{bytes.set(k,v);},removeItem:k=>{bytes.delete(k);}}).cargar()).toEqual(loaded);
  });
  it.each(["libroIngresos","libroGastos","prensa","toasts","historial","archivo","ingresosResumen","gastosResumen"])("colisión antigua en %s protege originales sin apropiarse del campo",field=>{
    const old={...crearEstadoBase(),schemaVersion:9} as unknown as Record<string,unknown>;
    const item={presentacion:{id:"extension-del-usuario",parametros:{valor:0}},concepto:"Literal",monto:0,id:field==="toasts"?1:"id",texto:"Literal",semana:1,tono:"info"};
    if(field==="archivo")old.archivoCarreras=[{historial:[item]}];
    else if(field.endsWith("Resumen")) old.resumen={ingresos:field==="ingresosResumen"?[item]:[],gastos:field==="gastosResumen"?[item]:[],total:0};
    else old[field]=[item];
    const {repo,bytes,original}=isolated(old);
    expect(()=>migrarGuardado(old)).toThrow("presentación");
    expect(repo.guardar(repo.cargar())).toBe(false);
    expect(bytes).toEqual(original);
  });
  it.each([null,false,{id:"x",parametros:{zero:Infinity}},{id:"x",parametros:[]},{id:4,parametros:{}}])("metadata inválida %j no se elimina para habilitar autosave",value=>{
    const old={...crearEstadoBase(),schemaVersion:10,libroIngresos:[{concepto:"Original",monto:0,presentacion:value}]};
    expect(()=>migrarGuardado(old)).toThrow("presentación");
    const {repo,bytes,original}=isolated(old);
    expect(repo.guardar(repo.cargar())).toBe(false);expect(bytes).toEqual(original);
  });
  it("IDs desconocidos y extensiones válidas sobreviven literalmente con ceros",()=>{
    const saved={...crearEstadoBase(),schemaVersion:10,libroIngresos:[{concepto:"Literal histórico {name}",monto:0,presentacion:{id:"future-extension",parametros:{name:"{name} $&",zero:0},extra:{keep:[0,"intacto"]}}}]};
    expect(validarEstado(saved,crearEstadoBase()).estado).toEqual(saved);
    const {repo}=isolated(saved);const loaded=repo.cargar();expect(loaded).toEqual(saved);expect(repo.guardar(loaded)).toBe(true);expect(repo.cargar()).toEqual(saved);
  });
  it("nuevo libro semanal añade identidad sin cambiar importes/etiquetas ni consumir azar",()=>{
    const state={...crearEstadoBase(),creado:true,semana:1,dinero:0,recreativos:0,plantel:[]};
    const result=weeklyEconomy(state,{nivel:1,multiplicadorMarca:1});
    expect(result).toEqual({ingresos:[contenidoLibro("ledger.students",0,{count:0,fee:"18"}),contenidoLibro("ledger.opening",240)],gastos:[contenidoLibro("ledger.rent",150)],total:90});
  });
  it("schema futuro nunca se sobrescribe",()=>{
    const {repo,bytes,original}=isolated({...crearEstadoBase(),schemaVersion:11});
    expect(repo.guardar(repo.cargar())).toBe(false);expect(bytes).toEqual(original);
  });
});
