export async function streamUsers(onMessage) {
	const baseUrl = import.meta.env.VITE_API_BASE_URL;
	const response = await fetch(baseUrl + "/users");

	const reader = response.body.getReader();
	const decoder = new TextDecoder("utf-8");
	let buffer = "";

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });

		// Split buffer by newline
		const lines = buffer.split("\n");
		buffer = lines.pop(); // keep incomplete line for next read

		for (const line of lines) {
			if (line.trim()) {
				try {
					const parsed = JSON.parse(line);
					if (parsed?.result) {
						onMessage(parsed.result); // push {id, name}
					}
				} catch (err) {
					console.error("JSON parse error:", err, line);
				}
			}
		}
	}
}
