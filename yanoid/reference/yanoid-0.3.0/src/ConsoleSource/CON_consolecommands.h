#ifndef CON_consolecommands_H
#define CON_consolecommands_H



typedef struct CommandInfo_td
{
	void					(*CommandCallback)(char *Parameters);
	char					*CommandWord;
	struct CommandInfo_td	*NextCommand;
} CommandInfo;

#ifdef __cplusplus
extern "C" {
#endif

void CON_SendFullCommand( int sendOn );
void CON_CommandExecute(char *BackStrings);
void CON_AddCommand(void (*CommandCallback)(char *Parameters),const char *CommandWord);
void CON_TabCompletion(char* CommandLine, int *location);
void CON_ListCommands();
void CON_DestroyCommands();

#ifdef __cplusplus
};
#endif

#endif
