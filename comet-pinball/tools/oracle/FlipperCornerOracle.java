import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import java.util.*;

public class FlipperCornerOracle {
  static final float DT=1f/60f;
  static void run(boolean contacts){
    World w=new World(new Vector2(0,CometFullTableOracle.G),true);
    CometFullTableOracle.staticPoly(w,new Vector2[]{new Vector2(0,0),new Vector2(0,-.015f*CometFullTableOracle.S),new Vector2(.02f*CometFullTableOracle.S,-.015f*CometFullTableOracle.S)},.2f*CometFullTableOracle.S,.2f*CometFullTableOracle.S,.56f,"left-flipper-corner");
    Body fl=CometFullTableOracle.flipper(w,true)[0]; final int[] frame={-1};
    if(contacts){
      w.setContactListener(new ContactListener(){public void beginContact(Contact c){} public void endContact(Contact c){} public void preSolve(Contact c,Manifold m){}
        public void postSolve(Contact c,ContactImpulse impulse){if(c.getFixtureA().getBody()!=fl&&c.getFixtureB().getBody()!=fl)return;Fixture ff=c.getFixtureA().getBody()==fl?c.getFixtureA():c.getFixtureB();WorldManifold wm=c.getWorldManifold();float[] ni=impulse.getNormalImpulses(),ti=impulse.getTangentImpulses();for(int k=0;k<impulse.getCount();k++)System.out.printf(Locale.US,"%d,%s,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f%n",frame[0],CometFullTableOracle.fixtureLabel(ff),wm.getNormal().x,wm.getNormal().y,wm.getPoints()[k].x/CometFullTableOracle.S,wm.getPoints()[k].y/CometFullTableOracle.S,ni[k]/CometFullTableOracle.S,ti[k]/CometFullTableOracle.S);}});
      System.out.println("frame,fixture,nx,ny,px,py,normalImpulseScaled,tangentImpulseScaled");
    } else System.out.println("frame,t,x,y,vx,vy,angle,omega");
    for(int i=0;i<180;i++){frame[0]=i;int age=i-12;boolean pressed=age>=0&&CometFullTableOracle.leftPressed(age);fl.setAngularVelocity(pressed?50f:-15f);w.step(DT,6,2);if(!contacts){Vector2 p=fl.getPosition(),v=fl.getLinearVelocity();System.out.printf(Locale.US,"%d,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f%n",i,(i+1)*DT,p.x/CometFullTableOracle.S,p.y/CometFullTableOracle.S,v.x/CometFullTableOracle.S,v.y/CometFullTableOracle.S,fl.getAngle(),fl.getAngularVelocity());}}
    w.dispose();
  }
  public static void main(String[] args){GdxNativesLoader.load();run(args.length>0&&args[0].equals("contacts"));}
}
