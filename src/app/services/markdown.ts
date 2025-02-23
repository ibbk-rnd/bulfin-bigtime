import { marked, RendererObject } from 'marked';

export function markedConfig() {
  const renderer = {
    link(href: any, title: any, text: any) {
      const link = marked.Renderer.prototype.link.call(this, href);
      return link.replace('<a', "<a target='_blank' class='text-decoration-none' ");
    },
  } as RendererObject;

  return { renderer: renderer };
}
