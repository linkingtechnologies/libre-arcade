import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import java.util.*;

/** M8 diagnostic oracle for the left flipper / fixed lower-corner CCD contact. */
public class FlipperCornerDetailOracle {
  static final float DT=1f/60f;
  static void run(final boolean continuous, final boolean withCorner){
    final World w=new World(new Vector2(0,CometFullTableOracle.G),true);
    w.setContinuousPhysics(continuous);
    final Body corner=withCorner ? CometFullTableOracle.staticPoly(w,new Vector2[]{new Vector2(0,0),new Vector2(0,-.015f*CometFullTableOracle.S),new Vector2(.02f*CometFullTableOracle.S,-.015f*CometFullTableOracle.S)},.2f*CometFullTableOracle.S,.2f*CometFullTableOracle.S,.56f,"left-flipper-corner") : null;
    final Body fl=CometFullTableOracle.flipper(w,true)[0];
    final int[] frame={-1}, postCount={0};
    w.setContactListener(new ContactListener(){
      public void beginContact(Contact c){}
      public void endContact(Contact c){}
      public void preSolve(Contact c,Manifold old){
        if(frame[0] < 54 || frame[0] > 61) return;
        if(c.getFixtureA().getBody()!=fl && c.getFixtureB().getBody()!=fl) return;
        WorldManifold wm=c.getWorldManifold();
        int count=wm.getNumberOfContactPoints();
        System.err.printf(Locale.US,"PRE,%d,%d,%.9f,%.9f",frame[0],count,wm.getNormal().x,wm.getNormal().y);
        for(int k=0;k<count;k++) System.err.printf(Locale.US,",%.9f,%.9f",wm.getPoints()[k].x/CometFullTableOracle.S,wm.getPoints()[k].y/CometFullTableOracle.S);
        System.err.println();
      }
      public void postSolve(Contact c,ContactImpulse impulse){
        if(frame[0] < 54 || frame[0] > 61) return;
        if(c.getFixtureA().getBody()!=fl && c.getFixtureB().getBody()!=fl) return;
        postCount[0]++;
        WorldManifold wm=c.getWorldManifold();
        float[] ni=impulse.getNormalImpulses(),ti=impulse.getTangentImpulses();
        System.err.printf(Locale.US,"POST,%d,%d,%d,%.9f,%.9f",frame[0],postCount[0],impulse.getCount(),wm.getNormal().x,wm.getNormal().y);
        for(int k=0;k<impulse.getCount();k++) System.err.printf(Locale.US,",%.9f,%.9f,%.9f,%.9f",wm.getPoints()[k].x/CometFullTableOracle.S,wm.getPoints()[k].y/CometFullTableOracle.S,ni[k]/CometFullTableOracle.S,ti[k]/CometFullTableOracle.S);
        System.err.println();
      }
    });
    System.out.println("phase,frame,x,y,comx,comy,vx,vy,angle,omega,localcx,localcy");
    for(int i=0;i<70;i++){
      frame[0]=i;postCount[0]=0;
      int age=i-12;boolean pressed=age>=0&&CometFullTableOracle.leftPressed(age);
      fl.setAngularVelocity(pressed?50f:-15f);
      dump("before",i,fl);
      w.step(DT,6,2);
      dump("after",i,fl);
    }
    w.dispose();
  }
  static void dump(String phase,int frame,Body fl){
    Vector2 p=fl.getPosition(),c=fl.getWorldCenter(),v=fl.getLinearVelocity(),lc=fl.getLocalCenter();
    System.out.printf(Locale.US,"%s,%d,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f,%.9f%n",phase,frame,p.x/CometFullTableOracle.S,p.y/CometFullTableOracle.S,c.x/CometFullTableOracle.S,c.y/CometFullTableOracle.S,v.x/CometFullTableOracle.S,v.y/CometFullTableOracle.S,fl.getAngle(),fl.getAngularVelocity(),lc.x/CometFullTableOracle.S,lc.y/CometFullTableOracle.S);
  }
  public static void main(String[] args){GdxNativesLoader.load();boolean continuous=args.length==0||!args[0].equals("discrete");boolean withCorner=args.length<2||!args[1].equals("nocorner");run(continuous,withCorner);}
}
