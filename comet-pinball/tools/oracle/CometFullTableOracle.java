import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import com.badlogic.gdx.physics.box2d.joints.RevoluteJointDef;
import java.util.*;

/** Full-table deterministic oracle using the exact libGDX/Box2D bundled in Comet Pinball 1.1.0. */
public class CometFullTableOracle {
  static final float S=10f, W=.76f*S, H=1.40f*S;
  static final float BALL_R=.0135f*S, STEEL_E=.56f, DENSITY=8000f/(S*S*S);
  static final float G=-9.81f*S*(float)Math.sin(Math.toRadians(7));
  static final float BUMPER_FORCE=20f*S, SLING_R=.005f*S, DT=1f/60f;
  static final int MAX_FRAMES=3600;
  static boolean detailState=false, detailContacts=false;

  static class Event { int frame,seq; String type,label; int id,value,score; Event(int f,int s,String t,String l,int i,int v,int sc){frame=f;seq=s;type=t;label=l;id=i;value=v;score=sc;} }
  static class RunState {
    int frame=-1,seq=0,score=0,ballsPlayed=0,ballNumber=1;
    boolean plunged=false,down=false;
    int resetFrame=0,plungeFrame=-1,drainFrame=-1;
    final List<Event> events=new ArrayList<Event>();
    void event(String type,String label,int id,int value){events.add(new Event(frame,seq++,type,label,id,value,score));}
  }

  static Fixture fixtureBox(Body b,float hx,float hy,String label,float restitution){
    PolygonShape s=new PolygonShape(); s.setAsBox(hx,hy); FixtureDef fd=new FixtureDef(); fd.shape=s; fd.restitution=restitution;
    Fixture f=b.createFixture(fd); f.setUserData(label); s.dispose(); return f;
  }
  static Body staticBox(World w,float hx,float hy,float x,float y,float e,String label){
    BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.StaticBody;bd.position.set(x,y);Body b=w.createBody(bd);fixtureBox(b,hx,hy,label,e);return b;
  }
  static Body staticPoly(World w,Vector2[] pts,float x,float y,float e,String label){
    BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.StaticBody;bd.position.set(x,y);Body b=w.createBody(bd);
    PolygonShape s=new PolygonShape();s.set(pts);FixtureDef fd=new FixtureDef();fd.shape=s;fd.restitution=e;Fixture f=b.createFixture(fd);f.setUserData(label);s.dispose();return b;
  }
  static Body staticCircle(World w,float r,float x,float y,float e,String label){
    BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.StaticBody;bd.position.set(x,y);Body b=w.createBody(bd);
    CircleShape s=new CircleShape();s.setRadius(r);FixtureDef fd=new FixtureDef();fd.shape=s;fd.restitution=e;Fixture f=b.createFixture(fd);f.setUserData(label);s.dispose();return b;
  }
  static Body ball(World w){
    BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.DynamicBody;bd.position.set(W-.025f*S,.02f*S+BALL_R);Body b=w.createBody(bd);
    CircleShape s=new CircleShape();s.setRadius(BALL_R);FixtureDef f=new FixtureDef();f.shape=s;f.density=DENSITY;f.friction=.4f;f.restitution=0;Fixture fx=b.createFixture(f);fx.setUserData("ball");s.dispose();
    b.setBullet(true);b.setUserData("ball");return b;
  }
  static void resetBall(Body b){b.setLinearVelocity(0,0);b.setAngularVelocity(0);b.setTransform(W-.025f*S,.02f*S+BALL_R,0);b.setAwake(true);}

