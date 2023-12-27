FROM node:18
EXPOSE 3000

WORKDIR /src
COPY ./Makefile ./
COPY ./package.json ./yarn.lock ./

RUN make deps
COPY . .

ENTRYPOINT ["make", "serve"]
