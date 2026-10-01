import { it, expect } from 'vitest';
import { crearEstadoBase, genPugilista, sanitizarEstado, crearEstadoPelea, resolverPelea, aplicarEntrenamientoSemanal, consejoEsquina, ofertasValidasPara, fechaDelJuego, calcularModificadores } from '../src/game/engine';
import { reductor } from '../src/game/state';
import { usarSemilla } from '../src/game/random';

// Diagnostic evidence: these assertions reproduce observed defects, NOT acceptance gates.
it('records integral audit counterexamples without changing the game', () => {
  const restore = usarSemilla(441001);
  try {
    const base = crearEstadoBase();
    const boxer = { ...genPugilista({rol:'boxeador'}), circuito:'pro' as const, energia:0, peleasAmateur:50, peleasProfesionales:0, victoriasProfesionales:0, derrotasProfesionales:0, empatesProfesionales:0, kosProfesionales:0, record:{v:32,d:18,e:0,ko:12} };
    const loaded = sanitizarEstado({...base, plantel:[boxer], seguidores:0});
    expect(loaded.plantel[0].peleasProfesionales).toBe(50);
    expect(loaded.plantel[0].energia).toBe(100);
    console.log('SAVE: pro debut 0 ->', loaded.plantel[0].peleasProfesionales, '; energy 0 ->',loaded.plantel[0].energia,'; followers 0 ->',loaded.seguidores);
    expect(() => sanitizarEstado({...base,plantel:[null]})).toThrow();
    console.log('CORRUPT: one null roster entry throws instead of repairing that entry');
    const rival = genPugilista({rol:'boxeador'});
    const bout = {id:'audit-bout', miId:boxer.id, rival, bolsa:600, esTitulo:0 as const, velada:false, semanaProgramada:1, diaProgramado:6};
    const fight = crearEstadoPelea(bout,boxer,[]);
    fight.tarjetas = [{a:30,b:27},{a:30,b:27},{a:27,b:30}];
    expect(resolverPelea(fight).metodo).toBe('Decisión Unánime');
    fight.tarjetas = [{a:27,b:30},{a:27,b:30},{a:27,b:30}];
    expect(resolverPelea(fight).metodo).toBe('Decisión Dividida');
    console.log('JUDGES: 2-1 victory labelled unanimous; 0-3 defeat labelled split');
    const sunday = reductor({...base,dia:6,pendientes:[bout]}, {type:'AVANZAR_DIA'});
    expect(sunday.dia).toBe(7); expect(sunday.pendientes).toHaveLength(1);
    const fast = reductor({...base,dia:5,pendientes:[bout]}, {type:'SEMANA_RAPIDA'});
    expect(fast.dia).toBe(7); expect(fast.pendientes).toHaveLength(1);
    console.log('TIME: direct and fast advance reach Sunday with unresolved bout');
    const injured = {...genPugilista(),energia:100,lesion:{tipo:'mano' as const,semanas:2,gravedad:'media' as const,tratamiento:220}};
    const healthy = genPugilista();
    const saturday = reductor({...base,dia:5,plantel:[injured,healthy]}, {type:'AVANZAR_DIA'});
    expect(saturday.plantel.find(p=>p.id===injured.id)!.guanteosRealizados).toBe(1);
    console.log('HEALTH: injured boxer spars on Saturday');
    const learner = {...genPugilista(),fogueo:9,guanteosRealizados:6};
    let licenseProof=false;
    for(let seed=1;seed<30;seed++) {
      const reset=usarSemilla(seed);
      const next=reductor({...base,dia:5,plantel:[learner,healthy]}, {type:'AVANZAR_DIA'});
      reset();
      const p=next.plantel.find(p=>p.id===learner.id)!;
      if(p.fogueo===10 && p.guanteosRealizados===7) {licenseProof=true;break;}
    }
    expect(licenseProof).toBe(true);
    console.log('LICENSE: threshold 10 can be reached after 7 actual sessions');
    const weak = {...genPugilista(),atrib:{...genPugilista().atrib,potencia:60,talento:35},combo:'noqueador' as const};
    const trained=aplicarEntrenamientoSemanal({...base,plantel:[weak]}).plantel[0];
    expect(trained.atrib.potencia).toBe(38);
    console.log('TRAINING: potency 60 ->',trained.atrib.potencia,'when talent is 35');
    const pro={...boxer,energia:100,peleasProfesionales:25,victoriasProfesionales:20,kosProfesionales:10};
    const offers=ofertasValidasPara(pro,{...base,cursos:[]});
    expect(offers[2].esTitulo).toBe(0);expect(offers[2].bolsa).toBeGreaterThanOrEqual(60000);
    console.log('TITLE: TV-blocked ordinary offer retains world purse',offers[2].bolsa);
    let time={...base,plantel:[healthy]};
    const age=healthy.edad;
    for(let i=0;i<48;i++) time=reductor({...time,dia:7},{type:'CERRAR_DOMINGO'});
    expect(time.anio).toBe(2027);expect(fechaDelJuego(time.semana,time.dia).getFullYear()).toBe(2026);
    expect(time.plantel[0].edad).toBe(age+1);
    console.log('CLOCK: week49 stored year',time.anio,'civil year',fechaDelJuego(49,1).getFullYear());
    const oldId=healthy.id;
    const retired=reductor({...base,plantel:[healthy]},{type:'RETIRAR_ATLETA',id:oldId});
    expect(retired.plantel.some(p=>p.id===oldId)).toBe(false);expect(retired.salonFama.some(p=>p.id===oldId)).toBe(false);
    console.log('HISTORY: non-legend release removes boxer with no historical archive');
    const a={...genPugilista(),energia:100}; const b={...genPugilista(),energia:100};
    const r1={...rival,atrib:{...rival.atrib,defensa:40,velocidad:40}};
    const r2={...rival,atrib:{...rival.atrib,defensa:90,velocidad:90,potencia:90}};
    const dt=aplicarEntrenamientoSemanal({...base,plantel:[a,b],personal:[{id:'dt',nombre:'DT',tipo:'directorTecnico'}],pendientes:[{...bout,miId:a.id,rival:r1},{...bout,id:'b2',miId:b.id,rival:r2}]});
    expect(dt.plantel[1].combo).toBe('noqueador');expect(consejoEsquina(b,r2)).toBe('tactico');
    console.log('COACH: boxer B receives',dt.plantel[1].combo,'although own rival recommends',consejoEsquina(b,r2));
    const mods=calcularModificadores({...base,equipamiento:['cuerdaVelocidad','plataformaReaccion']});
    expect(mods.gananciaAtributo.velocidad).toBe(1);expect(mods.gananciaAtributo.defensa).toBe(1);
    console.log('MARKET: two advertised +10% upgrades apply no modifier');
    const managed={...base,semana:10,fama:50,cursos:['dt','franquicias'] as typeof base.cursos,propiedades:['sucursal'] as typeof base.propiedades,personal:[{id:'manager',nombre:'Manager',tipo:'gerente' as const}]};
    const coachHire=reductor(managed,{type:'CONTRATAR',tipo:'entrenadorLocal',confirmado:true});
    expect(coachHire.personal.some(p=>p.tipo==='entrenadorLocal')).toBe(false);
    console.log('STAFF: existing branch manager prevents hiring its local coach');
    let rewardState={...base,recreativos:3,seguidores:1500,stats:{...base.stats,victorias:3}};
    for(let i=0;i<20;i++) {
      rewardState=reductor({...rewardState,dia:7},{type:'CERRAR_DOMINGO'});
      const reward=rewardState.consejos.find(c=>c.cumplido&&!c.reclamado);
      if(reward) rewardState=reductor(rewardState,{type:'RECLAMAR_CONSEJO',id:reward.id});
    }
    expect(rewardState.consejos.length).toBeGreaterThan(20);
    console.log('REWARDS: old thresholds generate and fulfill',rewardState.consejos.length,'missions without new achievements');
    const event={id:'ttl',tipo:'entrevista' as const,de:'Radio',titulo:'Audit',texto:'Audit',venceEn:1,opciones:[]};
    const weekend=reductor({...base,dia:5,eventos:[event]},{type:'SEMANA_RAPIDA'});
    const monday=reductor(weekend,{type:'CERRAR_DOMINGO'});
    expect(monday.eventos[0].venceEn).toBe(1);
    console.log('EVENT TTL: one day remaining on Friday remains one day on Monday');
    const secondSaturday=reductor({...base,dia:6,plantel:[healthy,learner]},{type:'SEMANA_RAPIDA'});
    expect(secondSaturday.plantel.find(p=>p.id===healthy.id)!.guanteosRealizados).toBe(healthy.guanteosRealizados+1);
    console.log('SATURDAY: fast command re-executes Saturday when starting on Saturday');
  } finally {restore();}
});
