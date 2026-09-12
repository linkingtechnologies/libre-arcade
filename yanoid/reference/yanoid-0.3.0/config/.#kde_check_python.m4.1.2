dnl These macros was stolen from the kde libraries. 

AC_DEFUN(KDE_TRY_LINK_PYTHON,
[
if test "$kde_python_link_found" = no; then

if test "$1" = normal; then
  AC_MSG_CHECKING(if a Python application links)
else
  AC_MSG_CHECKING(if Python depends on $2)
fi

AC_CACHE_VAL(kde_cv_try_link_python_$1,
[
AC_LANG_SAVE
AC_LANG_C
kde_save_cflags="$CFLAGS"
CFLAGS="$CFLAGS $PYTHONINC"
kde_save_libs="$LIBS"
LIBS="$LIBS $LIBPYTHON $2 $LIBDL $LIBSOCKET"
kde_save_ldflags="$LDFLAGS"
LDFLAGS="$LDFLAGS $PYTHONLIB"

AC_TRY_LINK(
[
#include <Python.h>
],[
        PySys_SetArgv(1, 0);
],
        [kde_cv_try_link_python_$1=yes],
        [kde_cv_try_link_python_$1=no]
)
CFLAGS="$kde_save_cflags"
LIBS="$kde_save_libs"
LDFLAGS="$kde_save_ldflags"
])

if test "$kde_cv_try_link_python_$1" = "yes"; then
  AC_MSG_RESULT(yes)
  kde_python_link_found=yes
  if test ! "$1" = normal; then
    LIBPYTHON="$LIBPYTHON $2"
  fi
  $3
else
  AC_MSG_RESULT(no)
  $4
fi
AC_LANG_RESTORE

fi

])

dnl This macro is called from the configure script.

AC_DEFUN(KDE_CHECK_PYTHON,
[

AC_MSG_CHECKING([for Python directory])

AC_CACHE_VAL(kde_cv_pythondir,
[
  if test -z "$PYTHONDIR"; then
    kde_cv_pythondir=/usr/local
  else
    kde_cv_pythondir="$PYTHONDIR"
  fi
])

AC_ARG_WITH(pythondir,
[  --with-pythondir=pythondir   use python installed in pythondir ],
[
  ac_python_dir=$withval
], ac_python_dir=$kde_cv_pythondir
)

AC_MSG_RESULT($ac_python_dir)

version="2.0"

AC_MSG_CHECKING([for Python$version])

python_incdirs="$ac_python_dir/include /usr/include /usr/local/include/ $kde_extra_includes"
AC_FIND_FILE(Python.h, $python_incdirs, python_incdir)
if test ! -r $python_incdir/Python.h; then
  AC_FIND_FILE(python$version/Python.h, $python_incdirs, python_incdir)
  python_incdir=$python_incdir/python$version
  if test ! -r $python_incdir/Python.h; then
    AC_MSG_ERROR(Python.h not found.)
  fi
fi

PYTHONINC=-I$python_incdir

python_libdirs="$ac_python_dir/lib /usr/lib /usr/local /usr/lib $kde_extra_libs"

AC_FIND_FILE(libpython$version.a, $python_libdirs, python_libdir)
if test ! -r $python_libdir/libpython$version.a; then
  AC_FIND_FILE(python$version/config/libpython$version.a, $python_libdirs, python_libdir)
  python_libdir=$python_libdir/python$version/config
  if test ! -r $python_libdir/libpython$version.a; then
    AC_MSG_ERROR(libpython$version.a not found.)
  fi
fi

PYTHONLIB=-L$python_libdir
if test -z "$LIBPYTHON"; then
LIBPYTHON=-lpython$version
fi

AC_MSG_RESULT(header $python_incdir library $python_libdir)

dnl Note: this test is very weak
if test "x$kde_python_link_found" = "x" ; then 
  kde_python_link_found=no
fi
KDE_TRY_LINK_PYTHON(normal)
dnl KDE_TRY_LINK_PYTHON(m, $text_version, -lm)
dnl KDE_TRY_LINK_PYTHON(pthread, $text_version, $LIBPTHREAD)
dnl KDE_TRY_LINK_PYTHON(tcl, $text_version, -ltcl)
KDE_TRY_LINK_PYTHON(alot, -lnsl -ldl -lreadline -ltermcap -lpthread -lutil)
dnl KDE_TRY_LINK_PYTHON(m_and_thread, $version, [$LIBPTHREAD -lm], [],
dnl        [AC_MSG_WARN([it seems, Python depends on a library we were not able to anticipate
dnl	Please contact the authors of yanoid to let them know about this problem])
dnl        ])

LIBPYTHON="$LIBPYTHON $LIBDL $LIBSOCKET"
AC_SUBST(PYTHONINC)
AC_SUBST(PYTHONLIB)
AC_SUBST(LIBPYTHON)

])
