import { useUser } from "../hooks/useUser";
import UserDetails from "../components/users/UserDetails";

export default function UserPage({ id }) {
	const { data } = useUser(id);
	return <UserDetails user={data} />;
}
