# from-packages

Docker container image build recipe that utilizes pre-built packages.

## Build

The following sections explains how to build the container image of OxOffice Online:

### Prerequisites

The following prerequisites must be satisfied in order to run the instructions in this document:

* Docker Engine  
  Must be a version that implements the BuildKit Docker Build backend.
* Your container host must not have an existing `oxool-community-5` container, stop and remove the container in advance.

The final layout of this directory should be like the following `tree` output:

```tree
.
├── docker-compose.yaml
├── Dockerfile
├── README.md
└── scripts
    └── docker-entrypoint.sh

3 directories, 4 files
```

### Container image building process

Follow the following instructions to build the container image:

1. Launch your preferred text terminal emulator application.
1. Change the working directory to the directory hosting this document.
1. Run the following command to build the container image:

    ```bash
    docker build -t oxool:community-5-latest .
    ```

   **NOTE:** Depending on your Docker installation you may need to run this (and all other Docker) command(s) _as root_.

   The command output should be similar to the following:

    ```txt
    [+] Building 66.8s (11/11) FINISHED                                         docker:default
    => [internal] load build definition from Dockerfile                                  0.0s
    => => transferring dockerfile: 3.34kB                                                0.0s
    => resolve image config for docker-image://docker.io/docker/dockerfile:1             1.6s
    => CACHED docker-image://docker.io/docker/dockerfile:1@sha256:db1ff77fb637a5955317c  0.0s
    => [internal] load build definition from Dockerfile                                  0.0s
    => [internal] load metadata for docker.io/library/rockylinux:8                       0.0s
    => [internal] load .dockerignore                                                     0.0s
    => => transferring context: 264B                                                     0.0s
    => [internal] load build context                                                     0.0s
    => => transferring context: 13.24kB                                                  0.0s
    => CACHED [stage-0 1/3] FROM docker.io/library/rockylinux:8                          0.0s
    => [stage-0 2/3] RUN --mount=type=bind,source=.,target=/build-context     dnf inst  62.4s
    => [stage-0 3/3] COPY /scripts/docker-entrypoint.sh /docker-entrypoint.sh            0.1s
    => exporting to image                                                                2.4s
    => => exporting layers                                                               2.3s
    => => writing image sha256:25f93f1192c09f6d7cf268873028bd32f2a1d7406d944d4061239ac5  0.0s
    => => naming to docker.io/library/oxool:community-5-latest                           0.0s
    ```

   and the built container image should be available locally under the `oxool:community-5-latest` image reference string.

## Usage

You may create and launch containers from the built container image using the following methods:

### Prepare service files that are compatible with the container installation

Service files used by the container installation has specific requirements to met in order to avoid problems in runtime:

#### If you yet having an existing service configuration to use

Refer to the following steps to import service configuration from the container image:

1. Run the following commands to launch a temporary container for fetching the original service configuration files:

    ```bash
    docker_run_opts=(
        # Configure the container name so that it can be used to reference the running container in the Docker CLI
        --name oxool-community-5

        # Remove container and its data in the writable layer after stopping
        # All data that is not stored in a volume or bind mount will be lost
        --rm

        # Detach the controlling terminal after container creation, this allows you to continue running commands in the current terminal
        -d
    )
    docker run "${docker_run_opts[@]}" oxool:community-5-latest
    ```

1. Run the following commands to have a copy of the service configuration files in the directory hosting this document:

    ```bash
    docker_cp_opts=(
        # Preserve file ownership and permissions
        --archive
    )
    docker cp "${docker_cp_opts[@]}" oxool-community-5:/etc/oxool/ config
    ```

1. Run the following commands to stop and destroy the temporary container:

    ```bash
    docker container stop oxool-community-5
    ```

#### If you are migrating your native installation to container installation

Refer to the following steps to prepare your service files from your native installation to be compatible with the container installation:

1. Launch your preferred text terminal emulator application.
1. Change the working directory to the directory that hosts this document.
1. Run the following commands _as root_ to ensure that there's no previous config directories in the directory that hosts this document:

    ```bash
    rm_opts=(
        --recursive

        # Don't error even when specified file isn't found
        --force
    )
    rm "${rm_opts[@]}" config config.reference
    ```

