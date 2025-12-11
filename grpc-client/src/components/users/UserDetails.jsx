export default function UserDetails({ user }) {
	if (!user) return <p>Loading...</p>;

	return (
		<div>
			<h2>User #{user.id}</h2>
			<p>Name: {user.name}</p>
		</div>
	);
}
