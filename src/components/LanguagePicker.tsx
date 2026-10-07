import {useEffect,useRef,useState,type ReactNode} from "react";
import {IDIOMAS_HABILITADOS,LOCALES,seleccionarIdioma,restaurarIdioma,idiomaPreferido,useMessages,type Locale} from "../i18n";
import {Btn,TextoPaginado} from "./ui";

export function LanguagePicker() {
  const {t,locale}=useMessages();
  const [estado,setEstado]=useState<"ready"|"loading"|"error">("ready");
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  return <div className="space-y-2"><select className="r4-select" aria-label={t("language.label")} value={locale} disabled={estado==="loading"} onChange={async e=>{
    const next=e.target.value as Locale;setEstado("loading");
    const ok=await seleccionarIdioma(next);
    if(mounted.current)setEstado(ok?"ready":"error");
  }}>{LOCALES.filter(l=>IDIOMAS_HABILITADOS.includes(l.id)).map(l=><option key={l.id} value={l.id}>{l.nombre}</option>)}</select>
    {estado!=="ready"&&<p role={estado==="error"?"alert":"status"}>{t(estado==="error"?"language.error":"language.loading")}</p>}
  </div>;
}

/** Do not initialize/save game state until a persisted language is resolved. */
export function PrepararIdioma({children}:{children:ReactNode}) {
  const {t}=useMessages();
  const [estado,setEstado]=useState<"ready"|"loading"|"error">(()=>idiomaPreferido()==="es"?"ready":"loading");
  const [intento,setIntento]=useState(0);
  useEffect(()=>{
    if(estado!=="loading")return;
    let active=true;restaurarIdioma().then(ok=>{if(active)setEstado(ok?"ready":"error");});
    return()=>{active=false;};
  },[intento,estado]);
  if(estado==="ready")return <>{children}</>;
  return <main className="fondo-app flex h-dvh flex-col gap-3 p-4 text-cream"><section className="panel mx-auto mt-auto w-full max-w-xl p-3">
    <TextoPaginado capacidad={40} texto={t(estado==="error"?"language.restoreError":"language.loading")}/>
    {estado==="error"&&<div className="mt-3 flex flex-wrap gap-2"><Btn onClick={()=>{setEstado("loading");setIntento(n=>n+1);}}>{t("recovery.retry")}</Btn><Btn onClick={()=>setEstado("ready")}>{t("language.spanishOnce")}</Btn></div>}
  </section><footer className="mt-auto text-center text-xs">MadArt Studios</footer></main>;
}
