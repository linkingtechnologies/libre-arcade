import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import java.util.*;
/** Native 2013 world: real bumper contact end force followed by upper arc flight. */
public class M1310BumperSequenceOracle {
  static void run(final int bumperId,final float offsetVx){
    World w=new World(new Vector2(0,CometFullTableOracle.G),true);
    CometFullTableOracle.bounds(w);
    final Map<Integer,Body> bumpers=new HashMap<Integer,Body>();
    bumpers.put(1,CometFullTableOracle.bumper(w,1,.25f,1.10f,.03f));
    bumpers.put(2,CometFullTableOracle.bumper(w,2,.45f,1.10f,.03f));
    bumpers.put(3,CometFullTableOracle.bumper(w,3,.35f,1.05f,.03f));
    final Body ball=CometFullTableOracle.ball(w);
    float x=bumperId==1?.25f:bumperId==2?.45f:.35f;
    float y=bumperId==3?1.05f:1.10f;
    ball.setTransform(x*10,(y+.03f+.0135f-.0002f)*10,0);
    ball.setLinearVelocity(offsetVx*10,3f*10);
    ball.setAngularVelocity(0);
    final int[] hits={0};
    w.setContactListener(new ContactListener(){
      public void beginContact(Contact c){}
      public void endContact(Contact c){
        if(c.getFixtureA().getBody()!=ball&&c.getFixtureB().getBody()!=ball)return;
        String other=CometFullTableOracle.labelOther(c,ball);
        if(!other.startsWith("bumper:"))return;
        int id=Integer.parseInt(other.substring(7));
        Body bumper=bumpers.get(id);if(bumper==null)return;
        Vector2 direction=ball.getPosition().cpy().sub(bumper.getPosition()).nor().scl(CometFullTableOracle.BUMPER_FORCE);
        ball.applyForceToCenter(direction,true);hits[0]++;
      }
      public void preSolve(Contact c,Manifold m){}
      public void postSolve(Contact c,ContactImpulse i){}
    });
    for(int f=1;f<=45;f++){
      w.step(1f/60f,6,2);
      Vector2 p=ball.getPosition(),v=ball.getLinearVelocity();
      System.out.printf(Locale.US,"%d,%.0f,%d,%.9f,%.9f,%.9f,%.9f,%d%n",bumperId,offsetVx,f,p.x/10,p.y/10,v.x/10,v.y/10,hits[0]);
    }
    w.dispose();
  }
  public static void main(String[] args){GdxNativesLoader.load();System.out.println("bumperId,initialVX,frame,x,y,vx,vy,hits");for(int id=1;id<=3;id++)for(float vx:new float[]{-1,0,1})run(id,vx);}
}
