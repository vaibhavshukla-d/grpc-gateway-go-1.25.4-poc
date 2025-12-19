package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/tmc/grpc-websocket-proxy/wsproxy"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// Server implementation
type server struct {
	UnimplementedUserServiceServer
}

// Normal unary RPC
func (s *server) GetUser(ctx context.Context, req *GetUserRequest) (*User, error) {
	log.Printf("GetUser called: %d", req.Id)
	return &User{Id: req.Id, Name: "Alice"}, nil
}

// Server-side streaming RPC
func (s *server) ListUsers(req *ListUsersRequest, stream UserService_ListUsersServer) error {
	log.Println("ListUsers called (streaming)")
	users := []*User{
		{Id: 1, Name: "Alice"},
		{Id: 2, Name: "Bob"},
		{Id: 3, Name: "Charlie"},
	}

	for _, user := range users {
		log.Printf("Sending: %s", user.Name)
		if err := stream.Send(user); err != nil {
			log.Printf("Error sending user: %v", err)
			return err
		}
		time.Sleep(1 * time.Second)
	}
	log.Println("ListUsers completed successfully")
	return nil
}

// CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Agent, X-Grpc-Web, Sec-WebSocket-Protocol")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Grpc-Status, Grpc-Message")

		// Handle preflight OPTIONS request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Call the next handler
		next.ServeHTTP(w, r)
	})
}

func main() {
	// Start gRPC server in a goroutine
	go func() {
		lis, err := net.Listen("tcp", ":50051")
		if err != nil {
			log.Fatalf("Failed to listen: %v", err)
		}
		grpcServer := grpc.NewServer(
			// Add options to handle streaming better
			grpc.MaxConcurrentStreams(100),
		)
		RegisterUserServiceServer(grpcServer, &server{})
		log.Println("gRPC Server running on :50051")
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve gRPC: %v", err)
		}
	}()

	// Give gRPC server time to start
	time.Sleep(100 * time.Millisecond)

	// Start HTTP server with gRPC Gateway
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Create gRPC Gateway mux
	mux := runtime.NewServeMux()

	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	err := RegisterUserServiceHandlerFromEndpoint(ctx, mux, "localhost:50051", opts)
	if err != nil {
		log.Fatalf("Failed to register gateway: %v", err)
	}

	// Debug middleware to log writes from mux
	loggingMux := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("DEBUG: mux received request: %s %s", r.Method, r.URL.Path)
		for name, values := range r.Header {
			for _, value := range values {
				log.Printf("DEBUG: Header %s: %s", name, value)
			}
		}
		lww := &logResponseWriter{ResponseWriter: w}
		mux.ServeHTTP(lww, r)
		log.Printf("DEBUG: mux finished request. Written: %d bytes, Status: %d", lww.bytesWritten, lww.statusCode)
	})

	// Create WebSocket proxy with custom options
	wsProxy := wsproxy.WebsocketProxy(
		loggingMux,
		wsproxy.WithForwardedHeaders(func(header string) bool {
			// Forward these headers
			switch header {
			case "Authorization", "X-User-Agent", "Content-Type":
				return true
			default:
				return false
			}
		}),
	)

	// Wrap with CORS middleware
	handler := corsMiddleware(wsProxy)

	// Create HTTP server with better configuration
	srv := &http.Server{
		Addr:         ":8080",
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Println("HTTP Gateway with WebSocket Proxy running on :8080")
	log.Println("- REST API: http://localhost:8080")
	log.Println("- WebSocket: ws://localhost:8080")
	log.Fatal(srv.ListenAndServe())
}
