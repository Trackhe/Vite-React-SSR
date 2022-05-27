import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export const paths = {
  template: path.resolve(__dirname, '.', 'index.html'),
  server: path.resolve(__dirname, '.', 'server/src/index.jsx'),
  clientoutput: path.resolve(__dirname, '.', 'build/client'),
  serverOutput: path.resolve(__dirname, '.', 'build/server'),
  public: path.resolve(__dirname, '.', 'build/public'),
};

function ssrPlugin() {
  /**
   * @type {import('vite').Plugin}
   */
  return {
    name: "ssrPlugin",

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== "/") {
          return next();
        }

        const { renderInNode } = await server.ssrLoadModule(path.resolve(__dirname, "./server/src/server"));

        const indexHtml = await fs.readFile(path.resolve(__dirname, "./index.html"),"utf-8");

        const url = new URL("http://localhost:3000/" + req.url);
        const template = await server.transformIndexHtml(url.toString(),indexHtml);

        /**
         * Scrape out `head` contents injected by Vite. This is used for React runtime and fast refresh.
         * It will be injected into the `<Html>` React component shell in the server entrypoint.
         */
        const head = template.match(/<head>(.+?)<\/head>/s)[1];

        return renderInNode({ res, head });
      });
    },
  };
}

export default defineConfig({
  plugins: [react()],
})