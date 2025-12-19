# Build Stage
FROM golang:1.25.4 AS builder
 
WORKDIR /app
 
# Copy go mod and sum files
COPY go.mod go.sum ./
 
# Download dependencies
RUN go mod download
 
# Copy source code
COPY . .
 
# Build the application
# CGO_ENABLED=0 is for static binary, useful if using scratch or alpine
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -o main .
 
# Run Stage
FROM alpine:latest
 
WORKDIR /app
 
# Copy binary from builder
COPY --from=builder /app/main .
 
# Expose ports
EXPOSE 8080 50051
 
# Command to run the executable
CMD ["./main"]