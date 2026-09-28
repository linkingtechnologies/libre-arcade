import java.lang.reflect.*;
import java.util.Random;
import hulka.tilemanager.SquareTileManager;

public class PrintSliderMix {
  static void set(Object o,String name,Object value) throws Exception {
    Field f=SliderHandler.class.getDeclaredField(name); f.setAccessible(true); f.set(o,value);
  }
  static Object get(Object o,String name) throws Exception {
    Field f=SliderHandler.class.getDeclaredField(name); f.setAccessible(true); return f.get(o);
  }
  public static void main(String[] args) throws Exception {
    int size=Integer.parseInt(args[0]); long seed=Long.parseLong(args[1]);
    SquareTileManager tm=new SquareTileManager(600,600,size,size);
    SliderHandler h=new SliderHandler(tm);
    Random r=new Random(seed);
    set(h,"random",r); set(h,"tileCount",size*size); set(h,"tilesAcross",size); set(h,"missingTile",r.nextInt(size*size));
    Method m=SliderHandler.class.getDeclaredMethod("mix"); m.setAccessible(true); m.invoke(h);
    StringBuilder sb=new StringBuilder();
    sb.append(get(h,"missingTile")).append(':');
    for(int i=0;i<size*size;i++){if(i>0)sb.append(',');sb.append(tm.getOriginalTileIndex(i));}
    System.out.println(sb.toString());
  }
}
