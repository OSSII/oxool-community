0 0 */1 * * root find /var/cache/oxool -type f -a -atime +10 -exec rm {} \;
