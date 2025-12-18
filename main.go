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
			return err
		}
		time.Sleep(1 * time.Second)
	}
	return nil
}

// CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Agent, X-Grpc-Web")
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
		grpcServer := grpc.NewServer()
		RegisterUserServiceServer(grpcServer, &server{})
		log.Println("gRPC Server running on :50051")
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve gRPC: %v", err)
		}
	}()

	// Give gRPC server time to start
	time.Sleep(100 * time.Millisecond)

	// Create gRPC connection for the proxy
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Setup gRPC Gateway
	mux := runtime.NewServeMux()
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	err := RegisterUserServiceHandlerFromEndpoint(ctx, mux, "localhost:50051", opts)
	if err != nil {
		log.Fatalf("Failed to register gateway: %v", err)
	}

	// Create WebSocket proxy that wraps the gRPC gateway
	// This allows WebSocket connections to proxy to gRPC
	wsProxy := wsproxy.WebsocketProxy(mux)

	// Wrap with CORS middleware
	handler := corsMiddleware(wsProxy)

	log.Println("HTTP Gateway with WebSocket Proxy running on :8080")
	log.Println("- REST API: http://localhost:8080")
	log.Println("- WebSocket: ws://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}