#!/usr/bin/env python
from setuptools import setup
from game.const import VERSION, PROJECT_DESC, PROJECT_URL

def readme():
    try:
        return open('README.txt').read()
    except:
        return ""

name = 'forscience'

setup(name=name,
      version=VERSION,
      description=PROJECT_DESC,
      long_description=readme(),
      author='Juan J. Martinez',
      author_email='jjm@usebox.net',
      url=PROJECT_URL,
      license='GPL',
      install_requires=['pyglet>=1.2.0', 'cocos>=0.5.5',],
      include_package_data=True,
      zip_safe=False,
      scripts=[name],
      packages=['game'],
      classifiers = [
        #'Development Status :: 5 - Production/Stable',
        'Development Status :: 4 - Beta',
        'Programming Language :: Python',
        'Operating System :: OS Independent',
        'License :: OSI Approved :: MIT License',
        'Topic :: Games/Entertainment',
        'Intended Audience :: End Users/Desktop',
        ],
      )

