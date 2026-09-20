import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import com.badlogic.gdx.physics.box2d.joints.RevoluteJointDef;
import java.util.*;

public class CometBox2DOracle {
  static final float S=10f, W=.76f*S, H=1.40f*S;
  static final float BALL_R=.0135f*S, STEEL_E=.56f, DENSITY=8000f/(S*S*S);
  static final float G=-9.81f*S*(float)Math.sin(Math.toRadians(7));
  static final float BUMPER_FORCE=20f*S;
  static final float DT=1f/60f;

  static Body staticBox(World w,float hx,float hy,float x,float y,float e){
    BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.StaticBody;bd.position.set(x,y);Body b=w.createBody(bd);
    PolygonShape s=new PolygonShape();s.setAsBox(hx,hy);FixtureDef f=new FixtureDef();f.shape=s;f.restitution=e;b.createFixture(f);s.dispose();return b;
  }
  static Body staticPoly(World w,Vector2[] pts,float x,float y,float e){
    BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.StaticBody;bd.position.set(x,y);Body b=w.createBody(bd);
    PolygonShape s=new PolygonShape();s.set(pts);FixtureDef f=new FixtureDef();f.shape=s;f.restitution=e;b.createFixture(f);s.dispose();return b;
  }
  static Body ball(World w,float x,float y,float vx,float vy){
    BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.DynamicBody;bd.position.set(x*S,y*S);Body b=w.createBody(bd);
    CircleShape s=new CircleShape();s.setRadius(BALL_R);FixtureDef f=new FixtureDef();f.shape=s;f.density=DENSITY;f.friction=.4f;f.restitution=0;b.createFixture(f);s.dispose();
    b.setBullet(true);b.setUserData("ball");b.setLinearVelocity(vx*S,vy*S);return b;
  }
  static void bounds(World w){
    Body ground=staticBox(w,W/2,.005f*S,W/2,.005f*S,.56f);for(Fixture f:ground.getFixtureList())f.setRestitution(.2f);
    staticBox(w,W/2,.005f*S,W/2,H-.005f*S,.56f);
    staticBox(w,.005f*S,H/2,.005f*S,H/2,.56f);
    staticBox(w,.005f*S,H/2,W-.005f*S,H/2,.56f);
    staticBox(w,.005f*S,(H-.30f*S)/2,W-.04f*S-.005f*S,(H-.30f*S)/2,.56f);
    // lower geometry
    staticPoly(w,new Vector2[]{new Vector2(0,0),new Vector2(.2f*S,0),new Vector2(.2f*S,.05f*S),new Vector2(0,.2f*S)},0,.15f*S,.56f);
    staticPoly(w,new Vector2[]{new Vector2(0,0),new Vector2(0,-.015f*S),new Vector2(.02f*S,-.015f*S)},.2f*S,.2f*S,.56f);
    staticPoly(w,new Vector2[]{new Vector2(0,0),new Vector2(0,.2f*S),new Vector2(-.2f*S,.05f*S),new Vector2(-.2f*S,0)},W-.04f*S,.15f*S,.56f);
    staticPoly(w,new Vector2[]{new Vector2(0,0),new Vector2(-.02f*S,-.015f*S),new Vector2(0,-.015f*S)},W-.04f*S-.2f*S,.2f*S,.56f);
    // top curves
    for(boolean left:new boolean[]{false,true}){
      BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.StaticBody;bd.position.set(left?0:W,H);Body b=w.createBody(bd);
      if(left)b.setTransform(new Vector2(0,H),90*MathUtils.degreesToRadians);
      Vector2 center=new Vector2(-.30f*S,-.30f*S), base=new Vector2(.30f*S-.005f*S,0);
      PolygonShape ps=new PolygonShape();
      for(int i=0;i<30;i++){
        float deg=i*(90f/29f);Vector2 p=new Vector2(base).rotate(deg).add(center);
        ps.setAsBox(.005f*S,.02f*S,p,deg*MathUtils.degreesToRadians);FixtureDef fd=new FixtureDef();fd.shape=ps;fd.restitution=.56f;b.createFixture(fd);
      } ps.dispose();
    }
  }
  static Body bumper(World w,float x,float y,float r){
    BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.StaticBody;bd.position.set(x*S,y*S);Body b=w.createBody(bd);b.setUserData("bumper");
    CircleShape s=new CircleShape();s.setRadius(r*S);FixtureDef f=new FixtureDef();f.shape=s;f.restitution=.56f;b.createFixture(f);s.dispose();return b;
  }
  static Body[] leftFlipper(World w){
    final float BIG=.02f*S,SMALL=.01f*S,L=.11f*S;Vector2 pos=new Vector2(.226f*S,.156f*S);
    BodyDef bd=new BodyDef();bd.type=BodyDef.BodyType.DynamicBody;bd.position.set(pos);Body fl=w.createBody(bd);fl.setUserData("flipper");
    FixtureDef fd=new FixtureDef();fd.density=.56f*10;fd.restitution=.56f;
    CircleShape c0=new CircleShape();c0.setRadius(BIG);fd.shape=c0;fl.createFixture(fd);c0.dispose();
    CircleShape c1=new CircleShape();c1.setRadius(SMALL);c1.setPosition(new Vector2(L,0));fd.shape=c1;fl.createFixture(fd);c1.dispose();
    PolygonShape ps=new PolygonShape();ps.set(new Vector2[]{new Vector2(0,-BIG),new Vector2(L,-SMALL),new Vector2(L,SMALL),new Vector2(0,BIG)});fd.shape=ps;fl.createFixture(fd);ps.dispose();
    fl.setSleepingAllowed(false);fl.setBullet(true);
    float angle=(float)Math.atan2(-3,4);fl.setTransform(pos,angle);
    BodyDef ad=new BodyDef();ad.type=BodyDef.BodyType.StaticBody;ad.position.set(pos);Body anchor=w.createBody(ad);CircleShape ac=new CircleShape();ac.setRadius(SMALL);anchor.createFixture(ac,0);ac.dispose();
    RevoluteJointDef jd=new RevoluteJointDef();jd.bodyA=fl;jd.bodyB=anchor;jd.collideConnected=false;jd.localAnchorA.set(0,0);jd.localAnchorB.set(0,0);jd.referenceAngle=-angle;jd.enableLimit=true;jd.lowerAngle=-90*MathUtils.degreesToRadians;jd.upperAngle=0;w.createJoint(jd);
    return new Body[]{fl,anchor};
  }
  static void printHeader(String name){System.out.println("# "+name);System.out.println("frame,t,x,y,vx,vy,angle,omega");}
  static void print(int i,Body b,Body fl){System.out.printf(Locale.US,"%d,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f%n",i,(i+1)*DT,b.getPosition().x/S,b.getPosition().y/S,b.getLinearVelocity().x/S,b.getLinearVelocity().y/S,fl==null?0:fl.getAngle(),fl==null?0:fl.getAngularVelocity());}
  static void printJoint(int i,Body fl){Vector2 lv=fl.getLinearVelocity();System.out.printf(Locale.US,"%d,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f%n",i,(i+1)*DT,fl.getPosition().x/S,fl.getPosition().y/S,lv.x/S,lv.y/S,fl.getAngle(),fl.getAngularVelocity());}

