import { useEffect, useState } from "react";
import { streamUsers } from "../api/streaming/userStream";

export function useUserStream() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let cancelled = false;

		// Stream users in real-time
		streamUsers((user) => {
			if (!cancelled) {
				setUsers((prev) => [...prev, user]);
				if (loading) setLoading(false);
			}
		}).catch((err) => {
			if (!cancelled) {
				setError(err);
				setLoading(false);
			}
		});

		return () => {
			cancelled = true;
		};
	}, []);

	return { users, loading, error };
}