1. Run the following commands _as root_ to copy your native installation's configuration directory to the directory that hosts this document:

    ```bash
    cp_opts=(
        --recursive
        --archive
    )
    cp "${cp_opts[@]}" /etc/oxool config
    ```

1. Run the following commands to launch a temporary container for fetching the original service configuration files:

    ```bash
    docker_run_opts=(
        # Configure the container name so that it can be used to reference the running container in the Docker CLI
        --name oxool-community-5

        # Remove container and its data in the writable layer after stopping
        # All data that is not stored in a volume or bind mount will be lost
        --rm

        # Detach the controlling terminal after container creation, this allows you to continue running commands in the current terminal
        -d
    )
    docker run "${docker_run_opts[@]}" oxool:community-5-latest
    ```

1. Run the following commands to have a copy of the reference service configuration files in the directory hosting this document:

    ```bash
    docker_cp_opts=(
        # Preserve file ownership and permissions
        --archive
    )
    docker cp "${docker_cp_opts[@]}" oxool-community-5:/etc/oxool/ config.reference
    ```

1. Run the following commands to stop and destroy the container:

    ```bash
    docker container stop oxool-community-5
    ```

1. Run the following commands to list file ownership and permission settings of the current and reference configuration directories:

    ```bash
    ls_opts=(
        # Use the long listing output format
        -l

        # List directories themselves, not their contents
        --directory
    )
    ls "${ls_opts[@]}" config*

    ls_opts=(
        -l
        --recursive
    )
    ls "${ls_opts[@]}" config*
    ```

1. Use the `chown` and `chmod` commands to fix the file ownership and permissions settings using the config.reference directory as reference.  You may found the `--reference` command option of these commands helpful.

### Launch the service directly from the container image

Refer to the following steps to launch the service:

1. Launch your preferred text terminal emulator application.
1. Change the working directory to the directory that hosts this document.
1. Run the following commands to directly create and run a container from the built container image:

    ```bash
    docker_run_opts=(
        # Configure the container name so that it can be used to reference the running container in the Docker CLI
        --name oxool-community-5

        # Detach the controlling terminal after container creation, this allows you to continue running commands in the current terminal
        -d

        # Publish container port to the host
        # NOTE: Change the host IP address to one that is accessible by the WOPI application, avoid unnecessarily publish the container port to the public
        -p 127.0.0.1:9980:9980

        # Always restart the container after crashes
        --restart always

        # Configure timezone so that proper log timestamps will be used, refer the following webpage for more information:
        #
        # The GNU C Library - TZ Variable
        # https://ftp.gnu.org/old-gnu/Manuals/glibc-2.2.3/html_node/libc_431.html
        #--env=TZ=Asia/Taipei

        # Mount the configuration directory into the container
        --mount type=bind,source=./config,destination=/etc/oxool

        # Grant Linux capabilities required for the service to operate (optimally)
        --cap-add=CHOWN
        --cap-add=DAC_OVERRIDE
        --cap-add=FOWNER
        --cap-add=MKNOD
        --cap-add=SYS_ADMIN
        --cap-add=SYS_CHROOT
    )
    docker run "${docker_run_opts[@]}" oxool:community-5-latest
    ```

### Launch the service using Docker Compose

Refer to the following steps to launch the service:

1. Launch your preferred text terminal emulator application.
1. Change the working directory to the directory that hosts this document.
1. Run the following commands to directly create and run a container from the built container image:

    ```bash
    docker_compose_up_opts=(
        # Detach the controlling terminal after container creation, this allows you to continue running commands in the current terminal
        -d
    )
    docker compose up "${docker_compose_up_opts[@]}"
    ```

   If you also want a Nextcloud container running for demonstration purposes, run the following commands instead:

    ```bash
    docker_compose_opts=(
        # Start the containers that matches the "demo" profile as well
        --profile demo
    )
    docker_compose_up_opts=(
        # Detach the controlling terminal after container creation, this allows you to continue running commands in the current terminal
        -d
    )
    docker compose "${docker_compose_opts[@]}" up "${docker_compose_up_opts[@]}"
    ```

   Note that in this usecases both containers' service port must be _published to a non-loopback address_.

