#!/usr/bin/env bash
# Deploy testing environment for development
#
# Copyright 2024 Buo-ren Lin <buoren.lin@ossii.com.tw>
# SPDX-License-Identifier: LicenseRef-Proprietary

# Whether to disable SELinux for convenience
DISABLE_SELINUX="${DISABLE_SELINUX:-true}"

printf \
    'Info: Configuring the defensive interpreter behaviors...\n'
set_opts=(
    # Terminate script execution when an unhandled error occurs
    -o errexit
    -o errtrace

    # Terminate script execution when an unset parameter variable is
    # referenced
    -o nounset
)
if ! set "${set_opts[@]}"; then
    printf \
        'Error: Unable to configure the defensive interpreter behaviors.\n' \
        1>&2
    exit 1
fi

printf \
    'Info: Setting the ERR trap...\n'
trap_err(){
    printf \
        'Error: The program prematurely terminated due to an unhandled error.\n' \
        1>&2
    exit 99
}
if ! trap trap_err ERR; then
    printf \
        'Error: Unable to set the ERR trap.\n' \
        1>&2
    exit 1
fi

printf \
    'Info: Checking runtime parameters...\n'
regex_boolean_values='^(true|false)$'
if ! [[ "${DISABLE_SELINUX}" =~ ${regex_boolean_values} ]]; then
    printf \
        "Error: The DISABLE_SELINUX parameter's value(%s) is invalid.\\n" \
        "${DISABLE_SELINUX}" \
        1>&2
    exit 2
fi

printf \
    'Info: Checking the existence of the required commands...\n'
required_commands=(
    # For generating the operation timestamp
    date

    dnf
)
flag_required_command_check_failed=false
for command in "${required_commands[@]}"; do
    if ! command -v "${command}" >/dev/null; then
        flag_required_command_check_failed=true
        printf \
            'Error: This program requires the "%s" command to be available in your command search PATHs.\n' \
            "${command}" \
            1>&2
    fi
done
if test "${flag_required_command_check_failed}" == true; then
    printf \
        'Error: Required command check failed, please check your installation.\n' \
        1>&2
    exit 1
fi

if test "${EUID}" -ne 0; then
    printf \
        'Error: This program is required to be run as the superuser(root).\n' \
        1>&2
    exit 1
fi

printf \
    'Info: Determining the operation timestamp...\n'
if ! operation_timestamp="$(date +%Y%m%d-%H%M%S)"; then
    printf \
        'Error: Unable to determine the operation timestamp.\n' \
        1>&2
    exit 2
fi

printf \
    'Info: Applying full system upgrade to apply possible OS bug fixes...\n'
if ! dnf upgrade -y; then
    printf \
        'Error: Unable to apply full system upgrade to apply possible OS bug fixes.\n' \
        1>&2
    exit 2
fi

printf \
    'Info: Installing program runtime dependencies...\n'
runtime_dependency_pkgs=(
    # For matching program output using expected expressions
    grep

    # For patching the SELinux configuration file
    sed

    # For configuring the members of the systemd-journal user group
    shadow-utils

    # For configuring third-party software repostitories
    wget

    # Provides `dnf config-manager` command
    yum-utils
)
if ! dnf install -y "${runtime_dependency_pkgs[@]}"; then
    printf \
        'Error: Unable to install program runtime dependencies.\n' \
        1>&2
    exit 2
fi

printf \
    'Info: Configuring the Yum repository of OxOffice Online v5...\n'
wget_opts=(
    --directory-prefix /etc/yum.repos.d
)
if ! wget "${wget_opts[@]}" \
    http://www.oxoffice.com.tw/rpm/el/oxool-community-v5-el8.repo; then
    printf \
        'Error: Unable to configure the Yum repository of OxOffice Online v5.\n' \
        1>&2
    exit 2
fi

printf \
    "Info: Configuring the EPEL software repository, which provides libiodbc which is poco-odbc's dependency...\\n"
if ! dnf install epel-release -y; then
    printf \
        'Error: Unable to configure the EPEL software repository.\n' \
        1>&2
    exit 2
fi

