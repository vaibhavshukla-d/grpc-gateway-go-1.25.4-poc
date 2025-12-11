import UserPage from "./pages/UserPage";
import UserListPage from "./pages/UserListPage";

function App() {
	return (
		<div>
			<h1>gRPC Gateway Client</h1>

			<h2>Single User</h2>
			<UserPage id={1} />

			<h2>Streaming Users</h2>
			<UserListPage />
		</div>
	);
}

export default App;
