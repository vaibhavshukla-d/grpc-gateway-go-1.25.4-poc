export default function UserList({ users }) {
	if (!Array.isArray(users)) return <p>No users yet...</p>;
	if (users.length === 0) return <p>No users available</p>;

	return (
		<ul>
			{users.map((u) => (
				<li key={u.id}>
					{u.id} — {u.name}
				</li>
			))}
		</ul>
	);
}
