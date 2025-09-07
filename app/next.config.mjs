import createMDX from '@next/mdx'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// Use Webpack-compatible MDX options. Turbopack requires serializable
// options, so run without --turbopack (see package.json). This enables
// remark-math and rehype-katex so inline math like \(a<b\) parses.
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
})

// If you want .mdx to be importable AND routable pages:
export default withMDX({
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
})
