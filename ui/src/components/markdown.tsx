import ReactMarkdown from "react-markdown";

const markdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="md-h2">{children}</h2>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="md-p">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="md-ul">{children}</ul>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="md-a">
      {children}
    </a>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="md-strong">{children}</strong>
  ),
  span: ({ style, children }: { style?: React.CSSProperties; children?: React.ReactNode }) => (
    <span style={style}>{children}</span>
  ),
}

interface MarkdownProps {
  content: string
}

function Markdown({ content }: MarkdownProps) {
  return (
    <div className="article-body">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  )
}

export default Markdown;
