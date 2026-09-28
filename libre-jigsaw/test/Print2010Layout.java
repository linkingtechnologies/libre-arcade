import hulka.tilemanager.*;
public class Print2010Layout {
  public static void main(String[] args) {
    int[][] dims={{900,600},{600,900},{320,240},{1400,700}};
    int[] counts={12,24,48,96};
    for(int[] d:dims) for(int n:counts){
      TileSetDescriptor s=SquareTileManager.getBestFit(d[0],d[1],n,true,null);
      SquareJigsawManager m=new SquareJigsawManager(d[0],d[1],s.tilesAcross,s.tilesDown);
      System.out.printf("square,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d%n",d[0],d[1],n,m.getTilesAcross(),m.getTilesDown(),m.getTileCount(),m.getTileWidth(),m.getTileHeight(),m.getLeftOffset(),m.getTopOffset());
      TileSetDescriptor h=HexTileManager.getBestFit(d[0],d[1],n,true,null);
      HexJigsawManager hm=new HexJigsawManager(d[0],d[1],h.tilesAcross,h.tilesDown);
      System.out.printf("hex,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d%n",d[0],d[1],n,hm.getTilesAcross(),hm.getTilesDown(),hm.getTileCount(),hm.getTileWidth(),hm.getTileHeight(),hm.getLeftOffset(),hm.getTopOffset());
    }
  }
}
