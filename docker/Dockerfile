FROM node:hydrogen-slim

WORKDIR /build
COPY src/package.json src/package-lock.jso[n] /build/
RUN npm ci

WORKDIR /src
COPY ./src .
COPY docker/entrypoint.sh /usr/bin/entrypoint.sh
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

CMD npm run start
