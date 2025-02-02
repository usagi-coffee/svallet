export function dialog(node, { onclose = () => {} }) {
	node.showModal();

	let closed = false;
	function close(event) {
		if (event.target !== node) return;
		if (closed) return;
		closed = true;

		node.close();
		onclose();
	}

	node.addEventListener('click', close);
	node.addEventListener('close', close);

	return {
		destroy() {}
	};
}
