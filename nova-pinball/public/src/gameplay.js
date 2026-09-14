// SPDX-License-Identifier: GPL-3.0-or-later
// Clean-room behavioural reimplementation of Nova Pinball's gameplay state.
// Values and mission ordering are derived from the GPL-3.0-or-later upstream v0.2.3 source.

export const POINTS = Object.freeze({
  gravityLock: 250000,
  kicker: 7500,
  bumper: 5000,
  wordBonus: 12500,
  dotTargets: 1000,
  redGiant: 10000,
  hydrogenRelease: 12500,
  fusionStage1: 15000,
  fusionStage2: 17500,
  collapseStar: 22500,
  supergravityBonus: 500000,
  multiballBonus: 150000,
});

const BASE_MISSIONS = Object.freeze([
  {title:'red giant',needs:['nova word'],points:POINTS.redGiant},
  {title:'hydrogen release',needs:['left ramp','right ramp'],points:POINTS.hydrogenRelease},
  {title:'fusion stage 1',needs:['left targets','left ramp','left bumper'],points:POINTS.fusionStage1},
  {title:'fusion stage 2',needs:['right targets','right ramp','right bumper'],points:POINTS.fusionStage2},
  {title:'fusion burn',wait:30,needs:['left ramp','right ramp','nova word'],points:0},
  {title:'fusion unstable',wait:30,needs:['left ramp','right ramp','nova word'],points:0},
  {title:'collapse star',needs:['left ramp','right ramp','nova word'],points:POINTS.collapseStar},
  {title:'wormhole',needs:['black hole','black hole','black hole'],points:0},
  {title:'reset',wait:7,needs:[],points:POINTS.supergravityBonus},
]);

const BONUS_NOTICE = Object.freeze({title:'bonus ball notice',wait:30,needs:[],points:0});
const BONUS_BALL = Object.freeze({
  title:'bonus ball',
  needs:['left bumper','nova word','right bumper','nova word','middle bumper','left targets','right targets'],
  points:POINTS.multiballBonus,
});

const cloneMission = m => ({...m,needs:[...m.needs]});

class TargetGroup {
  constructor(tags, signal) {
    this.tags=[...tags];
    this.signal=signal;
    this.on=new Set();
  }
  reset(){ this.on.clear(); }
  isOn(tag){ return this.on.has(tag); }
  hit(tag){
    if(!this.tags.includes(tag) || this.on.has(tag)) return {changed:false,complete:false};
    this.on.add(tag);
    if(this.on.size===this.tags.length){
      this.reset();
      return {changed:true,complete:true,signal:this.signal};
    }
    return {changed:true,complete:false};
  }
}