printf \
    'Info: Upgrading all packages...\n'
if ! dnf upgrade -y; then
    printf \
        'Error: Unable to upgrade all packages.\n' \
        1>&2
    exit 2
fi

printf \
    'Info: Enabling the nodejs:18 dnf module...\n'
if ! dnf module enable nodejs:18 -y; then
    printf \
        'Error: Unable to enable the nodejs:18 dnf module.\n' \
        1>&2
    exit 2
fi

# For the cppunit development package
printf \
    'Info: Configuring the powertools software repository...\n'
if ! dnf config-manager --set-enabled powertools; then
    printf \
        'Error: Unable to configure the powertools software repository.\n' \
        1>&2
    exit 2
fi

printf \
    'Info: Installing the OxOffice Online build dependencies...\n'
oxool_build_dep_pkgs=(
    ccache
    cppunit-devel
    fontconfig-devel
    gcc-c++
    git
    libcap-devel
    libgit2-devel
    libpcap
    libtool
    libzstd-devel
    make
    nodejs
    pam-devel
    'poco*'
    poco-devel
    python3-devel
    python3-lxml
    python3-polib
    rpm-build
    rsync
    yum-utils
)
if ! dnf install -y "${oxool_build_dep_pkgs[@]}"; then
    printf \
        'Error: Unable to install the OxOffice Online build dependencies.\n' \
        1>&2
    exit 2
fi

if getent passwd vagrant >/dev/null; then
    printf \
        'Info: Allowing the vagrant user to access service logs...\n'
    usermod_opts=(
        # Append group ownership instead of replace
        --append
        --groups systemd-journal
    )
    if ! usermod "${usermod_opts[@]}" vagrant; then
        printf \
            'Error: Unable to allow the vagrant user to access service logs...\n' \
            1>&2
        exit 2
    fi
fi

printf \
    'Info: Installing the auxillary utilities for debugging...\n'
auxillary_utility_pkgs=(
    # For editing system and product source files
    vim

    # For checking port listening processes using the netstat utility
    net-tools
)
if ! dnf install "${auxillary_utility_pkgs[@]}" -y; then
    printf \
        'Error: Unable to install the auxillary utilities for debugging.\n' \
        1>&2
    exit 2
fi

if command -v getenforce >/dev/null \
    && test "${DISABLE_SELINUX}" == true; then
    if ! selinux_status="$(LANG=C getenforce)"; then
        printf \
            'Error: Unable to query SELinux status.\n' \
            1>&2
        exit 2
    fi

    if test "${selinux_status}" == Enforcing; then
        printf \
            'WARNING: Disabling SELinux for convenience...\n' \
            1>&2

        selinux_configuration_file=/etc/selinux/config

        # NOTE: In docker container this file won't exist
        if test -e "${selinux_configuration_file}"; then
            sed_opts=(
                --in-place=".orig-${operation_timestamp}"
                --regexp-extended
                --expression='s@^SELINUX=[^\n]*@SELINUX=permissive@'
            )
            if ! sed "${sed_opts[@]}" "${selinux_configuration_file}"; then
                printf \
                    'Error: Unable to patch the SELinux configuration file.\n' \
                    1>&2
                exit 2
            fi
        fi

        if ! setenforce 0; then
            printf \
                'Error: Unable to disable SELinux.\n' \
                1>&2
            exit 2
        fi
    fi
fi

if command -v firewall-cmd >/dev/null \
    && ! firewall-cmd --list-ports | grep -qF 9980; then
    printf \
        'Info: Configuring firewall whitelist for the OXOOL service port...\n'
    if ! firewall-cmd --add-port=9980/tcp; then
        printf \
            'Error: Unable to configure firewall whitelist for the OXOOL service port.\n' \
            1>&2
        exit 2
    fi

    if ! firewall-cmd --runtime-to-permanent; then
        printf \
            'Error: Unable to set runtime firewall configuration to permanent.\n' \
            1>&2
        exit 2
    fi
fi

printf \
    'Info: Operation completed without errors.  Run "vagrant provision default --provision-with nextcloud" if you need a Nextcloud deployment.\n'
