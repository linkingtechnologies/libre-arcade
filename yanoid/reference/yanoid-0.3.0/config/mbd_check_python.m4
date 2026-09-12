dnl ----------------------------------------------------------------------
dnl MBD_CHECK_PYTHON([MINIIMUM-VERSION])
dnl ----------------------------------------------------------------------

dnl This macro tries to figure out the neccesary includes and flags to 
dnl add when compiling a C/C++ program to embed Python in. 

dnl On succes, the variable mbd_check_python_failure is set to no
dnl and the following variables are set
dnl PYTHON          - (/usr/bin/python) the Python executable
dnl PYTHON_VERSION  - (x.y) the Python version
dnl PYTHON_INCLUDES - (-I) the path to the Python include directory
dnl PYTHON_LIBS     - (-l) libs required to link with the libpython lib
dnl                   Note that this will add the options to link 
dnl                   dynamic modules into the static python lib,
dnl                   which is not required for the dynamic python lib
dnl                   but apparently does not harm
dnl PYTHON_LIBDIR   - dir with the libpython lib in
dnl PYTHON_LDFLAGS  - -LPYTHON_LIBDIR
dnl PYTHON_LIBNAME  - python<version> - the libpython lib
dnl PYTHON_LIBRARY  - -lPYTHON_LIBNAME

dnl On failure, the variable mbd_check_python_failure is set to yes

dnl NOTE: This macros does not stop on errors. Check the variable
dnl mbd_check_python_failure instead

dnl If the MINIUMUM-VERSION argument is passed, MBD_CHECK_PYTHON will
dnl cause an error if the version of python installed on the system
dnl doesn't meet the requirement.  MINIMUM-VERSION should consist of
dnl numbers and dots only.

dnl This macro probably only works with Python version 1.5.2 and never.
dnl Python must be present in the users path. Development libraries for python
dnl must be present on the system. The module distutils.sysconfig and the call
dnl distutils.sysconfig.get_config_vars() must be present

dnl Most of the code in here was stolen from either the KDE project - a macro
dnl called KDE_CHECK_PYTHON - or from the pygtk project - a macro called 
dnl "GED". KDE_CHECK_PATH has the problem - as I see it - that it 
dnl has troubles locating the python installation, whereas the "GED" 
dnl macro is aimed at people extending Python. This macro tries to combine 
dnl those two macros.

dnl Especially from pygtk, certain paragraphs are taken verbatim.

dnl CREDITS: I have no idea who wrote the KDE_CHECK_PATH, but "GED"
dnl was written by James Henstridge and Andrew Dalke, AFAIK.

dnl Mads Bondo Dydensborg