export class HistoricalGameplay {
  constructor(){ this.reset(); }
  reset(){
    this.score=0;
    this.word=new TargetGroup(['n','o','v','a'],'nova word');
    this.leftDots=new TargetGroup(['dot4','dot5'],'left targets');
    this.rightDots=new TargetGroup(['dot1','dot2'],'right targets');
    this.missionsList=BASE_MISSIONS.map(cloneMission);
    this.bonusInserted=false;
    this.missionIndex=0;
    this.missionProgress=[];
    this.waitRemaining=this.mission?.wait||0;
    this.star='stable';
    this.fusion1=false;
    this.fusion2=false;
    this.unstable=false;
    this.blackHole=false;
    this.wormhole=false;
    this.safeMode=0;
    this.lastEvent='';
  }
  get missions(){ return this.missionsList; }
  get mission(){ return this.missions[this.missionIndex] || null; }
  get nextSignal(){
    if(!this.mission) return null;
    if(this.waitRemaining>0) return 'wait';
    return this.mission.needs[this.missionProgress.length] ?? null;
  }
  get waitSeconds(){ return Math.max(0,this.waitRemaining); }
  addScore(amount,tilt=false){
    if(tilt || !amount) return false;
    this.score+=amount;
    return true;
  }
  beginMission(index){
    this.missionIndex=index;
    this.missionProgress=[];
    this.waitRemaining=this.mission?.wait||0;
  }
  insertBonusMission(){
    if(this.bonusInserted) return false;
    const hydrogen=this.missions.findIndex(m=>m.title==='hydrogen release');
    if(hydrogen<0) return false;
    this.missions.splice(hydrogen+1,0,cloneMission(BONUS_NOTICE),cloneMission(BONUS_BALL));
    this.bonusInserted=true;
    return true;
  }
  completeMission(events=[]){
    const completed=this.mission;
    if(!completed) return;
    if(completed.points) {
      this.addScore(completed.points,false);
      events.push({type:'score',points:completed.points,reason:`mission:${completed.title}`});
    }
    events.push({type:'mission-complete',title:completed.title,points:completed.points||0});

    if(completed.title==='red giant') this.star='red';
    else if(completed.title==='fusion stage 1') this.fusion1=true;
    else if(completed.title==='fusion stage 2') this.fusion2=true;
    else if(completed.title==='fusion unstable') this.unstable=true;
    else if(completed.title==='collapse star') this.blackHole=true;
    else if(completed.title==='wormhole') {
      this.wormhole=true;
      this.safeMode=30;
    } else if(completed.title==='bonus ball') {
      this.safeMode=30;
      events.push({type:'multiball-release'});
    } else if(completed.title==='reset') {
      this.star='stable';
      this.fusion1=false;
      this.fusion2=false;
      this.unstable=false;
      this.blackHole=false;
      this.wormhole=false;
    }

    // mission.lua resets to step 1 after the last mission before the callback.
    // play.insertBonusMission() then inserts the Matter Jettison pair after
    // Hydrogen Release, so it first appears in the *next* cycle.
    if(completed.title==='reset'){
      const wrapped=this.missionIndex===this.missions.length-1;
      if(wrapped){
        this.beginMission(0);
        if(this.insertBonusMission()) events.push({type:'bonus-mission-inserted'});
        return;
      }
    }

    const next=(this.missionIndex+1)%this.missions.length;
    this.beginMission(next);
  }
  update(dt){
    const events=[];
    if(this.safeMode>0) this.safeMode=Math.max(0,this.safeMode-dt);
    if(this.waitRemaining>0){
      this.waitRemaining-=dt;
      if(this.waitRemaining<=0){
        this.waitRemaining=0;
        events.push({type:'mission-wait-complete',title:this.mission?.title});
        if(this.mission && this.mission.needs.length===0) this.completeMission(events);
      }
    }
    return events;
  }
  checkMission(signal,tilt=false,events=[]){
    if(tilt || !this.mission || this.waitRemaining>0 || this.nextSignal!==signal) return;
    this.missionProgress.push(signal);
    events.push({type:'mission-check',signal});
    if(this.missionProgress.length===this.mission.needs.length) this.completeMission(events);
  }
  hit(tag,tilt=false){
    const events=[];

    if(tag==='left bumper'||tag==='middle bumper'||tag==='right bumper'){
      if(this.addScore(POINTS.bumper,tilt)) events.push({type:'score',points:POINTS.bumper,reason:'bumper'});
    } else if(tag==='left kicker'||tag==='right kicker'){
      if(this.addScore(POINTS.kicker,tilt)) events.push({type:'score',points:POINTS.kicker,reason:'kicker'});
    } else if(tag==='black hole' && this.blackHole && !tilt){
      this.addScore(POINTS.gravityLock,false);
      events.push({type:'score',points:POINTS.gravityLock,reason:'gravity-lock'});
      events.push({type:'black-hole-lock',seconds:1});
    }

    const groups=[
      [this.word,POINTS.wordBonus,'word-bonus'],
      [this.leftDots,POINTS.dotTargets,'dot-bonus'],
      [this.rightDots,POINTS.dotTargets,'dot-bonus'],
    ];
    for(const [group,points,reason] of groups){
      const result=group.hit(tag);
      if(result.changed) events.push({type:'target',tag});
      if(result.complete){
        if(this.addScore(points,tilt)) events.push({type:'score',points,reason});
        this.checkMission(result.signal,tilt,events);
      }
    }

    this.checkMission(tag,tilt,events);
    return events;
  }
  targetOn(tag){
    return this.word.isOn(tag)||this.leftDots.isOn(tag)||this.rightDots.isOn(tag);
  }
}
