import java.awt.Color;
public class PrintBackgroundColors {
  public static void main(String[] args) {
    for (String item : args) {
      String[] p=item.split(",");
      int r=Integer.parseInt(p[0]), g=Integer.parseInt(p[1]), b=Integer.parseInt(p[2]);
      float[] hsb=Color.RGBtoHSB(r,g,b,null);
      float br=(hsb[2]<0.35f||hsb[2]>0.65f)?0.5f:hsb[2]+0.15f;
      Color c=Color.getHSBColor(hsb[0]+0.5f,1.0f,br);
      System.out.printf("#%02x%02x%02x%n",c.getRed(),c.getGreen(),c.getBlue());
    }
  }
}
