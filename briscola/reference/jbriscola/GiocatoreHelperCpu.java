package org.numerone.altervista.jbriscola;

import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.Point;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Random;
import java.util.Vector;

import javax.imageio.ImageIO;
import javax.swing.JPanel;

public class GiocatoreHelperCpu implements GiocatoreHelper {
	private Carta briscola;
	private BufferedImage img;
	private Random rand;
	private int getBriscola(Vector<Carta> mano) {
		int i;
		for (i=0; i<mano.size() && !briscola.StessoSeme(mano.get(i)); i++);
		return i;
	}
	private int GetSoprataglio(Vector<Carta> mano, Carta c, boolean maggiore) {
		boolean trovata=false;
		int i;
		if (maggiore) {
			for (i=mano.size()-1; i>-1; i--)
				if (c.StessoSeme(mano.get(i)) && Carta.Compara(c, mano.get(i))==CartaHelper.RISULTATI_COMPARAZIONE.MAGGIORE_LA_SECONDA) {
					trovata=true;
					break;
				} else if(c.StessoSeme(mano.get(i)) && Carta.Compara(c, mano.get(i))==CartaHelper.RISULTATI_COMPARAZIONE.MAGGIORE_LA_PRIMA) {
					break;
				}
		} else {
				for(i=0; i<mano.size(); i++)
					if (c.StessoSeme(mano.get(i)) && Carta.Compara(c, mano.get(i))==CartaHelper.RISULTATI_COMPARAZIONE.MAGGIORE_LA_SECONDA) {
						trovata=true;
						break;
					}
		}
		if (trovata)
			return i;
		else
			return mano.size();
			
	}
	
	public GiocatoreHelperCpu(int b) throws FileNotFoundException, IOException {
		briscola=Carta.GetCarta(b);
		img=null;
		rand=new Random();
	}
	
	public void CaricaImmagine() throws FileNotFoundException, IOException  {
		String s=Carta.GetPathCarte()+"retro carte pc.png";
		File f=new File(s);
		if (!f.exists())
			throw new FileNotFoundException("Il file "+s+" non esiste.");
		else
			img=ImageIO.read(f);
	}
	
	
	public void CaricaImmagine(Class<BriscoFrame> class1) throws FileNotFoundException, IOException  {
			img=ImageIO.read(class1.getClassLoader().getResource("Napoletano/retro carte pc.png"));
	}
	@Override
	public int Gioca(Vector<Carta> mano, int iCarta) {
		// TODO Auto-generated method stub
		int i;
		for (i=mano.size()-1; i>-1 && (mano.get(i).GetPunteggio()>5 || briscola.StessoSeme(mano.get(i))); i--);
		if (i<0 || i>mano.size())
			i=0;
		return i;
			
	}

	@Override
	public int Gioca(Vector<Carta> mano, Carta c, int i) {
		// TODO Auto-generated method stub
		i=rand.nextInt();
		if (!briscola.StessoSeme(c)) {
			if ((i=GetSoprataglio(mano, c, true))<mano.size())
				return i;
			if (c.GetPunteggio()>0 && (i=getBriscola(mano))<mano.size()) {
				if (c.GetPunteggio()>4)
					return i;
				if (mano.get(i).GetPunteggio()>0)
					if (i%10<5)
						return i;
			}
		} else {
			if (i%10<5 && (i=GetSoprataglio(mano, c, false))<mano.size())
				return i;
		}
		i=0;
		return 0;
	}

	@Override
	public int GetPunteggio(Carta c, Carta c1) {
		// TODO Auto-generated method stub
		return c.GetPunteggio()+c1.GetPunteggio();
	}

	@Override
	public Point Paint(String nome, Vector<Carta> mano, int iCartaGiocata, JPanel p, Graphics2D gm, FontMetrics fm, int spaziatura) {
		// TODO Auto-generated method stub
		Point punto=new Point(0,0);
		int i;
		punto.y=fm.getHeight()+20+spaziatura+img.getHeight()*2;
		for (i=0; i<mano.size(); i++) {
			if (gm!=null)
				if (i!=iCartaGiocata)
					gm.drawImage(img, punto.x, punto.y, p);
				else
					gm.drawImage(mano.get(iCartaGiocata).GetImmagine(), Carta.GetLarghezzaImmagine()/2+Carta.GetLarghezzaImmagine()+spaziatura ,fm.getHeight()+20+Carta.GetAltezzaImmagine(), p);
			punto.x=punto.x+img.getWidth()+spaziatura;
		}
		punto.y=punto.y+img.getHeight()+fm.getHeight()+spaziatura;
		if (gm!=null)
			gm.drawString(nome, 0, punto.y);
		punto.y=punto.y+fm.getHeight()+img.getHeight();
		return punto;
	}

}
