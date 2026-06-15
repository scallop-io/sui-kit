import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			src: path.resolve(__dirname, "./src"),
		},
		extensions: [".ts", ".js", ".mts", ".mjs"],
	},
	test: {
		globals: true,
		environment: "node",
		testTimeout: 60000,
		include: ["test/**/*.spec.ts"],
	},
});
