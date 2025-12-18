import UserPage from "./pages/UserPage";
import UserListPage from "./pages/UserListPage";
import WebSocketStreamingComponent from "./components/WebSocketStreamingComponent";

function App() {
	return (
		<div>
			<h1>gRPC Gateway Client</h1>

			<h2>Single User</h2>
			<UserPage id={1} />

			<h2>Streaming Users</h2>
			<UserListPage />

			<h2>WebSocket Streaming Console</h2>
			<WebSocketStreamingComponent />
		</div>
	);
}

export default App;
