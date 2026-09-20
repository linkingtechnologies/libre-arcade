import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import java.util.*;

/** M9 diagnostic oracle for the frame-380 obstacle:8 TOI. */
public class Obstacle8Oracle {
  static final float DT=1f/60f, S=CometFullTableOracle.S;
  static final float X=.437566608f,Y=.510228634f,VX=-1.218472242f,VY=.267061323f,OMEGA=20.670352936f;
  static String lab(Fixture f){Object o=f.getUserData();return o==null?"unlabeled":String.valueOf(o);}
  static Fixture other(Contact c,Body b){return c.getFixtureA().getBody()==b?c.getFixtureB():c.getFixtureA();}
  static void state(String tag,Body b){Vector2 p=b.getPosition(),v=b.getLinearVelocity();System.out.printf(Locale.US,"STATE,%s,%.9f,%.9f,%.9f,%.9f,%.9f%n",tag,p.x/S,p.y/S,v.x/S,v.y/S,b.getAngularVelocity());}
  static void run(boolean continuous){
    final World w=new World(new Vector2(0,CometFullTableOracle.G),true);w.setContinuousPhysics(continuous);
    Vector2[] p={new Vector2(.08f*S,.04f*S),new Vector2(-.08f*S,.04f*S),new Vector2(0,-.04f*S)};
    CometFullTableOracle.staticPoly(w,p,.35f*S,.5f*S,.56f,"obstacle:8");final Body ball=CometFullTableOracle.ball(w);
    ball.setTransform(X*S,Y*S,0);ball.setLinearVelocity(VX*S,VY*S);ball.setAngularVelocity(OMEGA);final int[] seq={0};
    w.setContactListener(new ContactListener(){boolean ours(Contact c){return c.getFixtureA().getBody()==ball||c.getFixtureB().getBody()==ball;}
      void manifold(String kind,Contact c){if(!ours(c))return;WorldManifold wm=c.getWorldManifold();System.out.printf(Locale.US,"%s,%d,%s,%d,%.9f,%.9f",kind,seq[0]++,lab(other(c,ball)),wm.getNumberOfContactPoints(),wm.getNormal().x,wm.getNormal().y);for(int i=0;i<wm.getNumberOfContactPoints();i++)System.out.printf(Locale.US,",%.9f,%.9f",wm.getPoints()[i].x/S,wm.getPoints()[i].y/S);System.out.println();}
      public void beginContact(Contact c){manifold("BEGIN",c);}public void endContact(Contact c){manifold("END",c);}public void preSolve(Contact c,Manifold m){manifold("PRE",c);}
      public void postSolve(Contact c,ContactImpulse imp){if(!ours(c))return;WorldManifold wm=c.getWorldManifold();float[] ni=imp.getNormalImpulses(),ti=imp.getTangentImpulses();System.out.printf(Locale.US,"POST,%d,%s,%d,%.9f,%.9f",seq[0]++,lab(other(c,ball)),imp.getCount(),wm.getNormal().x,wm.getNormal().y);for(int i=0;i<imp.getCount();i++)System.out.printf(Locale.US,",%.9f,%.9f,%.9f,%.9f",wm.getPoints()[i].x/S,wm.getPoints()[i].y/S,ni[i]/S,ti[i]/S);System.out.println();}
    });
    state("before",ball);w.step(DT,6,2);state("after",ball);w.dispose();
  }
  public static void main(String[] args){GdxNativesLoader.load();run(args.length==0||!args[0].equals("discrete"));}
}
