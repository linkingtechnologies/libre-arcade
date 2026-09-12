package org.numerone.altervista.jbriscola;

public class CartaHelperBriscola implements CartaHelper {
	private int cartaBriscola;
	
	public CartaHelperBriscola(ElaboratoreCarteBriscola e) {
		cartaBriscola=e.GetCartaBriscola();
	}
	@Override
	public int GetSeme(int carta) {
		// TODO Auto-generated method stub
		return carta/10;
	}

	@Override
	public int GetValore(int carta) {
		// TODO Auto-generated method stub
		return carta%10;
	}

	@Override
	public int GetPunteggio(int carta) {
		// TODO Auto-generated method stub
		if (carta<0 || carta>39)
			throw new IndexOutOfBoundsException("Chiamato cartahelperbriscola.getPunteggio con carta = " + carta);
		int valore=0;
		switch(carta%10) {
			case 0: valore=11; break;
			case 2: valore=10; break;
			case 9: valore=4; break;
			case 8: valore=3; break;
			case 7: valore=2; break;
		}
		return valore;
	}

	@Override
	public String GetSemeStr(int carta, int tipo)
	{
		if (tipo==1000)
			return GetSemeStrItaliana(carta);
		return GetSemeStrFrancese(carta);
	}
	
	@Override
	public String GetSemeStrItaliana(int carta) {
		// TODO Auto-generated method stub
		String s="";
		switch(carta/10) {
			case 0: s="bastoni"; break;
			case 1: s="coppe"; break;
			case 2: s="denari"; break;
			case 3: s="spade"; break;
		}
		return s;
	}
	
	@Override
	public String GetSemeStrFrancese(int carta) {
		// TODO Auto-generated method stub
		String s="";
		switch(carta/10) {
			case 0: s="fiori"; break;
			case 1: s="quadri"; break;
			case 2: s="cuori"; break;
			case 3: s="picche"; break;
		}
		return s;
	}
	@Override
	public int GetNumero(int seme, int valore) {
		if (seme<0 || seme > 4 || valore < 0 || valore > 9)
				throw new IndexOutOfBoundsException("Chiamato cartahelperbriscola.getNumero con seme = " + seme + " e valore = "+valore);

		// TODO Auto-generated method stub
		return seme*10+valore;
	}

	@Override
	public RISULTATI_COMPARAZIONE Compara(int carta, int carta1) {
		// TODO Auto-generated method stub
		int punteggio, punteggio1, valore, valore1, semeBriscola, semeCarta, semeCarta1;
		punteggio = GetPunteggio(carta);
		punteggio1 = GetPunteggio(carta1);
		valore = GetValore(carta);
		valore1 = GetValore(carta1);
		semeBriscola = GetSeme(cartaBriscola);
		semeCarta = GetSeme(carta);
		semeCarta1 = GetSeme(carta1);
		if (punteggio<punteggio1) //se le carte hanno punteggio diverso e' maggiore chi ha punteggio piu' alto
			return RISULTATI_COMPARAZIONE.MAGGIORE_LA_SECONDA;
		else if (punteggio>punteggio1)
			return RISULTATI_COMPARAZIONE.MAGGIORE_LA_PRIMA;
		else {
			if (valore<valore1 || (semeCarta1==semeBriscola && semeCarta!=semeBriscola)) //se le carte hanno punteggio uguale allora si confrontano i valori ed i semi
				return RISULTATI_COMPARAZIONE.MAGGIORE_LA_SECONDA;
			else if (valore>valore1 || (semeCarta==semeBriscola && semeCarta1!=semeBriscola))
				return RISULTATI_COMPARAZIONE.MAGGIORE_LA_PRIMA;
			else	return RISULTATI_COMPARAZIONE.UGUALI; //se hanno lo stesso valore e lo stesso seme sono uguali
		}
	}
}
