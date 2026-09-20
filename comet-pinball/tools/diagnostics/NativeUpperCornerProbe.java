import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.*;
import com.badlogic.gdx.utils.GdxNativesLoader;
import java.util.Locale;
class NativeUpperCornerProbe {
 public static void main(String[] args){
  GdxNativesLoader.load();
  World w=new World(new Vector2(0,CometFullTableOracle.G),true);
  CometFullTableOracle.bounds(w);Body b=CometFullTableOracle.ball(w);
  b.setTransform(.024f*10f,1.251117f*10f,0f);b.setLinearVelocity(0,0);b.setAngularVelocity(0);
  System.out.printf(Locale.US,"native-start x=%.9f y=%.9f vx=%.9f vy=%.9f%n",b.getPosition().x/10f,b.getPosition().y/10f,b.getLinearVelocity().x/10f,b.getLinearVelocity().y/10f);
  for(int i=0;i<600;i++){
   w.step(1f/60f,6,2);
   if(i==0||i==59||i==119||i==299||i==599) System.out.printf(Locale.US,"native frame=%d x=%.9f y=%.9f vx=%.9f vy=%.9f awake=%s%n",i,b.getPosition().x/10f,b.getPosition().y/10f,b.getLinearVelocity().x/10f,b.getLinearVelocity().y/10f,b.isAwake());
  }
  w.dispose();
 }
}
