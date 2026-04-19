FROM denoland/deno:alpine

RUN apk add --no-cache jq curl apprise

WORKDIR /app

COPY deps.ts .
RUN deno cache deps.ts

COPY * ./

RUN chmod +x *.sh

RUN deno cache validateEnv.ts main.ts

ENTRYPOINT ["/app/entrypoint.sh"]
