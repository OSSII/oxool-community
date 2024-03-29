# spec file for package oxool
#
# Copyright (c) 2015 OSSII
#
# This file is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

%define config_options --disable-debug --enable-ssl -with-max-documents=10240 --with-max-connections=10240
%define loroot /opt/oxoffice

Name:           oxool
Version:        4.2.0
Release:        1.community%{?dist}
Vendor:         %{vendor}
Summary:        OxOffice Online WebSocket Daemon for community
License:        MPL
Provides:       oxoolwsd
Obsoletes:	    oxoolwsd
Obsoletes:	    %{name}-modules
Source0:        oxool-%{version}-community.tar.gz
BuildRequires:  libcap-devel libpng-devel pam-devel gcc-c++ cppunit-devel make
BuildRequires:  poco-devel >= 1.7.5
BuildRequires:  freetype-devel >= 2.8 fontconfig-devel >= 2.12.6
BuildRequires:  libgit2-devel

# RHEL and its derivatives
%if 0%{?rhel} == 7
BuildRequires:  libpcap kernel-headers python36-polib python36-lxml
%endif

%if 0%{?rhel} == 8
BuildRequires:  libpcap kernel-headers python3-polib python3-lxml
%endif

Requires:       oxoffice oxoffice-ure oxofficelib-core oxofficelib-writer oxofficelib-impress oxofficelib-graphicfilter oxofficelib-en-US oxofficelib-calc oxofficelib-ooofonts oxofficelib-images oxofficelib-draw oxofficelib-extension-pdf-import oxofficelib-ooolinguistic oxofficelib-math
Requires(post): coreutils grep sed cpio
# oxoolwsd dependencies
Requires:       systemd expat keyutils-libs krb5-libs libattr libcap libcom_err libgcc libpng libselinux openssh-clients openssl-libs pcre xz-libs zlib unzip sudo fontconfig freetype libuuid bzip2-libs
Requires:       poco-crypto >= 1.7.5 poco-data >= 1.7.5 poco-encodings >= 1.7.5 poco-foundation >= 1.7.5 poco-json >= 1.7.5 poco-mongodb >= 1.7.5 poco-mysql >= 1.7.5 poco-net >= 1.7.5 poco-netssl >= 1.7.5 poco-odbc >= 1.7.5 poco-pagecompiler >= 1.7.5 poco-sqlite >= 1.7.5 poco-util >= 1.7.5 poco-xml >= 1.7.5 poco-zip >= 1.7.5

%description

%package	devel
Summary:	Files for build OxOffice Online Editor.
Requires:	%{name} = %{version}
Requires:	poco-devel >= 1.7.5
Requires:	libgit2
%description	devel
Files for build OxOffice Online Editor.

%prep
%setup -q -n %{name}-%{version}-community

%build
%configure \
	--enable-silent-rules \
	--with-lokit-path=bundled/include \
	--with-lo-path=%{loroot} \
	--disable-setcap \
%if 0%{?config_options:1}
	%{config_options}
%endif

env BUILDING_FROM_RPMBUILD=yes make %{?_smp_mflags}

%check
#env BUILDING_FROM_RPMBUILD=yes make check

