import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import java.util.*;
/** Standalone diagnostic, no edits to preserved archive. */
public class CometBumperEscapeNative {
  static boolean outside(float x,float y){float r=.0135f,m=.004f;return y>1.4f+r+m||x<.30f&&y>1.10f&&Math.hypot(x-.30,y-1.10)>.295+r+m||x>.46f&&y>1.10f&&Math.hypot(x-.46,y-1.10)>.295+r+m;}
  static void run(int id,double px,double py,double vx,double vy){
    final World w=new World(new Vector2(0,CometFullTableOracle.G),true);CometFullTableOracle.bounds(w);
    final Map<Integer,Body> bps=new HashMap<Integer,Body>();bps.put(1,CometFullTableOracle.bumper(w,1,.25f,1.10f,.03f));bps.put(2,CometFullTableOracle.bumper(w,2,.45f,1.10f,.03f));bps.put(3,CometFullTableOracle.bumper(w,3,.35f,1.05f,.03f));
    CometFullTableOracle.obstacle(w,6,.65f,1.0f,new float[][]{{0,0},{0,.15f},{-.12f,-.09f}});
    CometFullTableOracle.obstacle(w,7,.07f,1.0f,new float[][]{{0,0},{.12f,-.09f},{0,.15f}});
    final Body ball=CometFullTableOracle.ball(w);ball.setTransform((float)px*10,(float)py*10,0);ball.setLinearVelocity((float)vx*10,(float)vy*10);ball.setAngularVelocity(0);
    final int[] hits={0}; final List<String> contacts=new ArrayList<String>();
    w.setContactListener(new ContactListener(){
      public void beginContact(Contact c){}
      public void endContact(Contact c){if(c.getFixtureA().getBody()!=ball&&c.getFixtureB().getBody()!=ball)return;String label=CometFullTableOracle.labelOther(c,ball);if(!label.startsWith("bumper:"))return;int n=Integer.parseInt(label.substring(7));Body bumper=bps.get(n);if(bumper==null)return;ball.applyForceToCenter(ball.getPosition().cpy().sub(bumper.getPosition()).nor().scl(CometFullTableOracle.BUMPER_FORCE),true);hits[0]++;contacts.add(label);}
      public void preSolve(Contact c,Manifold m){}
      public void postSolve(Contact c,ContactImpulse i){}
    });
    int escape=-1;float xx=0,yy=0;for(int f=0;f<85;f++){w.step(1f/60f,6,2);xx=ball.getPosition().x/10;yy=ball.getPosition().y/10;if(outside(xx,yy)){escape=f;break;}}
    System.out.printf(Locale.US,"%d,%.6f,%.6f,%.6f,%.6f,%d,%d,%.9f,%.9f,%s%n",id,px,py,vx,vy,hits[0],escape,xx,yy,String.join(";",contacts));w.dispose();
  }
  public static void main(String[] args){GdxNativesLoader.load();System.out.println("bumper_id,x,y,vx,vy,hits,first_escape_frame,final_x,final_y,hit_ids");
    run(1,.265,1.1425,3,10);
    run(2,.465,1.1425,1,4);
    run(2,.465,1.1425,1,16);
    run(3,.365,1.0925,-3,10);
    run(3,.35,1.0925,1,8);
  }
}
