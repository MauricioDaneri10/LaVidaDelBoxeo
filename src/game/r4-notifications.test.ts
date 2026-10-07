import {expect,it} from "vitest";
import {crearEstadoBase,crearEstadoPelea,resolverPelea} from "./engine";
import {reductor} from "./state";
import {textoContenido} from "./messageContent";
it("una guarda nueva conserva copia/tono y declara identidad sin RNG ni cambios de dinero",()=>{
  const base=crearEstadoBase();
  const p=base.plantel[0];
  const next=reductor(base,{type:"LICENCIAR",id:p.id});
  expect(next.toasts[next.toasts.length-1]).toMatchObject({texto:"Primero necesitás la Licencia de Entrenador del club.",tono:"alerta",presentacion:{id:"toast.coachLicense",parametros:{}}});
  expect(next.dinero).toBe(base.dinero);expect(next.plantel).toEqual(base.plantel);expect(next.stats).toEqual(base.stats);
});
it("el resumen nuevo conserva método/tarjetas y añade identidad fiable sin azar",()=>{
  const base=crearEstadoBase(),p=base.plantel[0],rival={...base.plantel[1],id:"result-reference"};
  const bout={id:"result-bout",miId:p.id,rival,bolsa:600,esTitulo:0 as const,velada:false};
  const e=crearEstadoPelea(bout,p,[]);e.ko=null;e.asaltosCerrados=e.totalAsaltos;e.tarjetas=[{a:30,b:27},{a:30,b:27},{a:30,b:27}];
  const result=resolverPelea(e);
  expect(result.resumen).toBe("Decisión Unánime (30-27, 30-27, 30-27)");
  expect(result).toMatchObject({metodo:"Decisión Unánime",bolsa:600,gane:true,empate:false,presentacion:{id:"result.cards",parametros:{method:"Decisión Unánime",scores:"30-27, 30-27, 30-27"}}});
});
it("una guarda sin semana de recuperación no evalúa parámetros de otra rama",()=>{
  const s=crearEstadoBase();const p=s.plantel[0];p.rol="boxeador";p.licenciaFederativa=false;
  const next=reductor(s,{type:"BUSCAR_RIVAL",id:p.id});
  expect(next.toasts[next.toasts.length-1].texto).toBe("Primero tramitá la licencia del boxeador.");
  expect(next.dinero).toBe(s.dinero);expect(next.ofertas).toEqual(s.ofertas);
});
it("la interpolación de contenido conserva nombres con llaves, ceros y símbolos",()=>{
  expect(textoContenido("ledger.brand",{name:"{name} $&"})).toBe('Ventas de la marca "{name} $&"');
  expect(()=>textoContenido("ledger.students",{count:0})).toThrow("Invalid content parameters");
  expect(()=>textoContenido("ledger.students",{count:NaN,fee:18})).toThrow("Invalid content parameters");
});
it("licencia y marca nuevas declaran parámetros fiables sin reescribir nombres",()=>{
  const base=crearEstadoBase();base.cursos=["dt"];base.dinero=900;
  const p=base.plantel[0];p.guanteosRealizados=10;p.nombre="{name} $& 🥊";
  const licensed=reductor(base,{type:"LICENCIAR",id:p.id});
  expect(licensed.toasts[licensed.toasts.length-1]).toMatchObject({texto:"{name} ya tiene su Licencia Amateur y es boxeador federado. ¡Bono de Madurez activo en su debut!",presentacion:{id:"toast.licensed",parametros:{name:"{name}"}}});
  expect(licensed.dinero).toBe(700);
  base.equipamiento=["estudioMarca"];
  const brand=reductor(base,{type:"CREAR_MARCA",nombre:"{name} $& 🥊"});
  expect(brand.toasts[brand.toasts.length-1]).toMatchObject({texto:'Nace la marca "{name} $& 🥊". Cada domingo se liquida la venta de indumentaria.',presentacion:{id:"toast.brandBorn",parametros:{name:"{name} $& 🥊"}}});
  expect(brand.marcaRopa).toBe("{name} $& 🥊");expect(brand.dinero).toBe(900);
});