%install
env BUILDING_FROM_RPMBUILD=yes make install DESTDIR=%{buildroot}
rm -f %{buildroot}/%{_libdir}/*.la
rm -f %{buildroot}/%{_libdir}/oxool/*.la
install -d -m 755 %{buildroot}/var/adm/fillup-templates
%if 0%{?rhel}
install -D -m 444 oxoolwsd.service %{buildroot}%{_unitdir}/oxoolwsd.service
# systemd in RHEL 7 does not understand these options
%if 0%{?rhel} <= 7
sed -i "/^ReadWritePaths/d;/^ProtectControlGroups/d;/^ProtectSystem/d" %{buildroot}%{_unitdir}/oxoolwsd.service
%endif
%endif
mkdir -p %{buildroot}/etc/pam.d
echo "auth       required     pam_unix.so" > %{buildroot}/etc/pam.d/%{name}
echo "account    required     pam_unix.so" >>  %{buildroot}/etc/pam.d/%{name}

%files
%defattr(-,root,root,-)
%{_bindir}/oxoolconfig
%{_bindir}/oxoolconvert
%{_bindir}/oxoolforkit
%{_bindir}/oxoolmount
%{_bindir}/oxoolwsd
%{_bindir}/oxoolwsd-generate-proof-key
%{_bindir}/oxoolwsd-systemplate-setup
%{_bindir}/oxool-xml-config
%{_libdir}/*.so.*
%dir /usr/share/%{name}
/usr/share/%{name}/loleaflet
/usr/share/%{name}/discovery.xml
/usr/share/%{name}/favicon.ico
/usr/share/%{name}/extensions
/usr/share/doc/%{name}/*
/usr/share/man/man1/*
/etc/fonts/conf.d/*.conf
%dir %attr(755, lool, root) /usr/share/fonts/%{name}
%dir %attr(750, lool, root) /usr/share/%{name}/support
%{_unitdir}/oxoolwsd.service
%config(noreplace) /etc/sysconfig/oxoolwsd

%dir /etc/%{name}
%dir /etc/%{name}/conf.d
%dir %{_libdir}/%{name}
%config(noreplace) /etc/pam.d/%{name}
%config(noreplace) %attr(640, lool, root) /etc/%{name}/oxoolwsd.xml
%config /etc/%{name}/oxoolkitconfig.xcu
%config(noreplace) /etc/%{name}/*.pem
%config %attr(440, root, root) /etc/sudoers.d/lool
%{_libdir}/oxool/*.so
/etc/%{name}/conf.d/*
/usr/share/%{name}/modules

%files devel
%{_includedir}/*
%{_libdir}/*.so
%{_libdir}/pkgconfig/*.pc
%{_bindir}/%{name}-module-maker
%{_datadir}/%{name}-devel/module-template

%pre
getent group lool >/dev/null || groupadd -r lool
getent passwd lool >/dev/null || useradd -g lool -r lool -d /opt/oxool -s /bin/bash

%post
setcap cap_dac_override,cap_net_bind_service=ep /usr/bin/oxoolwsd
setcap cap_fowner,cap_chown,cap_mknod,cap_sys_chroot=ep /usr/bin/oxoolforkit
setcap cap_sys_admin=ep /usr/bin/oxoolmount

%if 0%{?fedora} || 0%{?rhel} >= 7
%systemd_post oxoolwsd.service
%endif

%triggerin -- expat fontconfig freetype freetype2 glibc glibc-locale kernel keyutils-libs krb5 krb5-libs libbz2-1 libcap libcap-ng libcap2 libexpat1 libfreetype6 libgcc libgcc_s1 libgcrypt libiscsi libpng libpng12 libpng12-0 libpng15-15 libpng16-16 libstdc++ libstdc++6 libuuid libuuid1 libz1 lsb nss-mdns nss-softokn-freebl pcre sssd sssd-client systemd-libs timezone tzdata zlib

echo -ne "Triggered update of oxoolwsd systemplate..."

%if 0%{?rhel} >= 7 || 0%{?suse_version} >= 1300
systemctl is-active -q oxoolwsd && OXOOLWSD_IS_ACTIVE=1 || OXOOLWSD_IS_ACTIVE=0
if [ $OXOOLWSD_IS_ACTIVE == "1" ]; then systemctl stop oxoolwsd; fi
%endif

# Figure out where LO is installed, let's hope it is not a mount point
# Create a directory for oxloolwsd on the same file system
loroot=%{loroot}
loolparent=`cd ${loroot} && cd .. && /bin/pwd`

rm -rf ${loolparent}/%{name}
mkdir -p ${loolparent}/%{name}/child-roots
chown lool:lool ${loolparent}/%{name}
chown lool:lool ${loolparent}/%{name}/child-roots

fc-cache ${loroot}/share/fonts/truetype
su lool -c "oxoolwsd-systemplate-setup ${loolparent}/%{name}/systemplate ${loroot} >/dev/null 2>&1"
oxoolwsd-generate-proof-key >/dev/null 2>&1

%if 0%{?rhel} || 0%{?suse_version}
if [ $OXOOLWSD_IS_ACTIVE == "1" ]; then systemctl start oxoolwsd; fi
%endif

echo "   Done."

%preun
%if 0%{?fedora} || 0%{?rhel} >= 7
%systemd_preun oxoolwsd.service
%endif

%postun
arg="$1"
fc-cache -f
%if 0%{?fedora} || 0%{?rhel} >= 7
%systemd_postun oxoolwsd.service
%endif

# Real uninstall
# 如果是1，表示是 upgrade，不需要刪除檔案
if [ $arg = 0 ] ; then
    # log file
    rm -f /var/log/oxoolwsd.log*
    # systemplate & child root
    loroot=%{loroot}
    loolparent=`cd ${loroot} && cd .. && /bin/pwd`
    rm -rf ${loolparent}/%{name}/*
fi


%changelog