  static void freefall(){World w=new World(new Vector2(0,G),true);Body b=ball(w,.38f,.8f,0,0);printHeader("freefall");for(int i=0;i<60;i++){w.step(DT,6,2);print(i,b,null);}w.dispose();}
  static void launch(){World w=new World(new Vector2(0,G),true);bounds(w);Body b=ball(w,.735f,.0335f,0,0);printHeader("launch");
    // Let reset ball settle for 12 frames, then apply exact original impulse.
    for(int i=0;i<12;i++){w.step(DT,6,2);print(i,b,null);} float impulse=b.getMass()*Math.abs(-9.81f*S)*2f*.1f; b.applyLinearImpulse(0,impulse,b.getWorldCenter().x,b.getWorldCenter().y,true);
    for(int i=12;i<150;i++){w.step(DT,6,2);print(i,b,null);}w.dispose();}
  static void bumperScenario(){World w=new World(new Vector2(0,G),true);Body bp=bumper(w,.38f,.70f,.03f);Body b=ball(w,.38f,.55f,0,1.5f);final int[] ends={0};
    w.setContactListener(new ContactListener(){public void beginContact(Contact c){}public void preSolve(Contact c,Manifold m){}public void postSolve(Contact c,ContactImpulse i){}public void endContact(Contact c){Body a=c.getFixtureA().getBody(),bb=c.getFixtureB().getBody();if(a==bp||bb==bp){Body ballBody=a==bp?bb:a;Vector2 n=new Vector2(ballBody.getPosition()).sub(bp.getPosition()).nor();ballBody.applyForceToCenter(n.scl(BUMPER_FORCE),true);ends[0]++;}}});
    printHeader("bumper");for(int i=0;i<120;i++){w.step(DT,6,2);print(i,b,null);}System.out.println("# endContacts="+ends[0]);w.dispose();}