AC_DEFUN([MBD_CHECK_PYTHON], 
 [
  dnl Requirements
  AC_REQUIRE([AC_PROG_CC])
  AC_REQUIRE([AC_PROG_CPP])

  dnl Set failure value - change to yes, if we fail.
  mbd_check_python_failure=no
  mbd_check_python_msg="OK"

  dnl Locate python in the users path
  AC_PATH_PROG(PYTHON, python python2.1 python2.0)

  dnl The version check is taken verbatim from pygtk/"GED",
  dnl except that we do not error
  dnl should we do the version check?
  ifelse([$1],[],,[
    AC_MSG_CHECKING(if Python version >= $1)
    changequote(<<, >>)dnl
    prog="
import sys, string
minver = '$1'
pyver  = string.split(sys.version)[0]  # first word is version string
# split strings by '.' and convert to numeric
minver = map(string.atoi, string.split(minver, '.'))
pyver  = string.split(pyver, '.')
pyvermajor = string.atoi(pyver[0][0])
pyverminor = string.atoi(pyver[1][0])
# we can now do comparisons on the two lists:
if pyvermajor > minver[0]:
	sys.exit(0)
else:
	if pyvermajor == minver[0] and pyverminor >= minver[1]:
		sys.exit(0)
	else:
	        sys.exit(1)"
    changequote([, ])dnl
    if $PYTHON -c "$prog" 1>&AC_FD_CC 2>&AC_FD_CC
    then
      AC_MSG_RESULT(okay)
    else
      AC_MSG_RESULT(too old)
      mbd_check_python_failure=yes
      mbd_check_python_msg="Python version was to old"
    fi
  ])

  dnl Next logical script is to set the version 
  dnl This is the way "GED" does it, at least
  AC_MSG_CHECKING([local Python version])

  dnl Query Python for its version number.  Getting [:3] seems to be
  dnl the best way to do this; it's what "site.py" does in the standard
  dnl library.  Need to change quote character because of [:3]

  changequote(<<, >>)dnl
  PYTHON_VERSION=`$PYTHON -c "import sys; print sys.version[:3]"`
  changequote([, ])dnl
  AC_SUBST(PYTHON_VERSION)

  AC_MSG_RESULT([found $PYTHON_VERSION])

  dnl Locate the directory with the Python.h file in.
  dnl This code also mostly from "ged"  	
  if test "x$mbd_check_python_failure" != "xyes"; then
    AC_MSG_CHECKING(for headers required to compile programs that use Python)
    dnl deduce PYTHON_INCLUDES
    py_prefix=`$PYTHON -c "import sys; print sys.prefix"`
    py_exec_prefix=`$PYTHON -c "import sys; print sys.exec_prefix"`

    PYTHON_INCLUDES="-I${py_prefix}/include/python${PYTHON_VERSION}"
    if test "$py_prefix" != "$py_exec_prefix"; then
      PYTHON_INCLUDES="$PYTHON_INCLUDES -I${py_exec_prefix}/include/python${PYTHON_VERSION}"
    fi
    AC_SUBST(PYTHON_INCLUDES)
    dnl check if the headers exist:
    save_CPPFLAGS="$CPPFLAGS"
    CPPFLAGS="$CPPFLAGS $PYTHON_INCLUDES"
    AC_TRY_CPP([
    #include <Python.h>
    ],
    [AC_MSG_RESULT(found)
    ],
    [AC_MSG_RESULT(not found)
    mbd_check_python_failure=yes
    mbd_check_python_msb="Unable to locate the Python.h header file"])
    CPPFLAGS="$save_CPPFLAGS"
  fi

  dnl Now, check what libraries python needs. 
  dnl This test needs support from distutils.sysconfig.get_config_var
  dnl One should probably check for this first. Dunno how, though
  if test "x$mbd_check_python_failure" != "xyes"; then
    AC_MSG_CHECKING([for libraries needed to compile with Python])
    changequote(<<, >>)dnl
    PYTHON_LIBS=`$PYTHON -c "from distutils.sysconfig import get_config_var; print get_config_var(\"LIBS\")"`
    PYTHON_SYSLIBS=`$PYTHON -c "from distutils.sysconfig import get_config_var; print get_config_var(\"SYSLIBS\")"`
    PYTHON_XLINKER=`$PYTHON -c "from distutils.sysconfig import get_config_var; print get_config_var(\"LINKFORSHARED\")"`
    changequote([, ])dnl
    PYTHON_LIBS="$PYTHON_LIBS $PYTHON_SYSLIBS $PYTHON_XLINKER"
    AC_SUBST(PYTHON_LIBS)
    dnl Find the directory with the libpython file in
    dnl I do not know which of py_prefix and py_exec_prefix that is the correct to use
    PYTHON_LIBDIR="${py_prefix}/lib/python${PYTHON_VERSION}/config" 
    PYTHON_LDFLAGS="-L$PYTHON_LIBDIR"
    if test "$py_prefix" != "$py_exec_prefix"; then
      PYTHON_LDFLAGS="$PYTHON_LDFLAGS -L${py_exec_prefix}/lib/python${PYTHON_VERSION}/config"
    fi
    AC_SUBST(PYTHON_LIBDIR)
    AC_SUBST(PYTHON_LDFLAGS)
    dnl Buils the libpython name
    PYTHON_LIBNAME="python$PYTHON_VERSION"
    PYTHON_LIBRARY="-l$PYTHON_LIBNAME"
    AC_SUBST(PYTHON_LIBNAME)
    AC_SUBST(PYTHON_LIBRARY)
    AC_MSG_RESULT([found])
 
    dnl Perform a link check. Stolen from KDE
    AC_MSG_CHECKING(if we can link against Python)
    dnl Save some language stuff
    AC_LANG_SAVE
    AC_LANG_C
    dnl Save flags
    mbd_save_cflags="$CFLAGS"
    CFLAGS="$CFLAGS $PYTHON_INCLUDES"
    mbd_save_libs="$LIBS"
    LIBS="$LIBS $PYTHON_LIBS $PYTHON_LIBRARY"
    mbd_save_ldflags="$LD_FLAGS"
    LDFLAGS="$LD_FLAGS $PYTHON_LDFLAGS"
    dnl Try the link
    AC_TRY_LINK(
    [
#include <Python.h>
    ],[
    PySys_SetArgv(1, 0);
    ],
    [mbd_try_link_python=yes],
    [mbd_try_link_python=no]
    )
    dnl Restore flags
    CFLAGS="$mbd_save_cflags"
    LIBS="$mbd_save_libs"
    LDFLAGS="$mbd_save_ldflags"
    AC_LANG_RESTORE
    dnl Handle result
    if test "$mbd_try_link_python" = "yes"; then
      AC_MSG_RESULT(yes)
    else
      AC_MSG_RESULT(no)
      mbd_check_python_failure=yes
      mbd_check_python_msg="Unable to link against Python"
    fi
 fi
 ]
)