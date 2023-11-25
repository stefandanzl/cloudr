FROM alpine:latest

WORKDIR /cloudr
COPY cloudr ./cloudr

RUN apk update \
    && apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Europe/Vienna /etc/localtime \
    && echo "Europe/Vienna" > /etc/timezone \
    && chmod +x ./cloudr \
    && mkdir -p /data/aria2 \
    && chmod -R 766 /data/aria2

EXPOSE 5212
VOLUME ["/cloudr/uploads", "/cloudr/avatar", "/data"]

ENTRYPOINT ["./cloudr"]
