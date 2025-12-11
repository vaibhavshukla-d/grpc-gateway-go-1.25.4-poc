import UserList from "../components/users/UserList";
import { useUserStream } from "../hooks/useUserStream";

export default function UserListPage() {
	const { users, loading, error } = useUserStream();

	if (loading) return <p>Loading users...</p>;
	if (error) return <p>Error: {error.message}</p>;

	return <UserList users={users} />;
}
