/* Ri-li 2.0.1 languages. SPDX-License-Identifier: GPL-3.0-only */
// The 19 languages of the original, in the order of its language.dat (the order of its language menu, three columns of seven, seven and five): the code is the end of the name of
// the file that holds the pictures of that language (language.De, language.En, ...) in lower case. public/ui/<code>/ has the 79 pictures of a language and public/ui/lang/<code>.png
// the label of its name in the menu. tools/check-assets.mjs checks this list against language.dat.
export const LANGUAGES=['de','en','es','fr','ar','cn','jp','ru','sl','it','br','po','se','eo','hu','tu','pl','du','ko'];
export const DEFAULT_LANGUAGE='it';
// the pictures of a language file, in the order of the original's enumeration (e_Sprite: T_level ... T_question, then the titles and the texts of the 30 articles of the quiz)
export const LABEL_NAMES=[
  'T_level','T_lives','T_options','T_score','T_press_any_key','T_continue','T_moptions','T_exit_game','T_play','T_scores','T_better_scores','T_quit','T_new_game','T_old_level','T_menu','T_easy','T_normal','T_hard','T_question',
  ...Array.from({length:30},(_,i)=>`T_tart${i+1}`),...Array.from({length:30},(_,i)=>`T_art${i+1}`)
];
export const languageFile=(code)=>`language.${code[0].toUpperCase()}${code[1]}`;
