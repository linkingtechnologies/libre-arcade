import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import java.util.*;

/** M9 diagnostic oracle for the frame-402 ball/right-flipper dynamic TOI island. */
public class RightFlipperPolygonOracle {
  static final float DT=1f/60f,S=CometFullTableOracle.S;
  static final float X=.462830603f,Y=.174509019f,VX=-.033199094f,VY=-.321397036f,OMEGA=3.805425406f,A=.678407848f;
  static String lab(Fixture f){Object o=f.getUserData();return o==null?"unlabeled":String.valueOf(o);}
  static Fixture other(Contact c,Body b){return c.getFixtureA().getBody()==b?c.getFixtureB():c.getFixtureA();}
  static void dump(String tag,Body b,Body f){Vector2 p=b.getPosition(),v=b.getLinearVelocity();System.out.printf(Locale.US,"STATE,%s,B,%.9f,%.9f,%.9f,%.9f,%.9f,F,%.9f,%.9f%n",tag,p.x/S,p.y/S,v.x/S,v.y/S,b.getAngularVelocity(),f.getAngle(),f.getAngularVelocity());}
  public static void main(String[] args){
    GdxNativesLoader.load();final World w=new World(new Vector2(0,CometFullTableOracle.G),true);Body[] rr=CometFullTableOracle.flipper(w,false);final Body f=rr[0],b=CometFullTableOracle.ball(w);
    f.setTransform(new Vector2(.494f*S,.156f*S),A);f.setLinearVelocity(0,0);f.setAngularVelocity(15f);b.setTransform(X*S,Y*S,0);b.setLinearVelocity(VX*S,VY*S);b.setAngularVelocity(OMEGA);final int[] seq={0};
    w.setContactListener(new ContactListener(){boolean ours(Contact c){return c.getFixtureA().getBody()==b||c.getFixtureB().getBody()==b;}
      void manifold(String kind,Contact c){if(!ours(c))return;WorldManifold wm=c.getWorldManifold();System.out.printf(Locale.US,"%s,%d,%s,%d,%.9f,%.9f",kind,seq[0]++,lab(other(c,b)),wm.getNumberOfContactPoints(),wm.getNormal().x,wm.getNormal().y);for(int i=0;i<wm.getNumberOfContactPoints();i++)System.out.printf(Locale.US,",%.9f,%.9f",wm.getPoints()[i].x/S,wm.getPoints()[i].y/S);System.out.println();}
      public void beginContact(Contact c){manifold("BEGIN",c);}public void endContact(Contact c){manifold("END",c);}public void preSolve(Contact c,Manifold m){manifold("PRE",c);}
      public void postSolve(Contact c,ContactImpulse imp){if(!ours(c))return;WorldManifold wm=c.getWorldManifold();float[] ni=imp.getNormalImpulses(),ti=imp.getTangentImpulses();System.out.printf(Locale.US,"POST,%d,%s,%d,%.9f,%.9f",seq[0]++,lab(other(c,b)),imp.getCount(),wm.getNormal().x,wm.getNormal().y);for(int i=0;i<imp.getCount();i++)System.out.printf(Locale.US,",%.9f,%.9f,%.9f,%.9f",wm.getPoints()[i].x/S,wm.getPoints()[i].y/S,ni[i]/S,ti[i]/S);System.out.println();}
    });dump("before",b,f);w.step(DT,6,2);dump("after",b,f);w.dispose();
  }
}
