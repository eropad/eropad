ARG APPDIR=/usr/app
ARG BASEIMAGE=node:18-alpine

FROM $BASEIMAGE as build
ARG APPDIR
WORKDIR $APPDIR
COPY package-lock.json package.json tsconfig.json ./
RUN npm ci --ignore-scripts
COPY src src
RUN npm run prepack

FROM $BASEIMAGE as prepare
ARG APPDIR
WORKDIR $APPDIR
COPY package-lock.json package.json ./
RUN npm ci --production --ignore-scripts

FROM $BASEIMAGE
ARG APPDIR
WORKDIR $APPDIR
COPY package.json package.json
COPY --from=build $APPDIR/dist dist
COPY --from=prepare $APPDIR/node_modules node_modules

CMD ["npm", "run", "start"]
