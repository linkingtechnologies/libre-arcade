import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import java.util.*;

/** M8b diagnostic oracle: the first material ball trajectory boundary at obstacle:7. */
public class Obstacle7Oracle {
  static final float DT=1f/60f;
  // Exact end-of-frame 132 state measured from CometFullTableOracle detail mode.
  static final float X=.137904763f, Y=1.066450834f;
  static final float VX=-.487227350f, VY=-.842605710f, OMEGA=-25.418386459f;

  static void dump(String phase, Body b){
    Vector2 p=b.getPosition(),v=b.getLinearVelocity();
    System.out.printf(Locale.US,"STATE,%s,%.9f,%.9f,%.9f,%.9f,%.9f%n",
      phase,p.x/CometFullTableOracle.S,p.y/CometFullTableOracle.S,
      v.x/CometFullTableOracle.S,v.y/CometFullTableOracle.S,b.getAngularVelocity());
  }

  static void run(final boolean continuous){
    final World w=new World(new Vector2(0,CometFullTableOracle.G),true);
    w.setContinuousPhysics(continuous);
    Vector2[] p={
      new Vector2(0,0),
      new Vector2(.12f*CometFullTableOracle.S,-.09f*CometFullTableOracle.S),
      new Vector2(0,.15f*CometFullTableOracle.S)
    };
    final Body obstacle=CometFullTableOracle.staticPoly(w,p,.07f*CometFullTableOracle.S,1.0f*CometFullTableOracle.S,.56f,"obstacle:7");
    final Body ball=CometFullTableOracle.ball(w);
    ball.setTransform(X*CometFullTableOracle.S,Y*CometFullTableOracle.S,0);
    ball.setLinearVelocity(VX*CometFullTableOracle.S,VY*CometFullTableOracle.S);
    ball.setAngularVelocity(OMEGA);
    final int[] begin={0},end={0},pre={0},post={0};
    w.setContactListener(new ContactListener(){
      boolean ours(Contact c){return (c.getFixtureA().getBody()==ball&&c.getFixtureB().getBody()==obstacle)||(c.getFixtureB().getBody()==ball&&c.getFixtureA().getBody()==obstacle);}
      public void beginContact(Contact c){if(ours(c)){begin[0]++;System.out.printf(Locale.US,"BEGIN,%d%n",begin[0]);}}
      public void endContact(Contact c){if(ours(c)){end[0]++;System.out.printf(Locale.US,"END,%d%n",end[0]);}}
      public void preSolve(Contact c,Manifold old){if(!ours(c))return;pre[0]++;WorldManifold wm=c.getWorldManifold();int n=wm.getNumberOfContactPoints();System.out.printf(Locale.US,"PRE,%d,%d,%.9f,%.9f,BC,%.9f,%.9f,BV,%.9f,%.9f,BO,%.9f,M,%.9f,I,%.9f",pre[0],n,wm.getNormal().x,wm.getNormal().y,ball.getWorldCenter().x/CometFullTableOracle.S,ball.getWorldCenter().y/CometFullTableOracle.S,ball.getLinearVelocity().x/CometFullTableOracle.S,ball.getLinearVelocity().y/CometFullTableOracle.S,ball.getAngularVelocity(),ball.getMass(),ball.getInertia());for(int i=0;i<n;i++)System.out.printf(Locale.US,",%.9f,%.9f",wm.getPoints()[i].x/CometFullTableOracle.S,wm.getPoints()[i].y/CometFullTableOracle.S);System.out.println();}
      public void postSolve(Contact c,ContactImpulse imp){if(!ours(c))return;post[0]++;WorldManifold wm=c.getWorldManifold();float[] ni=imp.getNormalImpulses(),ti=imp.getTangentImpulses();System.out.printf(Locale.US,"POST,%d,%d,%.9f,%.9f",post[0],imp.getCount(),wm.getNormal().x,wm.getNormal().y);for(int i=0;i<imp.getCount();i++)System.out.printf(Locale.US,",%.9f,%.9f,%.9f,%.9f",wm.getPoints()[i].x/CometFullTableOracle.S,wm.getPoints()[i].y/CometFullTableOracle.S,ni[i]/CometFullTableOracle.S,ti[i]/CometFullTableOracle.S);System.out.println();}
    });
    dump("before",ball);
    w.step(DT,6,2);
    dump("after",ball);
    System.out.printf(Locale.US,"COUNTS,%d,%d,%d,%d%n",begin[0],end[0],pre[0],post[0]);
    w.dispose();
  }

  public static void main(String[] args){
    GdxNativesLoader.load();
    boolean continuous=args.length==0||!args[0].equals("discrete");
    run(continuous);
  }
}