  static void bounds(World w){
    Body ground=staticBox(w,W/2,.005f*S,W/2,.005f*S,.56f,"ground");for(Fixture f:ground.getFixtureList())f.setRestitution(.2f);
    staticBox(w,W/2,.005f*S,W/2,H-.005f*S,.56f,"ceiling");
    staticBox(w,.005f*S,H/2,.005f*S,H/2,.56f,"left-wall");
    staticBox(w,.005f*S,H/2,W-.005f*S,H/2,.56f,"right-wall");
    staticBox(w,.005f*S,(H-.30f*S)/2,W-.04f*S-.005f*S,(H-.30f*S)/2,.56f,"plunger-tube");
    staticPoly(w,new Vector2[]{new Vector2(0,0),new Vector2(.2f*S,0),new Vector2(.2f*S,.05f*S),new Vector2(0,.2f*S)},0,.15f*S,.56f,"bottom-left");
    staticPoly(w,new Vector2[]{new Vector2(0,0),new Vector2(0,-.015f*S),new Vector2(.02f*S,-.015f*S)},.2f*S,.2f*S,.56f,"left-flipper-corner");
    staticPoly(w,new Vector2[]{new Vector2(0,0),new Vector2(0,.2f*S),new Vector2(-.2f*S,.05f*S),new Vector2(-.2f*S,0)},W-.04f*S,.15f*S,.56f,"bottom-right");
    staticPoly(w,new Vector2[]{new Vector2(0,0),new Vector2(-.02f*S,-.015f*S),new Vector2(0,-.015f*S)},W-.04f*S-.2f*S,.2f*S,.56f,"right-flipper-corner");
    for(boolean left:new boolean[]{false,true}){
      BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.StaticBody;bd.position.set(left?0:W,H);Body b=w.createBody(bd);if(left)b.setTransform(new Vector2(0,H),90*MathUtils.degreesToRadians);
      Vector2 center=new Vector2(-.30f*S,-.30f*S),base=new Vector2(.30f*S-.005f*S,0);PolygonShape ps=new PolygonShape();
      for(int i=0;i<30;i++){float deg=i*(90f/29f);Vector2 p=new Vector2(base).rotate(deg).add(center);ps.setAsBox(.005f*S,.02f*S,p,deg*MathUtils.degreesToRadians);FixtureDef fd=new FixtureDef();fd.shape=ps;fd.restitution=.56f;Fixture fx=b.createFixture(fd);fx.setUserData((left?"top-left-":"top-right-")+i);} ps.dispose();
    }
  }

  static Body bumper(World w,int id,float x,float y,float r){Body b=staticCircle(w,r*S,x*S,y*S,.56f,"bumper:"+id);b.setUserData("bumper:"+id);return b;}
  static void obstacle(World w,int id,float x,float y,float[][] vv){Vector2[] p=new Vector2[vv.length];for(int i=0;i<vv.length;i++)p[i]=new Vector2(vv[i][0]*S,vv[i][1]*S);staticPoly(w,p,x*S,y*S,.56f,"obstacle:"+id);}

  static Body slingshot(World w,int id,float x,float y,float ax,float ay,float bx,float by){
    Vector2 pos=new Vector2(x*S,y*S),A=new Vector2(ax*S,ay*S),B=new Vector2(bx*S,by*S);
    BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.StaticBody;bd.position.set(pos);Body body=w.createBody(bd), reactive=w.createBody(bd);
    Vector2 AB=B.cpy().sub(A),rotAB=AB.cpy().rotate(90).nor().scl(SLING_R);
    Vector2[] rpts={A.cpy().sub(rotAB),B.cpy().sub(rotAB),B.cpy().add(rotAB),A.cpy().add(rotAB)};
    PolygonShape ps=new PolygonShape();FixtureDef fd=new FixtureDef();fd.density=DENSITY;fd.restitution=.56f;ps.set(rpts);fd.shape=ps;Fixture rf=reactive.createFixture(fd);rf.setUserData("sling-reactive:"+id);
    Vector2 CB=B.cpy(), rr=CB.cpy().rotate(90).nor().scl(SLING_R);Vector2[] cb={new Vector2().sub(rr),B.cpy().sub(rr),B.cpy().add(rr),new Vector2().add(rr)};ps.set(cb);Fixture fcb=body.createFixture(fd);fcb.setUserData("sling-side:"+id);
    Vector2 CA=A.cpy();rr=CA.cpy().rotate(90).nor().scl(SLING_R);Vector2[] ca={new Vector2().sub(rr),A.cpy().sub(rr),A.cpy().add(rr),new Vector2().add(rr)};ps.set(ca);Fixture fca=body.createFixture(fd);fca.setUserData("sling-side:"+id);ps.dispose();
    for(int k=0;k<3;k++){CircleShape cs=new CircleShape();cs.setRadius(SLING_R);if(k==1)cs.setPosition(A);if(k==2)cs.setPosition(B);fd.shape=cs;Fixture cf=body.createFixture(fd);cf.setUserData("sling-corner:"+id);cs.dispose();}
    reactive.setUserData("sling-reactive:"+id);body.setUserData("sling:"+id);return reactive;
  }

