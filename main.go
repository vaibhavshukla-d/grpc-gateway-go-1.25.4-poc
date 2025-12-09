package main

import (
	"context"
	"log"
	"net"
	"time"

	"google.golang.org/grpc"
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
		stream.Send(user)
		time.Sleep(1 * time.Second) // Simulate delay
	}
	
	return nil
}

func main() {
	lis, _ := net.Listen("tcp", ":50051")
	
	grpcServer := grpc.NewServer()
	RegisterUserServiceServer(grpcServer, &server{})
	
	log.Println("Server running on :50051")
	grpcServer.Serve(lis)
}