import com.badlogic.gdx.utils.GdxNativesLoader;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import java.util.Locale;
/** Native libGDX 0.9.9: original table boundaries, isolated ball; no mocked collision logic. */
public class M139BoundaryOracle {
  public static void main(String[] args) {
    GdxNativesLoader.load();
    System.out.println("case,x,y,vx,vy,nativeX,nativeY,nativeVX,nativeVY");
    for(float x: new float[]{.62f,.65f,.67f,.68f,.685f,.69f,.695f})
      for(float speed:new float[]{1,2,4,6,10})run("divider-left",x,.80f,speed,0);
    for(float x:new float[]{.735f,.74f,.745f})for(float speed:new float[]{1,2,4,6,10})run("divider-right",x,.80f,-speed,0);
    for(float y:new float[]{1.14f,1.16f,1.20f})for(float speed:new float[]{1,2,4,6,10})run("above-tip",.685f,y,speed,0);
    for(float y:new float[]{1.35f,1.36f,1.37f})for(float speed:new float[]{1,2,4,6,10})run("ceiling",.38f,y,0,speed);
    for(float x:new float[]{.7336f,.735f,.736f})for(float speed:new float[]{1,2,4,6,10})run("right-wall",x,.80f,speed,0);
  }
  static void run(String kind,float x,float y,float vx,float vy){
    World w=new World(new Vector2(0,CometFullTableOracle.G),true);
    CometFullTableOracle.bounds(w);
    Body b=CometFullTableOracle.ball(w);
    b.setTransform(x*10,y*10,0);
    b.setLinearVelocity(vx*10,vy*10);
    b.setAngularVelocity(0);
    w.step(1f/60f,6,2);
    System.out.printf(Locale.US,"%s,%.6f,%.6f,%.6f,%.6f,%.9f,%.9f,%.9f,%.9f%n",kind,x,y,vx,vy,b.getPosition().x/10f,b.getPosition().y/10f,b.getLinearVelocity().x/10f,b.getLinearVelocity().y/10f);
    w.dispose();
  }
}
