package org.numerone.altervista.jbriscola;

import java.util.Random;
import java.util.Vector;

public class ElaboratoreCarteBriscola implements ElaboratoreCarte {
	private int numeroCarte=40;
	private Vector<Boolean> doppione;
	int cartaBriscola;
	boolean inizio, briscolaDaPunti;
	Random rand;
	
	public ElaboratoreCarteBriscola(boolean punti) {
		int i;
		doppione=new Vector<Boolean>();
		for (i=0; i<numeroCarte; i++)
				doppione.add(false);
		rand=new Random();
		cartaBriscola=0;
		inizio=true;
		briscolaDaPunti=punti;
	}
	
	@Override
	public int GetCarta() {
		// TODO Auto-generated method stub
		int fine=rand.nextInt(numeroCarte);
		int carta=(fine+1)%numeroCarte;
		int valore;
		while(doppione.get(carta) && carta!=fine)
			carta=(carta+1)%numeroCarte;
		if (doppione.get(carta))
			throw new IndexOutOfBoundsException("Chiamato elaboratoreCarteBriscola::getCarta quando non ci sono più carte da elaborare");
		else {
			if (inizio) {
				valore=carta%10;
			if (!briscolaDaPunti && (valore==0 || valore==2 || valore>6))
				carta=carta-valore+1;
			cartaBriscola=carta;
			inizio=false;
			}
			doppione.set(carta, true);
		}	
		return carta;
	}
	
	public int GetCartaBriscola() {return cartaBriscola;}

}
