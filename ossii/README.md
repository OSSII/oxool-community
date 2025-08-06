# ossii

OSSII-specific assets and implementations, including but not limited to:

* Custom frontend
* Custom backend
* Custom module architecture

## Build RPM package

Refer to the following instructions to build RPM packages from source, you should have the development environment set up and have acquired its shell first.

1. Change the working directory to the root directory of the source tree.
1. Run the following command to build the build configuration program:

    ```bash
    ./autogen.sh
    ```

1. Run the following command to build the source distribution tarball:

    ```bash
    make dist
    ```

1. Run the following command to build the binary RPM packages from the source distribution tarball(replace the `X.Y.Z` placeholder version string to the actual version):

    ```bash
    rpmbuild -tb oxool-X.Y.Z.tar.gz
    ```

   After building you should be able to locate the built binary RPM packages at the `~/rpmbuild/RPMS` directory.
