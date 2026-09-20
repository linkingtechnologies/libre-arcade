import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import java.util.*;
/** Isolated post-bumper upper-boundary seeds. This is not a full-game replay. */
public class M1310BumperUpperOracle {
  static void test(float x,float y,float vx,float vy){
    World world=new World(new Vector2(0,CometFullTableOracle.G),true);
    CometFullTableOracle.bounds(world);
    CometFullTableOracle.bumper(world,1,.25f,1.10f,.03f);
    CometFullTableOracle.bumper(world,2,.45f,1.10f,.03f);
    CometFullTableOracle.bumper(world,3,.35f,1.05f,.03f);
    Body ball=CometFullTableOracle.ball(world);
    ball.setTransform(x*10,y*10,0);
    ball.setLinearVelocity(vx*10,vy*10);
    ball.setAngularVelocity(0);
    final TreeSet<String> labels=new TreeSet<String>();
    world.setContactListener(new ContactListener(){
      public void beginContact(Contact c){if(c.getFixtureA().getBody()==ball||c.getFixtureB().getBody()==ball)labels.add(CometFullTableOracle.labelOther(c,ball));}
      public void endContact(Contact c){}
      public void preSolve(Contact c,Manifold oldManifold){}
      public void postSolve(Contact c,ContactImpulse impulse){}
    });
    world.step(1f/60f,6,2);
    Vector2 p=ball.getPosition(),v=ball.getLinearVelocity();
    System.out.printf(Locale.US,"%.6f,%.6f,%.6f,%.6f,%.9f,%.9f,%.9f,%.9f,%s%n",x,y,vx,vy,p.x/10,p.y/10,v.x/10,v.y/10,labels.isEmpty()?"none":String.join(";",labels));
    world.dispose();
  }
  public static void main(String[]args){
    GdxNativesLoader.load();
    System.out.println("x,y,vx,vy,nativeX,nativeY,nativeVX,nativeVY,contacts");
    // Positions in the table after a bumper's upward kick; selected values
    // intentionally sweep the top-center and both curved portions.
    for(float x:new float[]{.10f,.15f,.20f,.25f,.30f,.35f,.38f,.42f,.45f,.50f,.55f,.60f,.65f})
      for(float y:new float[]{1.16f,1.23f,1.28f,1.32f,1.35f,1.37f})
        for(float vx:new float[]{-4f,-2f,0f,2f,4f})
          for(float vy:new float[]{2f,6f,10f})test(x,y,vx,vy);
  }
}