## Operations

The following sections documents common operations for maintaining the containerized service:

### Start the service

Run the following commands to start the OxOffice Online service:

```bash
docker start oxool-community-5
```

If you're using Docker Compose you can also use this command after changing the working directory to the directory hosting this document:

```bash
docker compose start oxool
```

### Stop the service

Run the following commands to stop the OxOffice Online service:

```bash
docker stop oxool-community-5
```

If you're using Docker Compose you can also use this command after changing the working directory to the directory hosting this document:

```bash
docker compose stop oxool
```

### Check the service logs

Run the following commands to check the OxOffice Online service logs:

```bash
docker_logs_opts=(
    # Show the last 100 log entries
    --tail=100

    # Follow and print new log entries to the stdout
    #--follow
)
docker logs "${docker_logs_opts[@]}" oxool-community-5
```

If you're using Docker Compose you can also use these commands after changing the working directory to the directory hosting this document:

```bash
docker_compose_logs_opts=(
    # Show the last 100 log entries
    --tail=100

    # Follow and print new log entries to the stdout
    #--follow
)
docker compose logs "${docker_logs_opts[@]}" oxool
```

### Destroy the service container

Run the following commands to destroy and remove the service container:

```bash
docker container rm oxool-community-5
```

The container [must be stopped first](#stop-the-service) before doing this operation.

If you're using Docker Compose you can also use this command after changing the working directory to the directory hosting this document:

```bash
docker compose down oxool
```

## References

The following materials are referenced during the writing of this documentation:

* [Docker images — SDK https://sdk.collaboraonline.com/ documentation](https://sdk.collaboraonline.com/docs/installation/Docker_image.html)  
  Explains the Docker image building process of the upstream Collabora Online service.
* [online/docker/from-packages at master · CollaboraOnline/online](https://github.com/CollaboraOnline/online/tree/master/docker/from-packages)  
  Provides a reference implementation of building Docker images of LibreOffice Online-like services.
* [Docker Build Overview | Docker Docs](https://docs.docker.com/build/concepts/overview/)  
  For basic concepts of building container images using Docker Build.
* [Dockerfile overview | Docker Docs](https://docs.docker.com/build/concepts/dockerfile/)  
  For the naming convention, common concepts, and general process of designing a Dockerfile.
* [Build context | Docker Docs](https://docs.docker.com/build/concepts/context/)  
  Explains what a build context is, and how to exclude files from being included into the build context to reduce build time.
* [Dockerfile instructions | Best practices | Docker Docs](https://docs.docker.com/build/building/best-practices/#dockerfile-instructions)  
  Explains how to use bind mounts to avoid RPM packages being unnecessarily copied into the container image layer, and the best practices of using the ENTRYPOINT and CMD Dockerfile instructions.
* [CODE Docker image — SDK https://sdk.collaboraonline.com/ documentation](https://sdk.collaboraonline.com/docs/installation/CODE_Docker_image.html)  
  Explains how to properly create and launch LibreOffice Online-like service Docker containers from container images, and how to configure it.
* [postgres/Dockerfile-debian.template at 0b87a9b · docker-library/postgres](https://github.com/docker-library/postgres/blob/0b87a9b/Dockerfile-debian.template)  
  [postgres/docker-entrypoint.sh at 0b87a9b · docker-library/postgres](https://github.com/docker-library/postgres/blob/0b87a9b/docker-entrypoint.sh)  
  Explains how to properly implement container images using the `ENTRYPOINT` and `CMD` Dockerfile instructions.
* [Manage data in Docker | Docker Documentation](https://docs.docker.com/storage/)  
  For basic concepts regarding using volumes and bind-mounts, and the proper scenarios for using each of the methods.
* The manual page of `docker-run(1)`  
  Explains the available command options of the `docker run` command.
* The manual page of `docker-cp(1)`  
  Explains how to use the `docker cp` command.
