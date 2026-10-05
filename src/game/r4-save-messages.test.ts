import {expect,it} from "vitest";
import {ErrorGuardado} from "./saveValidation";
import {contenidoMensaje} from "./messageContent";
import {RepositorioPartidas} from "./saveRepository";
import {crearEstadoBase} from "./engine";
it("el error operativo conserva motivo/código y su identidad independiente del idioma",()=>{
  const copy=contenidoMensaje("ledger.rent");
  const error=new ErrorGuardado(copy,"ambiguous");
  expect(error.message).toBe(copy.texto);
  expect(error.codigo).toBe("ambiguous");
  expect(error.presentacion).toEqual(copy.presentacion);
});
it("un almacenamiento no durable no anuncia éxito y expone el motivo traducible",()=>{
  const repo=new RepositorioPartidas({durable:false,getItem:()=>null,setItem:()=>{},removeItem:()=>{}});
  expect(repo.guardar(crearEstadoBase())).toBe(false);
  expect(repo.estado.ok).toBe(false);
  expect(repo.estado.mensaje).toBe("No se guardó la partida: Almacenamiento denegado: la sesión está solo en memoria y se perderá al cerrar.");
  expect(repo.estado.presentacion?.id).toBe("save.failedKnown");
  expect(repo.estado.presentacion?.parametros.reason).toBeDefined();
});
it("errores técnicos desconocidos preservan literalmente su detalle y nunca anuncian éxito",()=>{
  const error=new Error("QuotaExceededError: {reason} $& 🥊");
  const repo=new RepositorioPartidas({durable:true,getItem:()=>{throw error;},setItem:()=>{},removeItem:()=>{}});
  expect(repo.guardar(crearEstadoBase())).toBe(false);
  expect(repo.estado).toMatchObject({ok:false,mensaje:"No se guardó la partida. Detalle técnico original: QuotaExceededError: {reason} $& 🥊",presentacion:{id:"save.failedTechnical",parametros:{details:error.message}}});
});