  static Body[] flipper(World w,boolean left){
    final float BIG=.02f*S,SMALL=.01f*S,L=.11f*S;Vector2 pos=new Vector2((left?.226f:.494f)*S,.156f*S);float signedL=left?L:-L,big=left?BIG:-BIG,small=left?SMALL:-SMALL;
    BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.DynamicBody;bd.position.set(pos);Body fl=w.createBody(bd);fl.setUserData(left?"flipper-left":"flipper-right");FixtureDef fd=new FixtureDef();fd.density=.56f*10;fd.restitution=.56f;
    CircleShape c0=new CircleShape();c0.setRadius(BIG);fd.shape=c0;Fixture f0=fl.createFixture(fd);f0.setUserData((left?"flipper-left":"flipper-right")+":pivot");c0.dispose();
    CircleShape c1=new CircleShape();c1.setRadius(SMALL);c1.setPosition(new Vector2(signedL,0));fd.shape=c1;Fixture f1=fl.createFixture(fd);f1.setUserData((left?"flipper-left":"flipper-right")+":tip");c1.dispose();
    PolygonShape ps=new PolygonShape();ps.set(new Vector2[]{new Vector2(0,-big),new Vector2(signedL,-small),new Vector2(signedL,small),new Vector2(0,big)});fd.shape=ps;Fixture fp=fl.createFixture(fd);fp.setUserData((left?"flipper-left":"flipper-right")+":poly");ps.dispose();fl.setSleepingAllowed(false);fl.setBullet(true);
    float angle=(float)Math.atan2(left?-3f:3f,4f);fl.setTransform(pos,angle);BodyDef ad=new BodyDef();ad.type=BodyDef.BodyType.StaticBody;ad.position.set(pos);Body anchor=w.createBody(ad);CircleShape ac=new CircleShape();ac.setRadius(SMALL);Fixture af=anchor.createFixture(ac,0);af.setUserData((left?"flipper-left":"flipper-right")+":anchor");ac.dispose();
    RevoluteJointDef jd=new RevoluteJointDef();jd.bodyA=fl;jd.bodyB=anchor;jd.collideConnected=false;jd.localAnchorA.set(0,0);jd.localAnchorB.set(0,0);jd.referenceAngle=-angle;jd.enableLimit=true;jd.lowerAngle=(left?-90f:0f)*MathUtils.degreesToRadians;jd.upperAngle=(left?0f:90f)*MathUtils.degreesToRadians;w.createJoint(jd);return new Body[]{fl,anchor};
  }

  static Fixture drain(World w){BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.StaticBody;bd.position.set(.35f*S,.02f*S);Body b=w.createBody(bd);PolygonShape s=new PolygonShape();s.setAsBox(.35f*S,.02f*S);FixtureDef fd=new FixtureDef();fd.shape=s;fd.isSensor=true;Fixture f=b.createFixture(fd);f.setUserData("drain");s.dispose();return f;}
  static String fixtureLabel(Fixture f){Object o=f.getUserData();return o==null?"unlabeled":String.valueOf(o);}
  static String labelOther(Contact c,Body body){Fixture f=c.getFixtureA().getBody()==body?c.getFixtureB():c.getFixtureA();return fixtureLabel(f);}
  static int idFrom(String label){int p=label.indexOf(':');if(p<0)return 0;try{return Integer.parseInt(label.substring(p+1));}catch(Exception e){return 0;}}
  static int scoreFor(int id){return id>=1&&id<=3?20:(id==4||id==5?5:0);}

  static boolean leftPressed(int age){int p=age%96;return (p>=42&&p<49)||(p>=72&&p<78);}
  static boolean rightPressed(int age){int p=age%96;return (p>=54&&p<61)||(p>=78&&p<84);}

