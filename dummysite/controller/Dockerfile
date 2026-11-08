FROM golang:1.24-alpine AS build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
RUN CGO_ENABLED=0 go build -o /out/controller .

FROM gcr.io/distroless/static-debian12

COPY --from=build /out/controller /controller

ENTRYPOINT ["/controller"]
