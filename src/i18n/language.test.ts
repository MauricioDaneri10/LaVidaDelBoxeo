import {afterEach,expect,it,vi} from "vitest";
import {catalogs,es,registrarCatalogo} from "./catalog";
import {cargarIdioma,IDIOMAS_HABILITADOS,seleccionarIdioma,restaurarIdioma} from "./index";
afterEach(()=>{catalogs.en=undefined;catalogs["pt-BR"]=undefined;vi.unstubAllGlobals();});
function isolated(initial:string|null) {
  const entries=new Map([["vida-del-boxeo-v2","partida intacta"],["vida-del-boxeo:idioma",initial]]);
  const write=vi.fn((k:string,v:string)=>{entries.set(k,v);});
  const dispatch=vi.fn();
  vi.stubGlobal("localStorage",{getItem:(k:string)=>entries.get(k)??null,setItem:write});
  vi.stubGlobal("window",{dispatchEvent:dispatch});
  return {entries,write,dispatch};
}
it("solo ofrece los tres catálogos completos, y no devuelve un locale sin recurso validado",()=>{
  isolated("en");
  expect(IDIOMAS_HABILITADOS).toEqual(["es","en","pt-BR"]);
  expect(cargarIdioma()).toBe("es");
  registrarCatalogo("en",{...es});
  expect(cargarIdioma()).toBe("en");
});
it.each(["en","pt-BR"] as const)("%s carga primero y guarda únicamente la preferencia, sin RNG",async locale=>{
  const {entries,write,dispatch}=isolated("es");
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({...es})});
  vi.stubGlobal("fetch",fetcher);
  const rng=vi.spyOn(Math,"random").mockImplementation(()=>{throw new Error("Language used game RNG");});
  try {
    expect(await seleccionarIdioma(locale,"https://example.invalid/game/")).toBe(true);
    expect(cargarIdioma()).toBe(locale);
    expect(write.mock.calls).toEqual([["vida-del-boxeo:idioma",locale]]);
    expect(entries.get("vida-del-boxeo-v2")).toBe("partida intacta");
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0][0])).toBe(`https://example.invalid/game/i18n/${locale}.json`);
  } finally {rng.mockRestore();}
});
it.each(["404","offline","invalid","denied"])("%s no informa idioma cambiado ni sobrescribe la preferencia",async failure=>{
  const {entries,write,dispatch}=isolated("es");
  vi.stubGlobal("fetch",failure==="offline"?vi.fn().mockRejectedValue(new Error("offline")):vi.fn().mockResolvedValue({ok:failure!=="404",status:404,json:async()=>failure==="invalid"?{missing:"key"}:{...es}}));
  if(failure==="denied")vi.stubGlobal("localStorage",{getItem:()=>"es",setItem:()=>{throw new Error("denied");}});
  expect(await seleccionarIdioma("en","https://example.invalid/game/")).toBe(false);
  expect(cargarIdioma()).toBe("es");
  expect(write).not.toHaveBeenCalled();expect(dispatch).not.toHaveBeenCalled();
  expect(entries.get("vida-del-boxeo-v2")).toBe("partida intacta");
});
it("restaurar una preferencia carga y notifica sin reescribirla; offline queda explícitamente fallido",async()=>{
  const {entries,write,dispatch}=isolated("pt-BR");
  vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("offline")));
  expect(await restaurarIdioma("https://example.invalid/game/")).toBe(false);
  expect(cargarIdioma()).toBe("es");expect(write).not.toHaveBeenCalled();expect(dispatch).not.toHaveBeenCalled();
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({...es})}));
  expect(await restaurarIdioma("https://example.invalid/game/")).toBe(true);
  expect(cargarIdioma()).toBe("pt-BR");expect(write).not.toHaveBeenCalled();expect(dispatch).toHaveBeenCalledTimes(1);
  expect(entries.get("vida-del-boxeo:idioma")).toBe("pt-BR");
});
it("preferencia futura/desconocida queda literal y español no requiere red",async()=>{
  const {entries,write}=isolated("futuro");
  const fetcher=vi.fn();vi.stubGlobal("fetch",fetcher);
  expect(await restaurarIdioma("https://example.invalid/game/")).toBe(true);
  expect(cargarIdioma()).toBe("es");expect(entries.get("vida-del-boxeo:idioma")).toBe("futuro");
  expect(write).not.toHaveBeenCalled();expect(fetcher).not.toHaveBeenCalled();
  expect(await seleccionarIdioma("unknown" as "en")).toBe(false);expect(fetcher).not.toHaveBeenCalled();
});