  static void run(boolean eventsOnly){
    final World w=new World(new Vector2(0,G),true);bounds(w);
    final Map<Integer,Body> bumpers=new HashMap<Integer,Body>();bumpers.put(1,bumper(w,1,.25f,1.10f,.03f));bumpers.put(2,bumper(w,2,.45f,1.10f,.03f));bumpers.put(3,bumper(w,3,.35f,1.05f,.03f));
    final Map<Integer,Body> slings=new HashMap<Integer,Body>();slings.put(4,slingshot(w,4,.07f,.355f,.12f,-.09f,0,.10f));slings.put(5,slingshot(w,5,.65f,.355f,0,.10f,-.12f,-.09f));slings.put(9,slingshot(w,9,.35f,.54f,0,.08f,-.08f,0));slings.put(10,slingshot(w,10,.35f,.54f,.08f,0,0,.08f));
    obstacle(w,6,.65f,1.0f,new float[][]{{0,0},{0,.15f},{-.12f,-.09f}});obstacle(w,7,.07f,1.0f,new float[][]{{0,0},{.12f,-.09f},{0,.15f}});obstacle(w,8,.35f,.5f,new float[][]{{.08f,.04f},{-.08f,.04f},{0,-.04f}});
    final Body[] lf=flipper(w,true),rf=flipper(w,false);final Body left=lf[0],right=rf[0],b=ball(w);final Fixture drain=drain(w);final RunState rs=new RunState();
    w.setContactListener(new ContactListener(){
      public void beginContact(Contact c){Body ba=c.getFixtureA().getBody(),bb=c.getFixtureB().getBody();if(ba==b||bb==b){String lab=labelOther(c,b);rs.event("CONTACT_BEGIN",lab,idFrom(lab),0);if(c.getFixtureA()==drain||c.getFixtureB()==drain){if(!rs.down){rs.down=true;rs.drainFrame=rs.frame;if(rs.plunged)rs.ballsPlayed++;rs.event("DRAIN","drain",0,rs.ballNumber);rs.plunged=false;}}return;}if(ba==left||bb==left){Fixture sf=ba==left?c.getFixtureA():c.getFixtureB();String lab=labelOther(c,left);rs.event("FLIPPER_CONTACT_BEGIN",fixtureLabel(sf)+"-vs-"+lab,0,0);}else if(ba==right||bb==right){Fixture sf=ba==right?c.getFixtureA():c.getFixtureB();String lab=labelOther(c,right);rs.event("FLIPPER_CONTACT_BEGIN",fixtureLabel(sf)+"-vs-"+lab,0,0);}}
      public void endContact(Contact c){Body ba=c.getFixtureA().getBody(),bb=c.getFixtureB().getBody();if(ba!=b&&bb!=b){if(ba==left||bb==left){Fixture sf=ba==left?c.getFixtureA():c.getFixtureB();String lab=labelOther(c,left);rs.event("FLIPPER_CONTACT_END",fixtureLabel(sf)+"-vs-"+lab,0,0);}else if(ba==right||bb==right){Fixture sf=ba==right?c.getFixtureA():c.getFixtureB();String lab=labelOther(c,right);rs.event("FLIPPER_CONTACT_END",fixtureLabel(sf)+"-vs-"+lab,0,0);}return;}String lab=labelOther(c,b);rs.event("CONTACT_END",lab,idFrom(lab),0);int id=idFrom(lab);
        if(lab.startsWith("bumper:")){Body bp=bumpers.get(id);Vector2 n=new Vector2(b.getPosition()).sub(bp.getPosition()).nor();b.applyForceToCenter(n.scl(BUMPER_FORCE),true);int val=scoreFor(id);rs.score+=val;rs.event("HIT",lab,id,val);}
        else if(lab.startsWith("sling-reactive:")){Body sb=slings.get(id); // derive historical normal from table definitions
          Vector2 n;if(id==4)n=new Vector2(-.12f,.19f).rotate(-90).nor();else if(id==5)n=new Vector2(-.12f,-.19f).rotate(-90).nor();else if(id==9)n=new Vector2(-.08f,-.08f).rotate(-90).nor();else n=new Vector2(-.08f,.08f).rotate(-90).nor();
          b.applyForceToCenter(n.scl(BUMPER_FORCE),true);int val=scoreFor(id);rs.score+=val;rs.event("HIT",lab,id,val);}
      }
      public void preSolve(Contact c,Manifold m){if(detailContacts && rs.frame>=132 && rs.frame<=134 && (c.getFixtureA().getBody()==b||c.getFixtureB().getBody()==b)){String lab=labelOther(c,b);if(lab.equals("obstacle:7")){WorldManifold wm=c.getWorldManifold();System.err.printf(Locale.US,"FULLPRE,%d,%d,%.9f,%.9f,BC,%.9f,%.9f,BV,%.9f,%.9f,BO,%.9f,M,%.9f,I,%.9f",rs.frame,wm.getNumberOfContactPoints(),wm.getNormal().x,wm.getNormal().y,b.getWorldCenter().x/S,b.getWorldCenter().y/S,b.getLinearVelocity().x/S,b.getLinearVelocity().y/S,b.getAngularVelocity(),b.getMass(),b.getInertia());for(int k=0;k<wm.getNumberOfContactPoints();k++)System.err.printf(Locale.US,",%.9f,%.9f",wm.getPoints()[k].x/S,wm.getPoints()[k].y/S);System.err.println();}}}
      public void postSolve(Contact c,ContactImpulse i){if(detailContacts && rs.frame>=132 && rs.frame<=134 && (c.getFixtureA().getBody()==b||c.getFixtureB().getBody()==b)){String lab=labelOther(c,b);if(lab.equals("obstacle:7")){WorldManifold wm=c.getWorldManifold();float[] ni=i.getNormalImpulses(),ti=i.getTangentImpulses();System.err.printf(Locale.US,"FULLPOST,%d,%d,%.9f,%.9f",rs.frame,i.getCount(),wm.getNormal().x,wm.getNormal().y);for(int k=0;k<i.getCount();k++)System.err.printf(Locale.US,",%.9f,%.9f,%.9f,%.9f",wm.getPoints()[k].x/S,wm.getPoints()[k].y/S,ni[k]/S,ti[k]/S);System.err.println();}}}
    });

    if(eventsOnly)System.out.println("frame,seq,event,label,id,value,score");else if(detailState)System.out.println("frame,t,ball,x,y,vx,vy,ballOmega,leftAngle,leftOmega,rightAngle,rightOmega,score,plunged,down");else System.out.println("frame,t,ball,x,y,vx,vy,leftAngle,leftOmega,rightAngle,rightOmega,score,plunged,down");
    for(int frame=0;frame<MAX_FRAMES;frame++){
      rs.frame=frame;rs.seq=0;
      if(rs.down){
        if(rs.ballsPlayed>=3 && frame-rs.drainFrame>=12)break;
        if(rs.ballsPlayed<3 && frame-rs.drainFrame==12){resetBall(b);rs.down=false;rs.ballNumber=rs.ballsPlayed+1;rs.resetFrame=frame;rs.event("RESET","ball",0,rs.ballNumber);}
      }
      if(!rs.down&&!rs.plunged&&frame-rs.resetFrame>=12){float impulse=b.getMass()*Math.abs(-9.81f*S)*2f*.1f;b.applyLinearImpulse(0,impulse,b.getWorldCenter().x,b.getWorldCenter().y,true);rs.plunged=true;rs.plungeFrame=frame;rs.event("PLUNGE","ball",0,rs.ballNumber);}
      int age=rs.plunged?frame-rs.plungeFrame:-1;boolean lp=age>=0&&leftPressed(age),rp=age>=0&&rightPressed(age);left.setAngularVelocity(lp?50f:-15f);right.setAngularVelocity(rp?-50f:15f);
      w.step(DT,6,2);
      if(!eventsOnly){Vector2 p=b.getPosition(),vel=b.getLinearVelocity();if(detailState)System.out.printf(Locale.US,"%d,%.9f,%d,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%d,%d,%d%n",frame,(frame+1)*DT,rs.ballNumber,p.x/S,p.y/S,vel.x/S,vel.y/S,b.getAngularVelocity(),left.getAngle(),left.getAngularVelocity(),right.getAngle(),right.getAngularVelocity(),rs.score,rs.plunged?1:0,rs.down?1:0);else System.out.printf(Locale.US,"%d,%.9f,%d,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%d,%d,%d%n",frame,(frame+1)*DT,rs.ballNumber,p.x/S,p.y/S,vel.x/S,vel.y/S,left.getAngle(),left.getAngularVelocity(),right.getAngle(),right.getAngularVelocity(),rs.score,rs.plunged?1:0,rs.down?1:0);}
      if(eventsOnly){for(Event e:rs.events)if(e.frame==frame)System.out.printf(Locale.US,"%d,%d,%s,%s,%d,%d,%d%n",e.frame,e.seq,e.type,e.label,e.id,e.value,e.score);}
    }
    w.dispose();
  }
  public static void main(String[] args){GdxNativesLoader.load();String mode=args.length==0?"state":args[0];detailState=mode.equals("detail")||mode.equals("detail-contacts");detailContacts=mode.equals("detail-contacts");run(mode.equals("events"));}
}
