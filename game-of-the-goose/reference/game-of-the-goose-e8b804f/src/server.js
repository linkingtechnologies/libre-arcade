import { Server, Origins } from "boardgame.io/server";
import path from "path";
import serve from "koa-static";
import { GooseGame } from "./game";

const server = Server({
    games: [GooseGame],
    origins: [Origins.LOCALHOST_IN_DEVELOPMENT],
});
const PORT = process.env.PORT || 8000;

if (process.env.NODE_ENV === "development") {
    server.run(PORT);
} else {
    // Build path relative to the server.js file
    const frontEndAppBuildPath = path.resolve(__dirname, "../build");
    server.app.use(serve(frontEndAppBuildPath));

    server.run(PORT, () => {
        server.app.use(
            async (ctx, next) => await serve(frontEndAppBuildPath)(Object.assign(ctx, { path: "index.html" }), next)
        );
    });
}
