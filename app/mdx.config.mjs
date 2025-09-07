import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// Exported config is loaded by @next/mdx at runtime, so plugin
// functions don't need to be serialized through Next's config.
export default {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
}

