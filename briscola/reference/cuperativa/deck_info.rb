#file: deck_info.rb


class GamesDeckInfo
  attr_reader :cards_on_game, :deck_info
  
  def initialize
    @cards_on_game = []
    @deck_info = {}
  end
  
  def mazzo52
    mazzo40()
    # in un mazzo da 52 carte bisogna shiftare di 3 posizioni il fante, il cavallo il re
    # per fare posto al 8,9 e 10
    # bastoni
    @deck_info[:_8b] = {:ix=> 7,  :nome => 'otto bastoni' , :symb => :ott, :segno => :B, :seed_ix => 0, :pos => 8}
    @deck_info[:_9b] = {:ix=> 8,  :nome => 'nove bastoni' , :symb => :nov, :segno => :B, :seed_ix => 0, :pos => 9}
    @deck_info[:_db] = {:ix=> 9,  :nome => 'dieci bastoni' , :symb => :die, :segno => :B, :seed_ix => 0, :pos => 10}
    @deck_info[:_Fb] = {:ix=> 10,  :nome => 'fante bastoni' , :symb => :fan, :segno => :B, :seed_ix => 0, :pos => 11} 
    @deck_info[:_Cb] = {:ix=> 11, :nome => 'cavallo bastoni', :symb => :cav, :segno => :B, :seed_ix => 0, :pos => 12}
    @deck_info[:_Rb] = {:ix=> 12, :nome => 're bastoni' , :symb => :re, :segno => :B, :seed_ix => 0, :pos => 13}
    # coppe
    @deck_info[:_Ac][:ix] = 13
    @deck_info[:_2c][:ix] = 14
    @deck_info[:_3c][:ix] = 15
    @deck_info[:_4c][:ix] = 16
    @deck_info[:_5c][:ix] = 17
    @deck_info[:_6c][:ix] = 18
    @deck_info[:_7c][:ix] = 19
    @deck_info[:_8c] = {:ix=> 20, :nome => 'otto coppe' , :symb => :ott, :segno => :C, :seed_ix => 1, :pos => 8}
    @deck_info[:_9c] = {:ix=> 21,:nome => 'nove coppe', :symb => :nov, :segno => :C, :seed_ix => 1, :pos => 9}
    @deck_info[:_dc] = {:ix=> 22,:nome => 'dieci coppe' , :symb => :die, :segno => :C, :seed_ix => 1, :pos => 10}
    @deck_info[:_Fc] = {:ix=> 23, :nome => 'fante coppe' , :symb => :fan, :segno => :C, :seed_ix => 1, :pos => 11}
    @deck_info[:_Cc] = {:ix=> 24 ,:nome => 'cavallo coppe', :symb => :cav, :segno => :C, :seed_ix => 1, :pos => 12}
    @deck_info[:_Rc] = {:ix=> 25 ,:nome => 're coppe' , :symb => :re, :segno => :C, :seed_ix => 1, :pos => 13}
    #denari
    @deck_info[:_Ad][:ix] = 26
    @deck_info[:_2d][:ix] = 27
    @deck_info[:_3d][:ix] = 28
    @deck_info[:_4d][:ix] = 29
    @deck_info[:_5d][:ix] = 30
    @deck_info[:_6d][:ix] = 31
    @deck_info[:_7d][:ix] = 32
    @deck_info[:_8d] = {:ix=> 33, :nome => 'otto denari' , :symb => :ott, :segno => :D, :seed_ix => 2, :pos => 8}
    @deck_info[:_9d] = {:ix=> 34,:nome => 'nove denari', :symb => :nov, :segno => :D, :seed_ix => 2, :pos => 9}
    @deck_info[:_dd] = {:ix=> 35,:nome => 'dieci denari' , :symb => :die, :segno => :D, :seed_ix => 2, :pos => 10}
    @deck_info[:_Fd] = {:ix=> 36, :nome => 'fante denari' , :symb => :fan, :segno => :D, :seed_ix => 2, :pos => 11}
    @deck_info[:_Cd] = {:ix=> 37 ,:nome => 'cavallo denari', :symb => :cav, :segno => :D, :seed_ix => 2, :pos => 12}
    @deck_info[:_Rd] = {:ix=> 38 ,:nome => 're denari' , :symb => :re, :segno => :D, :seed_ix => 2, :pos => 13}
    # spade
    @deck_info[:_As][:ix] = 39
    @deck_info[:_2s][:ix] = 40
    @deck_info[:_3s][:ix] = 41
    @deck_info[:_4s][:ix] = 42
    @deck_info[:_5s][:ix] = 43
    @deck_info[:_6s][:ix] = 44
    @deck_info[:_7s][:ix] = 45
    @deck_info[:_8s] = {:ix=> 46, :nome => 'otto spade' , :symb => :ott, :segno => :S, :seed_ix => 3, :pos => 8}
    @deck_info[:_9s] = {:ix=> 47,:nome => 'nove spade', :symb => :nov, :segno => :S, :seed_ix => 3, :pos => 9}
    @deck_info[:_ds] = {:ix=> 48,:nome => 'dieci spade' , :symb => :die, :segno => :S, :seed_ix => 3, :pos => 10}
    @deck_info[:_Fs] = {:ix=> 49, :nome => 'fante spade' , :symb => :fan, :segno => :S, :seed_ix => 3, :pos => 11}
    @deck_info[:_Cs] = {:ix=> 50 ,:nome => 'cavallo spade', :symb => :cav, :segno => :S, :seed_ix => 3, :pos => 12}
    @deck_info[:_Rs] = {:ix=> 51 ,:nome => 're spade' , :symb => :re, :segno => :S, :seed_ix => 3, :pos => 13}
    return @deck_info
  end
  
  def mazzo40
    # deck info, on inherited class we use @game_deckinfo
    @deck_info = {
      # bastoni
      :_Ab => {:ix=> 0,  :nome => 'asso bastoni', :symb => :asso, :segno => :B, :seed_ix => 0, :pos => 1},
      :_2b => {:ix=> 1,  :nome => 'due bastoni', :symb => :due, :segno => :B, :seed_ix => 0, :pos => 2 }, 
      :_3b => {:ix=> 2,  :nome => 'tre bastoni', :symb => :tre, :segno => :B, :seed_ix => 0, :pos => 3},
      :_4b => {:ix=> 3,  :nome => 'quattro bastoni', :symb => :qua, :segno => :B, :seed_ix => 0, :pos => 4}, 
      :_5b => {:ix=> 4,  :nome => 'cinque bastoni', :symb => :cin, :segno => :B, :seed_ix => 0, :pos => 5},
      :_6b => {:ix=> 5 , :nome => 'sei bastoni', :symb => :sei, :segno => :B, :seed_ix => 0, :pos => 6}, 
      :_7b => {:ix=> 6,  :nome => 'sette bastoni', :symb => :set, :segno => :B, :seed_ix => 0, :pos => 7},
      :_Fb => {:ix=> 7,  :nome => 'fante bastoni' , :symb => :fan, :segno => :B, :seed_ix => 0, :pos => 8}, 
      :_Cb => {:ix=> 8 , :nome => 'cavallo bastoni', :symb => :cav, :segno => :B, :seed_ix => 0, :pos => 9},
      :_Rb => {:ix=> 9 , :nome => 're bastoni' , :symb => :re, :segno => :B, :seed_ix => 0, :pos => 10},
      # coppe
      :_Ac => {:ix=> 10, :nome => 'asso coppe', :symb => :asso, :segno => :C, :seed_ix => 1, :pos => 1},
      :_2c => {:ix=> 11, :nome => 'due coppe', :symb => :due, :segno => :C, :seed_ix => 1, :pos => 2}, 
      :_3c => {:ix=> 12, :nome => 'tre coppe', :symb => :tre, :segno => :C, :seed_ix => 1, :pos => 3},
      :_4c => {:ix=> 13, :nome => 'quattro coppe', :symb => :qua, :segno => :C, :seed_ix => 1, :pos => 4},
      :_5c => {:ix=> 14, :nome => 'cinque coppe', :symb => :cin, :segno => :C, :seed_ix => 1, :pos => 5},
      :_6c => {:ix=> 15 ,:nome => 'sei coppe', :symb => :sei, :segno => :C, :seed_ix => 1, :pos => 6},
      :_7c => {:ix=> 16, :nome => 'sette coppe', :symb => :set, :segno => :C, :seed_ix => 1, :pos => 7},
      :_Fc => {:ix=> 17, :nome => 'fante coppe' , :symb => :fan, :segno => :C, :seed_ix => 1, :pos => 8},
      :_Cc => {:ix=> 18 ,:nome => 'cavallo coppe', :symb => :cav, :segno => :C, :seed_ix => 1, :pos => 9},
      :_Rc => {:ix=> 19 ,:nome => 're coppe' , :symb => :re, :segno => :C, :seed_ix => 1, :pos => 10},
      # denari
      :_Ad => {:ix=> 20, :nome => 'asso denari', :symb => :asso, :segno => :D, :seed_ix => 2, :pos => 1},
      :_2d => {:ix=> 21, :nome => 'due denari', :symb => :due, :segno => :D, :seed_ix => 2, :pos => 2}, 
      :_3d => {:ix=> 22, :nome => 'tre denari', :symb => :tre, :segno => :D, :seed_ix => 2, :pos => 3},
      :_4d => {:ix=> 23, :nome => 'quattro denari', :symb => :qua, :segno => :D, :seed_ix => 2, :pos => 4},
      :_5d => {:ix=> 24, :nome => 'cinque denari', :symb => :cin, :segno => :D, :seed_ix => 2, :pos => 5},
      :_6d => {:ix=> 25 ,:nome => 'sei denari', :symb => :sei, :segno => :D, :seed_ix => 2, :pos => 6},
      :_7d => {:ix=> 26, :nome => 'sette denari', :symb => :set, :segno => :D, :seed_ix => 2, :pos => 7},
      :_Fd => {:ix=> 27, :nome => 'fante denari' , :symb => :fan, :segno => :D, :seed_ix => 2, :pos => 8},
      :_Cd => {:ix=> 28 ,:nome => 'cavallo denari', :symb => :cav, :segno => :D, :seed_ix => 2, :pos => 9},
      :_Rd => {:ix=> 29 ,:nome => 're denari' , :symb => :re, :segno => :D, :seed_ix => 2, :pos => 10},
      # spade
      :_As => {:ix=> 30, :nome => 'asso spade', :symb => :asso, :segno => :S, :seed_ix => 3, :pos => 1},
      :_2s => {:ix=> 31, :nome => 'due spade', :symb => :due, :segno => :S, :seed_ix => 3, :pos => 2}, 
      :_3s => {:ix=> 32, :nome => 'tre spade', :symb => :tre, :segno => :S, :seed_ix => 3, :pos => 3},
      :_4s => {:ix=> 33, :nome => 'quattro spade', :symb => :qua, :segno => :S, :seed_ix => 3, :pos => 4},
      :_5s => {:ix=> 34, :nome => 'cinque spade', :symb => :cin, :segno => :S, :seed_ix => 3, :pos => 5},
      :_6s => {:ix=> 35 ,:nome => 'sei spade', :symb => :sei, :segno => :S, :seed_ix => 3, :pos => 6},
      :_7s => {:ix=> 36, :nome => 'sette spade', :symb => :set, :segno => :S, :seed_ix => 3, :pos => 7},
      :_Fs => {:ix=> 37, :nome => 'fante spade' , :symb => :fan, :segno => :S, :seed_ix => 3, :pos => 8},
      :_Cs => {:ix=> 38 ,:nome => 'cavallo spade', :symb => :cav, :segno => :S, :seed_ix => 3, :pos => 9},
      :_Rs => {:ix=> 39 ,:nome => 're spade' , :symb => :re, :segno => :S, :seed_ix => 3, :pos => 10}
    }
    return @deck_info
  end
  
  def get_card_info(lbl_card)
    raise "get_card_info failed on #{lbl_card}" unless @deck_info[lbl_card]
    return @deck_info[lbl_card]
  end
  
  def nome_carta_completo(lbl_card)
    #p lbl_card
    return @deck_info[lbl_card][:nome]
  end
  
  def get_card_logical_symb(card_lbl)
    return @deck_info[card_lbl][:symb]
  end
  
  def get_card_rank(card_lbl)
    return @deck_info[card_lbl][:rank]
  end
  
  def get_card_points(card_lbl)
    return @deck_info[card_lbl][:points]
  end
  
  def get_card_segno(card_lbl)
    return @deck_info[card_lbl][:segno]
  end
  
  def build_deck_briscola
    mazzo40
    
    val_arr_rank   = {:asso => 12, :due =>2, :tre => 11, :qua => 4, :cin => 5,
         :sei => 6, :set => 7, :fan => 8, :cav => 9, :re => 10} # card value order
    val_arr_points   = {:asso => 11, :due =>0, :tre => 10, :qua => 0, :cin => 0,
         :sei => 0, :set => 0, :fan => 2, :cav => 3, :re => 4}
    @cards_on_game =  [:_Ab,:_2b,:_3b,:_4b,:_5b,:_6b,:_7b,:_Fb,:_Cb,:_Rb,
                      :_Ac,:_2c,:_3c,:_4c,:_5c,:_6c,:_7c,:_Fc,:_Cc,:_Rc,
                      :_Ad,:_2d,:_3d,:_4d,:_5d,:_6d,:_7d,:_Fd,:_Cd,:_Rd,
                      :_As,:_2s,:_3s,:_4s,:_5s,:_6s,:_7s,:_Fs,:_Cs,:_Rs  ]
    
    cards_on_game.each do |k|
      card = @deck_info[k] 
      raise "Error on deck #{k} not found" if card == nil
      symb_card = card[:symb]
      card[:rank] = val_arr_rank[symb_card]
      card[:points] = val_arr_points[symb_card]
    end
  end
  
  def build_deck_tressette
    mazzo40
    
    val_arr_rank   = {:asso => 11, :due =>12, :tre => 13, :qua => 4, :cin => 5,
         :sei => 6, :set => 7, :fan => 8, :cav => 9, :re => 10} # card value order
    val_arr_points   = {:asso => 3, :due =>1, :tre => 1, :qua => 0, :cin => 0,
         :sei => 0, :set => 0, :fan => 1, :cav => 1, :re => 1}
    @cards_on_game =  [:_Ab,:_2b,:_3b,:_4b,:_5b,:_6b,:_7b,:_Fb,:_Cb,:_Rb,
                      :_Ac,:_2c,:_3c,:_4c,:_5c,:_6c,:_7c,:_Fc,:_Cc,:_Rc,
                      :_Ad,:_2d,:_3d,:_4d,:_5d,:_6d,:_7d,:_Fd,:_Cd,:_Rd,
                      :_As,:_2s,:_3s,:_4s,:_5s,:_6s,:_7s,:_Fs,:_Cs,:_Rs  ]
    
    cards_on_game.each do |k|
      card = @deck_info[k] 
      raise "Error on deck #{k} not found" if card == nil
      symb_card = card[:symb]
      card[:rank] = val_arr_rank[symb_card]
      card[:points] = val_arr_points[symb_card]
    end
  end
  
  def build_deck_spazzino
    mazzo40
    
    val_arr_rank   = {:asso => 1, :due =>2, :tre => 3, :qua => 4, :cin => 5,
         :sei => 6, :set => 7, :fan => 8, :cav => 9, :re => 10} # card value order
    val_arr_points   = {:asso => 16, :due =>12, :tre => 13, :qua => 14, :cin => 15,
         :sei => 18, :set => 21, :fan => 10, :cav => 10, :re => 10}
    @cards_on_game =  [:_Ab,:_2b,:_3b,:_4b,:_5b,:_6b,:_7b,:_Fb,:_Cb,:_Rb,
                      :_Ac,:_2c,:_3c,:_4c,:_5c,:_6c,:_7c,:_Fc,:_Cc,:_Rc,
                      :_Ad,:_2d,:_3d,:_4d,:_5d,:_6d,:_7d,:_Fd,:_Cd,:_Rd,
                      :_As,:_2s,:_3s,:_4s,:_5s,:_6s,:_7s,:_Fs,:_Cs,:_Rs  ]
    
    cards_on_game.each do |k|
      card = @deck_info[k] 
      raise "Error on deck #{k} not found" if card == nil
      symb_card = card[:symb]
      card[:rank] = val_arr_rank[symb_card]
      card[:points] = val_arr_points[symb_card]
    end
  end
  
end #end BaseDeckInfo


