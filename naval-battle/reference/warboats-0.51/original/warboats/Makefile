CXX=gcc		#use gcc for C, g++ for C++
CXXFLAGS=-Wall -pedantic-errors	#add whatever flags you'd like
SOURCES=engine.c AI.c wb-ascii.c	#space-seperated list of source files
OBJECTS=$(SOURCES:.c=.o)
EXECUTABLE=warboats-ascii	#name of executable

all: $(SOURCES) $(EXECUTABLE)

$(EXECUTABLE): $(OBJECTS)
	$(CXX) -o $@ $(OBJECTS)		#add neccessary libraries here (GL, etc)

clean:
	rm -f $(OBJECTS) $(EXECUTABLE)

.c.o:
	$(CXX) $(CXXFLAGS) -c -o $@ $<

debug: $(OBJECTS)
	$(CXX) -g -o "$(EXECUTABLE)-dbg" $(OBJECTS)	#adds debug info for gdb

assembly:
	$(CXX) -S $(SOURCES)	#just compile to assembly
	
run:
	./$(EXECUTABLE)
