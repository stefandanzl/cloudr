docker run -d \
-p 5212:5212 \
# --mount type=bind,source=/portainer/cloudr/conf.ini,target=/cloudr/conf.ini \
# --mount type=bind,source=/portainer/cloudr/cloudr.db,target=/cloudr/cloudr.db \
-v /portainer/cloudr/conf.ini:/cloudr/conf.ini \
-v /portainer/cloudr/cloudr.db:/cloudr/cloudr.db \
-v /portainer/cloudr/uploads:/cloudr/uploads \
-v /portainer/cloudr/avatar:/cloudr/avatar \
-v /portainer/cloudr/mount:/cloudr/mount \
--name cloudr \
--restart always \
ghcr.io/stefandanzl/cloudr:latest

