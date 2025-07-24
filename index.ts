import { file } from "bun";

Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    // index.html
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(file("./src/index.html"));
    }
    // js/ts/tsx 번들링 파일
    if (url.pathname.endsWith(".js") || url.pathname.endsWith(".tsx")) {
      return new Response(file(`./src${url.pathname}`));
    }
    // css 파일
    if (url.pathname.endsWith(".css")) {
      return new Response(file(`./src${url.pathname}`));
    }
    // assets (이미지, 아이콘 등)
    if (url.pathname.startsWith("/assets/")) {
      return new Response(file(`.${url.pathname}`));
    }
    return new Response("Not found", { status: 404 });
  },
}); 