  static void flipperJointScenario(){World w=new World(new Vector2(0,G),true);Body[] fs=leftFlipper(w);Body fl=fs[0];printHeader("flipper-joint");
    for(int i=0;i<60;i++){boolean pressed=(i<10)||(i>=25&&i<35);fl.setAngularVelocity(pressed?50f:-15f);w.step(DT,6,2);printJoint(i,fl);}w.dispose();}
  static void flipperScenario(){World w=new World(new Vector2(0,G),true);Body[] fs=leftFlipper(w);Body fl=fs[0];Body b=ball(w,.307f,.115f,0,-.10f);printHeader("flipper");
    for(int i=0;i<45;i++){fl.setAngularVelocity(i<3?-15f:50f);w.step(DT,6,2);print(i,b,fl);}w.dispose();}

  static void flipperContactScenario(){
    World w=new World(new Vector2(0,G),true);Body[] fs=leftFlipper(w);Body fl=fs[0];Body b=ball(w,.307f,.115f,0,-.10f);final int[] frame={-1};
    w.setContactListener(new ContactListener(){
      public void beginContact(Contact c){}
      public void endContact(Contact c){}
      public void preSolve(Contact c,Manifold m){}
      public void postSolve(Contact c,ContactImpulse impulse){
        Body a=c.getFixtureA().getBody(),bb=c.getFixtureB().getBody();
        if(!((a==fl&&bb==b)||(a==b&&bb==fl)))return;
        WorldManifold wm=c.getWorldManifold(); Vector2 n=wm.getNormal(); Vector2[] pts=wm.getPoints();
        float[] ni=impulse.getNormalImpulses(),ti=impulse.getTangentImpulses(); int count=impulse.getCount();
        for(int k=0;k<count;k++){
          System.out.printf(Locale.US,"%d,%d,%s,%s,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f%n",frame[0],k,String.valueOf(a.getUserData()),String.valueOf(bb.getUserData()),n.x,n.y,pts[k].x/S,pts[k].y/S,ni[k]/S,ti[k]/S);
        }
      }
    });
    System.out.println("frame,point,bodyA,bodyB,nx,ny,px,py,normalImpulseScaled,tangentImpulseScaled");
    for(int i=0;i<12;i++){frame[0]=i;fl.setAngularVelocity(i<3?-15f:50f);w.step(DT,6,2);}w.dispose();
  }


  static int fixtureIndex(Body body, Fixture fixture){
    for(int i=0;i<body.getFixtureList().size();i++) if(body.getFixtureList().get(i)==fixture) return i;
    return -1;
  }
  static String fixtureType(Fixture f){ return String.valueOf(f.getShape().getType()); }

