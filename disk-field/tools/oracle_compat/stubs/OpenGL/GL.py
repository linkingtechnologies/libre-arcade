_names=['glBegin','glCallList','glColor3f','glColor4f','glEnd','glEndList','glLineWidth','glNewList','glPopMatrix','glPushMatrix','glRotatef','glScalef','glTranslatef','glVertex2f']
def _noop(*a,**k): return None
glGenLists=lambda n: 1
for _n in _names: globals()[_n]=_noop
GL_COMPILE=1; GL_LINE_STRIP=2; GL_POINTS=3; GL_POLYGON=4; GL_QUADS=5; GL_TRIANGLE_STRIP=6
__all__=['glGenLists']+_names+['GL_COMPILE','GL_LINE_STRIP','GL_POINTS','GL_POLYGON','GL_QUADS','GL_TRIANGLE_STRIP']
