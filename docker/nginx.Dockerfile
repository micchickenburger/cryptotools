FROM nginx:latest

RUN install -d /etc/nginx/ssl/ && \
  openssl req -x509 -newkey rsa:4096 -keyout /etc/nginx/ssl/nginx-selfsigned.key \
  -out /etc/nginx/ssl/nginx-selfsigned.crt -days 3650 -nodes -subj "/CN=localhost"
COPY docker/nginx.conf /etc/nginx/nginx.conf
