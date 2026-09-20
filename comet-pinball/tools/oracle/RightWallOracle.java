import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import java.util.Locale;
/** Static right-wall CCD regression: frame-755-scale velocity, standalone Box2D fixture. */
public class RightWallOracle {
  public static void main(String[] args){
    GdxNativesLoader.load();
    World world=new World(new Vector2(0,CometFullTableOracle.G),true);
    CometFullTableOracle.staticBox(world,.005f*10,.70f*10,.755f*10,.70f*10,.56f,"right-wall");
    Body b=CometFullTableOracle.ball(world);
    b.setTransform(.730f*10,.56f*10,0);
    b.setLinearVelocity(2.246843338f*10,.01f*10);b.setAngularVelocity(0);
    world.setContactListener(new ContactListener(){
      public void beginContact(Contact c){System.out.println("BEGIN,right-wall");}
      public void endContact(Contact c){}
      public void preSolve(Contact c,Manifold old){WorldManifold w=c.getWorldManifold();System.out.printf(Locale.US,"PRE,%.9f,%.9f%n",w.getNormal().x,w.getNormal().y);}
      public void postSolve(Contact c,ContactImpulse imp){System.out.printf(Locale.US,"POST,%.9f,%.9f%n",imp.getNormalImpulses()[0]/10f,imp.getTangentImpulses()[0]/10f);}
    });
    world.step(1f/60f,6,2);
    System.out.printf(Locale.US,"STATE,%.9f,%.9f,%.9f,%.9f,%.9f%n",b.getPosition().x/10f,b.getPosition().y/10f,b.getLinearVelocity().x/10f,b.getLinearVelocity().y/10f,b.getAngularVelocity());
    world.dispose();
  }
}
