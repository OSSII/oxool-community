sudo apt update -y
# Install for oxool-community
sudo apt install -y build-essential libsqlite3-dev libcurl4-openssl-dev libcppunit-dev libcap-dev libtool libpng-dev automake m4 wget curl autoconf pkg-config openssl net-tools
# Install for build deb package
sudo apt install -y devscripts debhelper dh-systemd
# Install for poco
sudo apt install -y libodbc1 libpcre16-3 libpcre3-dev libpcre32-3 libpcrecpp0v5
# Install for oxoffice
sudo apt install -y openjdk-8-jdk libgumbo1 hunspell
sudo apt install -y python-pip
sudo pip install polib
# more dependencies
sudo apt install -y libpam0g-dev
