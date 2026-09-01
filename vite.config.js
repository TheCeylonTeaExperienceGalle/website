import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { fileURLToPath } from 'node:url'

const rootPath = fileURLToPath(new URL('.', import.meta.url))
const blogArticleRoute = '/blog/why-you-should-visit-the-ceylon-tea-experience-in-galle'

function serveBlogEntryHtml() {
  const rewrite = (request, _response, next) => {
    const pathname = request.url?.split('?')[0].replace(/\/+$/, '') || '/'

    if (pathname === '/blog') {
      request.url = '/blog/index.html'
    } else if (pathname === blogArticleRoute) {
      request.url = `${blogArticleRoute}/index.html`
    } else if (/^\/s\/[^/]+\/?$/.test(pathname)) {
      request.url = '/index.html'
    }

    next()
  }

  return {
    name: 'serve-blog-entry-html',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    serveBlogEntryHtml(),
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  base: "/",
  build: {
    rollupOptions: {
      input: {
        main: `${rootPath}index.html`,
        blog: `${rootPath}blog/index.html`,
        blogArticle: `${rootPath}blog/why-you-should-visit-the-ceylon-tea-experience-in-galle/index.html`,
      },
    },
  },
})
