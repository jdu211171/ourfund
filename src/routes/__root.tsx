import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter
} from '@tanstack/react-router'

import appCss from '../styles.css?url'

const CLIENT_BOOTSTRAP_FALLBACK = `
(() => {
  const start = () => {
    if (self.__ourfundClientBootstrapStarted || self.$_TSR?.hydrated) return

    const rootRoute = self.$_TSR?.router?.manifest?.routes?.__root__
    const scripts = rootRoute?.scripts ?? rootRoute?.assets ?? []
    const asset = scripts.find(item => item?.attrs?.src || item?.children)
    if (!asset) return

    const existing = Array.from(document.scripts).some(script => {
      if (script.dataset.ourfundBootstrap === 'true') return true
      if (script.type !== 'module') return false
      if (asset.attrs?.src && script.src.endsWith(asset.attrs.src)) return true
      return Boolean(asset.children && script.textContent?.includes(asset.children))
    })
    if (existing) return

    self.__ourfundClientBootstrapStarted = true
    const script = document.createElement('script')
    script.dataset.ourfundBootstrap = 'true'

    const attrs = asset.attrs ?? {}
    for (const [name, value] of Object.entries(attrs)) {
      if (name === 'src' && value) {
        script.src = String(value)
      } else if (value === true) {
        script.setAttribute(name, '')
      } else if (value !== false && value != null) {
        script.setAttribute(name, String(value))
      }
    }

    if (!script.type) script.type = 'module'
    if (asset.children) script.textContent = asset.children
    document.head.appendChild(script)
  }

  queueMicrotask(start)
})()
`

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error)
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate()
              reset()
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Lovable App' },
      {
        name: 'description',
        content:
          "Pixel Perfect Twin replicates an existing app's design, spacing, and fonts for a family budget management experience."
      },
      { name: 'theme-color', content: '#4f46e5' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'author', content: 'Lovable' },
      { property: 'og:title', content: 'Lovable App' },
      {
        property: 'og:description',
        content:
          "Pixel Perfect Twin replicates an existing app's design, spacing, and fonts for a family budget management experience."
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:site', content: '@Lovable' },
      { name: 'twitter:title', content: 'Lovable App' },
      {
        name: 'twitter:description',
        content:
          "Pixel Perfect Twin replicates an existing app's design, spacing, and fonts for a family budget management experience."
      },
      {
        property: 'og:image',
        content:
          'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0e8333e3-e346-4b34-889a-a2caa55b21fc/id-preview-e9433c62--04bd4430-550a-4b65-a0ba-b2491da7e833.lovable.app-1779569541024.png'
      },
      {
        name: 'twitter:image',
        content:
          'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0e8333e3-e346-4b34-889a-a2caa55b21fc/id-preview-e9433c62--04bd4430-550a-4b65-a0ba-b2491da7e833.lovable.app-1779569541024.png'
      }
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss
      },
      {
        rel: 'manifest',
        href: `${import.meta.env.BASE_URL}manifest.webmanifest`
      },
      {
        rel: 'apple-touch-icon',
        href: `${import.meta.env.BASE_URL}pwa-192.png`
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
})

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static bootstrap fallback for TanStack's serialized client module asset */}
        <script dangerouslySetInnerHTML={{ __html: CLIENT_BOOTSTRAP_FALLBACK }} />
      </body>
    </html>
  )
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext()

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}
