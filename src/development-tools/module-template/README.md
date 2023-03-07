## OxOffice Online Module.

**src/**

C++ based shared library for module. Automatically loaded during OxOOL execution time,and manage the specified service URI.

The service URI is defined in module.xml.in.

**html/**

If you don't want to implement a C++ module, you can leave <load>xxxx.so<load> in module.xml.in blank, and in the html directory, create a normal type of webpage, OxOOL will manage it automatically.

The default web page name is index.html or index.php (will be supported in the future).

**admin/**

If you have a console management interface, Please enter the name of the option to be displayed, Defined in <adminItem> in module.xml.in.

This will allow you to see your admin interface at the following URL:

http(s)://yourhost:9980/loleaflet/dist/admin/admin.html

Console management uses some fremawork:

JQuery, JQuery-UI, and Bootstrap 5.

You can also include other javascript packages in your project.

**module.xml.in**

Module definition configuration file in XML format.

All module behaviors are defined here.

If you want to change settings or attributes, please use the 'oxool-xml-config' command to avoid conflicts with XML-specific characters.

For details, please refer to the __ModuleConfiguration.md__ description.

##### __Build the module manually:__

```
./autogen.sh
./configure
make
```

##### __Compile the RPM package steps:__

```
./autogen.sh
./configure
make dist
rpmbuild -tb oxool-module-[name]....tag.gz
```

Then you will see oxool-module-[name]-...x86_64.rpm in \~/rpmbuild/RPMS/x86_64/

##### __Compile the DEB package steps:__

```
./autogen.sh
./configure
dpkg-buildpackage -b -rfakeroot -uc -us
```

Then you will see oxool-module-[name]\_...-1.amd64.deb in perent directory.

##### __Test during development:__

Please use 'maek run' to enable the test environment.

Then in the project directory, modify and compile the code, To view the results locally, you can enter the command:

```
test.sh <project name>.xml
```

Then you can test your mod through browser or curl command.

Enjoy.