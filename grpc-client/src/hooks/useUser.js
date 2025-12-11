import { useQuery } from "@tanstack/react-query";
import { getUser } from "../api/userApi";

export const useUser = (id) =>
	useQuery({
		queryKey: ["user", id],
		queryFn: () => getUser(id),
	});