  static void flipperDetailScenario(){
    World w=new World(new Vector2(0,G),true);Body[] fs=leftFlipper(w);Body fl=fs[0];Body b=ball(w,.307f,.115f,0,-.10f);final int[] frame={-1},seq={0};
    w.setContactListener(new ContactListener(){
      public void beginContact(Contact c){} public void endContact(Contact c){} public void preSolve(Contact c,Manifold m){}
      public void postSolve(Contact c,ContactImpulse impulse){
        Body a=c.getFixtureA().getBody(),bb=c.getFixtureB().getBody(); if(!((a==fl&&bb==b)||(a==b&&bb==fl)))return;
        Fixture ff=a==fl?c.getFixtureA():c.getFixtureB(); WorldManifold wm=c.getWorldManifold(); Vector2 n=wm.getNormal(); Vector2[] pts=wm.getPoints();
        float[] ni=impulse.getNormalImpulses(),ti=impulse.getTangentImpulses();int count=impulse.getCount();
        for(int k=0;k<count;k++) System.out.printf(Locale.US,"%d,%d,%d,%s,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f%n",frame[0],seq[0]++,fixtureIndex(fl,ff),fixtureType(ff),n.x,n.y,pts[k].x/S,pts[k].y/S,ni[k]/S,ti[k]/S,fl.getAngle(),fl.getAngularVelocity());
      }
    });
    System.out.println("frame,seq,flipperFixture,fixtureType,nx,ny,px,py,normalImpulseScaled,tangentImpulseScaled,flipperAngle,flipperOmega");
    for(int i=0;i<12;i++){frame[0]=i;seq[0]=0;fl.setAngularVelocity(i<3?-15f:50f);w.step(DT,6,2);}
    w.dispose();
  }

  static void launchContactScenario(){
    World w=new World(new Vector2(0,G),true);bounds(w);Body b=ball(w,.735f,.0335f,0,0);final int[] frame={-1};
    w.setContactListener(new ContactListener(){
      public void beginContact(Contact c){}
      public void endContact(Contact c){}
      public void preSolve(Contact c,Manifold m){}
      public void postSolve(Contact c,ContactImpulse impulse){
        Body a=c.getFixtureA().getBody(),bb=c.getFixtureB().getBody(); if(a!=b&&bb!=b)return;
        WorldManifold wm=c.getWorldManifold();Vector2 n=wm.getNormal();Vector2[] pts=wm.getPoints();float[] ni=impulse.getNormalImpulses(),ti=impulse.getTangentImpulses();int count=impulse.getCount();
        for(int k=0;k<count;k++)System.out.printf(Locale.US,"%d,%d,%s,%s,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f%n",frame[0],k,String.valueOf(a.getUserData()),String.valueOf(bb.getUserData()),n.x,n.y,pts[k].x/S,pts[k].y/S,ni[k]/S,ti[k]/S);
      }
    });
    System.out.println("frame,point,bodyA,bodyB,nx,ny,px,py,normalImpulseScaled,tangentImpulseScaled");
    for(int i=0;i<12;i++){frame[0]=i;w.step(DT,6,2);}float impulse=b.getMass()*Math.abs(-9.81f*S)*2f*.1f;b.applyLinearImpulse(0,impulse,b.getWorldCenter().x,b.getWorldCenter().y,true);
    for(int i=12;i<150;i++){frame[0]=i;w.step(DT,6,2);}w.dispose();
  }
  public static void main(String[] args){GdxNativesLoader.load();String s=args.length==0?"freefall":args[0];if(s.equals("freefall"))freefall();else if(s.equals("launch"))launch();else if(s.equals("bumper"))bumperScenario();else if(s.equals("flipper"))flipperScenario();else if(s.equals("flipper-joint"))flipperJointScenario();else if(s.equals("flipper-contact"))flipperContactScenario();else if(s.equals("launch-contact"))launchContactScenario();else if(s.equals("flipper-detail"))flipperDetailScenario();else throw new RuntimeException(s);}
}
